import { json } from '@sveltejs/kit';
import { findUserIdByEmail, createPasswordReset } from '$lib/server/session.js';
import { sendEmail, appBaseUrl } from '$lib/server/email.js';
import { checkRateLimit } from '$lib/server/rate-limit.js';

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST({ request, getClientAddress }) {
	const ip = getClientAddress() || 'unknown';
	const limit = await checkRateLimit(
		`reset:ip:${ip}`,
		RATE_LIMIT_MAX,
		RATE_LIMIT_WINDOW_MS
	);
	if (!limit.allowed) {
		return json(
			{ error: 'Too many reset requests. Try again later.' },
			{ status: 429 }
		);
	}

	let email;
	try {
		const body = await request.json();
		email = body?.email;
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}
	if (!email) {
		return json({ error: 'Email is required' }, { status: 400 });
	}

	// Always respond with success — never leak whether the email is registered.
	const userId = await findUserIdByEmail(email);
	if (userId) {
		try {
			const token = await createPasswordReset(userId);
			const link = `${appBaseUrl()}/reset-password/${token}`;
			await sendEmail({
				to: email,
				subject: 'Reset your nomStack password',
				text: `A password reset was requested for your account. Reset link (valid 1 hour):\n\n${link}\n\nIf you didn't request this, ignore this email.`,
				html: `<p>A password reset was requested for your account.</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`
			});
		} catch (err) {
			console.error('password reset email failed:', err);
		}
	}

	return json({ success: true });
}
