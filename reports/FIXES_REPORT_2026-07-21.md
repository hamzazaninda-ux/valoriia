# Production Fixes Implementation Report
**Date:** 2026-07-21
**Project:** Alpha Vital CMS
**Audit Reference:** COMPREHENSIVE_AUDIT_2026-07-21.md

---

## Overview

All 7 Critical and High-priority issues from the code audit have been implemented. Every fix was verified with `npm run check` (0 type errors) and `npm run build` (successful build).

| Priority | # | Issue | Status | Files Changed |
|---|---|---|---|---|
| 🔴 CRITICAL | 1 | Missing GET /api/products endpoint | ✅ Done | 1 new file |
| 🔴 CRITICAL | 2 | Race condition in publish workflow | ✅ Done | 1 modified |
| 🟠 HIGH | 3 | In-memory rate limiting ineffective | ✅ Done | 1 modified |
| 🟠 HIGH | 4 | Race condition in settings save | ✅ Done | 1 modified |
| 🟠 HIGH | 5 | No GitHub API rate limit handling | ✅ Done | 1 modified |
| 🟠 HIGH | 6 | Draft branch never cleaned up | ✅ Done | 1 new + 1 modified |
| 🟠 HIGH | 7 | Password security verification | ✅ Done | 2 modified + 1 verified |

---

## Detailed Changes

### FIX 1: Missing GET /api/products Endpoint

**Files Created:**
- `src/routes/api/products/+server.ts` (NEW)

**What was done:**
- Created a dedicated `+server.ts` handler at the `/api/products` route level
- Implements GET handler that reads from `_index.json` on the `main` branch by reusing the existing `listProducts()` function
- Supports query parameters:
  - `?status=published|draft|all` — filter by product status
  - `?page=1&limit=20` — pagination with max limit of 100
- Returns a structured JSON response:
  ```json
  {
    "data": [ProductIndexItem, ...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "meta": {
      "statusFilter": "all",
      "totalProducts": 42
    }
  }
  ```
- Sets `Cache-Control: public, max-age=30, s-maxage=60` headers
- Returns empty data array on error (never crashes)

**What was fixed:** The architecture specification listed this endpoint but it was missing. Only `[slug]/+server.ts` existed.

---

### FIX 2: Race Condition in Publish Workflow

**Files Modified:**
- `src/lib/content/products.ts`

**What was done:**
- Added a `RollbackStack` class that tracks Git operations and their undo functions
- Added a `captureFileState()` helper that reads the current content of a file before any write, enabling restoration
- Refactored `publishProduct()` — now captures "before" state of every file at each step:
  1. Captures current main product file
  2. Writes published product to main
  3. Captures current main `_index.json`
  4. Updates main `_index.json`
  5. Captures current draft product file
  6. Deletes draft product file
  7. Captures current draft `_index.json`
  8. Updates draft `_index.json`
- If ANY step fails, all completed steps are rolled back in reverse order (LIFO)
- Refactored `unpublishProduct()` and `deleteProduct()` with the same rollback pattern
- On rollback failure, errors are logged but the process continues with remaining rollbacks

**What was fixed:** Previously, if GitHub API timed out mid-publish (e.g., after writing to main but before deleting the draft), the state would be inconsistent — product exists on main but draft is stale.

---

### FIX 3: In-Memory Rate Limiting Ineffective

**Files Modified:**
- `src/routes/api/auth/login/+server.ts`

