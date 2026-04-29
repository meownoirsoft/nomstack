import { json } from '@sveltejs/kit';
import { consumePasswordReset, validatePasswordStrength } from '$lib/server/session.js';
import { checkRateLimit } from '$lib/server/rate-limit.js';

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST({ request, getClientAddress }) {
	const ip = getClientAddress() || 'unknown';
	const limit = await checkRateLimit(
		`reset-confirm:ip:${ip}`,
		RATE_LIMIT_MAX,
		RATE_LIMIT_WINDOW_MS
	);
	if (!limit.allowed) {
		return json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
	}

	let token;
	let password;
	try {
		const body = await request.json();
		token = body?.token;
		password = body?.password;
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}
	if (!token || !password) {
		return json({ error: 'Token and new password are required' }, { status: 400 });
	}

	const passwordError = validatePasswordStrength(password);
	if (passwordError) {
		return json({ error: passwordError }, { status: 400 });
	}

	const result = await consumePasswordReset(token, password);
	if (result.error) {
		return json({ error: result.error }, { status: 400 });
	}
	return json({ success: true });
}
