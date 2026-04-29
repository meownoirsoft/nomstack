import { json } from '@sveltejs/kit';
import {
	registerUser,
	createSessionForUserId,
	validatePasswordStrength,
	createEmailVerification
} from '$lib/server/session.js';
import { sendEmail, appBaseUrl } from '$lib/server/email.js';
import { checkRateLimit } from '$lib/server/rate-limit.js';

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST({ request, cookies, getClientAddress }) {
	const ip = getClientAddress() || 'unknown';
	const ipLimit = await checkRateLimit(`signup:ip:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
	if (!ipLimit.allowed) {
		return json(
			{ error: 'Too many signup attempts from this address. Try again later.' },
			{ status: 429, headers: { 'Retry-After': Math.ceil(ipLimit.retryAfterMs / 1000).toString() } }
		);
	}
	let email;
	let password;
	let displayName;
	try {
		const body = await request.json();
		email = body?.email;
		password = body?.password;
		displayName = body?.displayName;
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	if (!email || !password) {
		return json({ error: 'Email and password are required' }, { status: 400 });
	}

	const passwordError = validatePasswordStrength(password);
	if (passwordError) {
		return json({ error: passwordError }, { status: 400 });
	}

	let userId;
	try {
		userId = await registerUser(email, password, displayName);
	} catch (err) {
		if (err?.code === '23505') {
			return json({ error: 'An account with that email already exists' }, { status: 409 });
		}
		console.error('signup failed:', err);
		return json({ error: 'Failed to create account' }, { status: 500 });
	}

	const sessionId = await createSessionForUserId(userId);
	cookies.set('session', sessionId, {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: SESSION_MAX_AGE_SECONDS,
		path: '/'
	});

	// Best-effort send verification email. Failure here doesn't block signup —
	// the user can request a new verification email from the app banner.
	try {
		const token = await createEmailVerification(userId, email);
		const link = `${appBaseUrl()}/verify-email/${token}`;
		await sendEmail({
			to: email,
			subject: 'Verify your nomStack email',
			text: `Welcome to nomStack! Confirm your email by visiting:\n\n${link}\n\nThis link expires in 24 hours.`,
			html: `<p>Welcome to nomStack!</p><p>Confirm your email: <a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`
		});
	} catch (err) {
		console.error('signup verification email failed:', err);
	}

	return json({ success: true, userId });
}