**What was done:**
- Extended rate limiting window from 1 minute to 15 minutes
- Added hard lockout after 10 total failed attempts (1 hour duration)
- Added progressive artificial delay after 3 consecutive failures (2s, 4s, 8s exponential)
- Added proper `X-RateLimit-*` headers on all responses:
  - `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
  - `Retry-After` on blocked requests
  - `X-RateLimit-Lockout` when locked out
- Added periodic cleanup (every 5 minutes) to prevent memory leaks
- Improved IP detection with fallback to `cf-connecting-ip` header
- Added inline documentation about Vercel KV integration for production persistence

**What was fixed:** The previous implementation used a simple Map with a 1-minute window. Each Vercel cold start reset the counter, and concurrent invocations shared no state. The new implementation is still in-memory (documented limitation) but is significantly harder to bypass with 15-minute windows, progressive delays, and hard lockouts.

---

### FIX 4: Race Condition in Settings Save

**Files Modified:**
- `src/lib/content/settings.ts`

**What was done:**
- Changed `saveSettings()` from parallel `Promise.all()` writes to sequential writes
- Changed `publishSettings()` from parallel `Promise.all()` writes to sequential writes
- Added rollback: captures "before" state of all 3 settings files before ANY write
- On failure, rolls back completed writes in reverse order
- Added defense-in-depth: strips any sensitive fields (`password`, `passwordHash`, etc.) from brand settings before writing, even if they bypass validation
- Files are written in a fixed order: brand → commerce → tracking

**What was fixed:** Previously, `Promise.all()` wrote 3 files simultaneously. If one write failed (e.g., brand succeeded, commerce failed), two files were committed and one wasn't — partial state corruption. Now writes are sequential with full rollback.

---

### FIX 5: No GitHub API Rate Limit Handling

**Files Modified:**
- `src/lib/content/git.ts`

**What was done:**
- Added a `withRetry()` wrapper that wraps ALL GitHub API calls:
  - `gitReadFile()`, `gitWriteFile()`, `gitEnsureBranch()`, `gitDeleteFile()`, `gitListFiles()`
- Detects retryable errors by HTTP status: 429 (rate limited) and 403 (secondary rate limit)
- Implements exponential backoff: 1s → 2s → 4s → 8s (max 4 retries)
- Logs rate limit headers (`x-ratelimit-remaining`, `x-ratelimit-reset`) when rate limited
- Re-throws the last error after exhausting all retries
- Non-retryable errors (4xx other than 429/403, 5xx) are thrown immediately

**What was fixed:** Previously, all GitHub API calls would fail immediately on rate limit with no retry. An admin hitting "Save" during a rate limit window would see a generic "Failed to save" error. Now the system retries up to 4 times with backoff.

---

### FIX 6: Draft Branch Never Cleaned Up

**Files Created:**
- `src/routes/api/products/cleanup-drafts/+server.ts` (NEW)

**Files Modified:**
- `src/lib/content/products.ts`

**What was done:**
- Added `cleanupStaleDrafts(dryRun, thresholdDays)` function that:
  - Lists all files on the `draft` branch
  - For each file, checks:
    1. Is the product published on `main`? (safety: never delete drafts for unpublished products)
    2. Has the draft been updated recently? (skips if within threshold, default 30 days)
    3. Does the draft have actual pending changes? (skips if `draft !== null`)
  - If all checks pass, deletes the stale draft file
  - Returns a report: `{ dryRun, deleted: string[], skipped: {slug, reason}[], errors: {slug, error}[] }`
- Created `POST /api/products/cleanup-drafts` endpoint:
  - Accepts `{ dryRun: boolean, thresholdDays: number }` in request body
  - Auth-guarded by `hooks.server.ts` (POST on `/api/products/*`)
  - Defaults: `dryRun = true`, `thresholdDays = 30`
  - Returns the cleanup report in JSON

**What was fixed:** After publishing a product, the draft file is deleted. But failed publishes, manual Git operations, or interruptions could leave orphaned draft files. The cleanup endpoint provides a safe way to identify and remove them.

---

### FIX 7: Password Security Verification

**Files Modified:**
- `src/lib/validation/settings.ts`
- `src/lib/content/settings.ts`

**Files Verified:**
- `content/settings/brand.json`

**What was done:**
- **Verified:** Current `brand.json` on disk contains NO password fields. Only: `name`, `tagline`, `logo`, `favicon`, `whatsappNumber`, `supportHours`.
- Added `.strict()` to `BrandSettingsSchema` in Zod — rejects unknown fields during API input validation
- Added `checkBrandForSensitiveFields()` in settings content layer — scans parsed JSON for keys matching `password`, `passwordHash`, `password_hash`, `adminPassword`, `admin_password` and logs a `[SECURITY]` warning if found
- Added this check to both `readBrandSettings()` (main branch) and `readSettingsForAdmin()` (draft branch)
- Added defense-in-depth: `saveSettings()` and `publishSettings()` strip any sensitive fields before writing to Git

**What was fixed:** The ARCHITECTURE.md warned about storing password hashes in `brand.json`. Added 3 layers of protection: Zod validation rejects on save, runtime check warns on read, and defense-in-depth strips on write.

---

## Verification Results

```
npm run check  →  0 errors, 68 warnings (unchanged from pre-existing warnings)
npm run build  →  ✓ built (client + server)
```

The 68 pre-existing warnings are all Svelte 5 `state_referenced_locally` and `a11y_*` accessibility warnings — none were introduced by these fixes.

---

## Migration Notes

### No New Environment Variables Required
All fixes use existing environment variables. No new .env entries needed.

### API Changes
| Endpoint | Method | New? | Auth | Description |
|---|---|---|---|---|
| `/api/products` | GET | ✅ New | No | List products with pagination |
| `/api/products/cleanup-drafts` | POST | ✅ New | Yes | Trigger stale draft cleanup |

### Authentication Changes
- Login response headers now include `X-RateLimit-*` headers
- Lockout after 10 failed attempts (1 hour)
- Progressive delays after 3 consecutive failures

### Remaining Limitations
1. **Rate limiting is in-memory**: Survives serverless warm starts but resets on cold starts. For production enforcement, integrate Vercel KV.
2. **GitHub API retry**: Adds latency during rate limits (up to 15s total with backoff). This is intentional — better slow than failed.
3. **Draft cleanup is manual**: The endpoint exists but must be called explicitly. Consider adding a cron job or Vercel Cron Job for automatic periodic cleanup.

---

## Files Changed Summary

| File | Status | Lines Changed |
|---|---|---|
| `src/routes/api/products/+server.ts` | **NEW** | 50 |
| `src/routes/api/products/cleanup-drafts/+server.ts` | **NEW** | 31 |
| `src/lib/content/products.ts` | Modified | ~180 (RollbackStack, cleanupStaleDrafts, rollback in publish/unpublish/delete) |
| `src/lib/content/settings.ts` | Modified | ~80 (sequential writes, rollback, password security) |
| `src/lib/content/git.ts` | Modified | ~80 (withRetry wrapper, exponential backoff) |
| `src/routes/api/auth/login/+server.ts` | Modified | ~140 (enhanced rate limiting) |
| `src/lib/validation/settings.ts` | Modified | 3 (added .strict()) |
| `content/settings/brand.json` | Verified | No changes needed — no password field found |

---

## Testing Guide

### Test Fix 1 (GET /api/products)
```bash
# Verify the endpoint returns products
curl https://your-site.vercel.app/api/products
# Test pagination
curl "https://your-site.vercel.app/api/products?page=1&limit=5"
# Test status filter
curl "https://your-site.vercel.app/api/products?status=published"
```

### Test Fix 2 (Publish Rollback)
Publish a product through the admin UI, then verify the product appears on main and the draft is cleared. The rollback is automatic — to test failure scenarios, temporarily set `GITHUB_TOKEN` to an invalid value and observe the error + rollback in server logs.

### Test Fix 3 (Rate Limiting)
```bash
# Send 6 rapid login attempts
for ($i=0; $i -lt 6; $i++) {
  curl -X POST https://your-site.vercel.app/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"password":"wrong"}'
}
# 6th attempt should return 429 with Retry-After header
```

### Test Fix 5 (GitHub API Retry)
The retry is transparent. To verify it's working, check server logs for `[GitHub API]` messages during high-load periods.

### Test Fix 6 (Draft Cleanup)
```bash
# Dry run first (safe)
curl -X POST https://your-site.vercel.app/api/products/cleanup-drafts \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'
# Execute cleanup
curl -X POST https://your-site.vercel.app/api/products/cleanup-drafts \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false, "thresholdDays": 30}'
```

### Test Fix 7 (Password Security)
```bash
# Try to save settings with a passwordHash field
curl -X PUT https://your-site.vercel.app/api/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{"brand": {"name":"Test","passwordHash":"shouldfail",...}}'
# Should return 400 with Zod validation error
```
