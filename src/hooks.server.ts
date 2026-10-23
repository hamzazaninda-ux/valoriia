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

	const response = await resolve(event);

	// Edge & Browser Caching for Public Storefront Pages (Sub-1.5s Load Optimization)
	if (
		event.request.method === 'GET' &&
		!url.pathname.startsWith('/admin') &&
		!url.pathname.startsWith('/api') &&
		!url.pathname.startsWith('/thank-you')
	) {
		response.headers.set(
			'Cache-Control',
			'public, max-age=0, s-maxage=120, stale-while-revalidate=600'
		);
	}

	return response;
};
