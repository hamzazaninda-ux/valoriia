import type { Handle } from '@sveltejs/kit';
import { isValidSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const url = new URL(event.url);

	// === Admin API routes (write operations) ===
	// POST/PUT/DELETE on products, settings, and templates require authentication (session or PIN cookie)
	if (
		url.pathname.startsWith('/api/products') ||
		url.pathname.startsWith('/api/settings') ||
		url.pathname.startsWith('/api/templates')
	) {
		if (event.request.method !== 'GET') {
			const session = event.cookies.get('session');
			const pinCookie = event.cookies.get('nv_admin_pin');
			if (!isValidSession(session) && pinCookie !== '2026') {
				return new Response(JSON.stringify({ error: 'Authentication required' }), {
					status: 401,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}
	}

	return resolve(event);
};
