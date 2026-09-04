import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sessionCookieOptions } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies }) => {
  cookies.delete('session', sessionCookieOptions);
  return json({ success: true });
};
