import { json } from '@sveltejs/kit';
import { verifyEmailPassword, createSessionForUserId } from '$lib/server/session.js';
import { checkRateLimit } from '$lib/server/rate-limit.js';

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export async function POST({ request, cookies, getClientAddress }) {
	const ip = getClientAddress() || 'unknown';

	const ipLimit = await checkRateLimit(`login:ip:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
	if (!ipLimit.allowed) {
		return json(
			{ error: 'Too many login attempts. Try again in a few minutes.' },
			{ status: 429, headers: { 'Retry-After': Math.ceil(ipLimit.retryAfterMs / 1000).toString() } }
		);
	}

	let email;
	let password;
	try {
		const body = await request.json();
		email = body?.email;
		password = body?.password;
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	if (!email || !password) {
		return json({ error: 'Email and password are required' }, { status: 400 });
	}

	// Per-account throttle prevents IP-rotation from grinding through one email.
	const emailLimit = await checkRateLimit(
		`login:email:${email.trim().toLowerCase()}`,
		RATE_LIMIT_MAX,
		RATE_LIMIT_WINDOW_MS
	);
	if (!emailLimit.allowed) {
		return json(
			{ error: 'Too many login attempts. Try again in a few minutes.' },
			{ status: 429, headers: { 'Retry-After': Math.ceil(emailLimit.retryAfterMs / 1000).toString() } }
		);
	}

	const result = await verifyEmailPassword(email, password);
	if (result.error) {
		return json({ error: result.error }, { status: 401 });
	}

	const sessionId = await createSessionForUserId(result.userId);

	cookies.set('session', sessionId, {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: SESSION_MAX_AGE_SECONDS,
		path: '/'
	});

	return json({ success: true, userId: result.userId });
}
