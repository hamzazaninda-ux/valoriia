import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sessionCookieOptions } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete('session', sessionCookieOptions);
	cookies.delete('nv_admin_pin', { path: '/' });
	return json({ success: true });
};
