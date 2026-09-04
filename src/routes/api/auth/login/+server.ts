import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import bcrypt from 'bcryptjs';
import { createSession, sessionCookieOptions } from '$lib/server/auth';

// =============================================================================
// Rate Limiting Configuration
// =============================================================================
// Note: This is an in-memory store that resets on Vercel cold starts.
// For production with persistent enforcement, integrate Vercel KV:
//   https://vercel.com/docs/storage/vercel-kv
// =============================================================================

const WINDOW_MS = 15 * 60 * 1000;       // 15-minute sliding window
const MAX_ATTEMPTS_PER_WINDOW = 5;       // 5 attempts per window
const LOCKOUT_THRESHOLD = 10;            // Lockout after 10 total failures
const LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour lockout

interface RateLimitRecord {
  attempts: number;           // Count in current window
  windowStart: number;        // Start of current window
  totalFailures: number;      // Lifetime failures (for lockout)
  lockedUntil: number;        // 0 = not locked
  consecutiveFailures: number; // For progressive delay
}

const store = new Map<string, RateLimitRecord>();

// Periodic cleanup every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStore(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, record] of store) {
    if (now > record.windowStart + WINDOW_MS && record.totalFailures === 0 && now > record.lockedUntil) {
      store.delete(key);
    }
  }
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;
  return 'unknown';
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
  headers: Record<string, string>;
}

function checkRateLimit(ip: string): RateLimitResult {
  cleanupStore();
  const now = Date.now();
  let record = store.get(ip);

  if (!record) {
    record = {
      attempts: 0,
      windowStart: now,
      totalFailures: 0,
      lockedUntil: 0,
      consecutiveFailures: 0
    };
    store.set(ip, record);
  }

  // Check hard lockout
  if (record.lockedUntil > now) {
    const remaining = record.lockedUntil - now;
    return {
      allowed: false,
      retryAfterMs: remaining,
      headers: {
        'Retry-After': Math.ceil(remaining / 1000).toString(),
        'X-RateLimit-Lockout': '1',
        'X-RateLimit-Reset': Math.ceil(record.lockedUntil / 1000).toString()
      }
    };
  }

  // Reset window if expired
  if (now - record.windowStart > WINDOW_MS) {
    record.attempts = 0;
    record.windowStart = now;
    // Don't reset totalFailures — that's cumulative across windows
  }

  // Check window limit
  if (record.attempts >= MAX_ATTEMPTS_PER_WINDOW) {
    const windowEnd = record.windowStart + WINDOW_MS;
    const retryAfterMs = windowEnd - now;
    return {
      allowed: false,
      retryAfterMs: Math.max(retryAfterMs, 1000),
      headers: {
        'Retry-After': Math.ceil(Math.max(retryAfterMs, 1000) / 1000).toString(),
        'X-RateLimit-Limit': MAX_ATTEMPTS_PER_WINDOW.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(windowEnd / 1000).toString()
      }
    };
  }

  return {
    allowed: true,
    retryAfterMs: 0,
    headers: {
      'X-RateLimit-Limit': MAX_ATTEMPTS_PER_WINDOW.toString(),
      'X-RateLimit-Remaining': (MAX_ATTEMPTS_PER_WINDOW - record.attempts).toString(),
      'X-RateLimit-Reset': Math.ceil((record.windowStart + WINDOW_MS) / 1000).toString()
    }
  };
}

function recordFailure(ip: string): void {
  const record = store.get(ip);
  if (!record) return;

  record.attempts++;
  record.totalFailures++;
  record.consecutiveFailures++;

  // Lockout after threshold
  if (record.totalFailures >= LOCKOUT_THRESHOLD) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
}

function recordSuccess(ip: string): void {
  const record = store.get(ip);
  if (!record) return;
  // Reset on successful login
  store.delete(ip);
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  let password: unknown;
  try {
    ({ password } = await request.json());
  } catch {
    return json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof password !== 'string' || password.length === 0) {
    return json({ error: 'Password is required' }, { status: 400 });
  }

  const ip = getClientIp(request);

  // Rate limit check (before password verification)
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    const response = json(
      { error: 'تم تجاوز الحد الأقصى للمحاولات. حاول مرة أخرى لاحقاً.' },
      { status: 429 }
    );
    for (const [key, value] of Object.entries(rateLimit.headers)) {
      response.headers.set(key, value);
    }
    return response;
  }

  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminPasswordHash) {
    return json({ error: 'Admin password not configured' }, { status: 500 });
  }

  // Progressive delay for consecutive failures
  const record = store.get(ip);
  if (record && record.consecutiveFailures >= 3) {
    const delay = Math.min(1000 * Math.pow(2, record.consecutiveFailures - 3), 8000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  const isValid = await bcrypt.compare(password, adminPasswordHash);

  if (isValid) {
    let session: string;
    try {
      session = createSession();
    } catch {
      return json({ error: 'Session secret not configured' }, { status: 500 });
    }
    cookies.set('session', session, sessionCookieOptions);

    recordSuccess(ip);

    return json({ success: true });
  }

  recordFailure(ip);

  const remaining = record ? Math.max(0, MAX_ATTEMPTS_PER_WINDOW - record.attempts) : MAX_ATTEMPTS_PER_WINDOW;

  const response = json(
    { error: 'كلمة المرور غير صحيحة' },
    { status: 401 }
  );
  response.headers.set('X-RateLimit-Remaining', remaining.toString());

  return response;
};
