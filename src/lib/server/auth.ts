import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecret(): string {
	const secret = env.SESSION_SECRET || '1e1b06e13048d513fe3c08f8cf0e844cf8179601dd05c492231928c4a33e4400';
	return secret;
}

function sign(issuedAt: string): string {
	return createHmac('sha256', getSessionSecret()).update(issuedAt).digest('base64url');
}

export function createSession(): string {
	const issuedAt = Date.now().toString();
	return `${issuedAt}.${sign(issuedAt)}`;
}

export function isValidSession(session: string | undefined): boolean {
	if (!session) return false;

	const [issuedAt, signature, ...rest] = session.split('.');
	if (rest.length || !issuedAt || !signature || !/^\d+$/.test(issuedAt)) return false;

	const issuedAtMs = Number(issuedAt);
	if (!Number.isSafeInteger(issuedAtMs) || issuedAtMs > Date.now() || Date.now() - issuedAtMs > SESSION_MAX_AGE_SECONDS * 1000) {
		return false;
	}

	const expected = Buffer.from(sign(issuedAt));
	const received = Buffer.from(signature);
	return expected.length === received.length && timingSafeEqual(expected, received);
}

export const sessionCookieOptions = {
	path: '/',
	httpOnly: true,
	sameSite: 'strict' as const,
	secure: process.env.NODE_ENV === 'production',
	maxAge: SESSION_MAX_AGE_SECONDS
};
