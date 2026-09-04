import type { Handle } from '@sveltejs/kit';
import { isValidSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  const url = new URL(event.url);

  // === Admin page routes ===
  if (url.pathname.startsWith('/admin')) {
    const session = event.cookies.get('session');

    if (!isValidSession(session) && url.pathname !== '/admin/login') {
      return new Response(null, {
        status: 302,
        headers: { location: '/admin/login' }
      });
    }
  }

  // === Admin API routes (write operations) ===
  // POST/PUT/DELETE on products, settings, and templates require authentication
  if (url.pathname.startsWith('/api/products') || url.pathname.startsWith('/api/settings') || url.pathname.startsWith('/api/templates')) {
    if (event.request.method !== 'GET') {
      const session = event.cookies.get('session');
      if (!isValidSession(session)) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }

  return resolve(event);
};
