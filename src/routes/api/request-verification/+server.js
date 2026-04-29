import { json } from '@sveltejs/kit';
import { createEmailVerification } from '$lib/server/session.js';
import { sendEmail, appBaseUrl } from '$lib/server/email.js';
import { checkRateLimit } from '$lib/server/rate-limit.js';
import { getPool } from '$lib/server/sql.js';

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST({ locals, getClientAddress }) {
	if (!locals.userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const ip = getClientAddress() || 'unknown';
	const limit = await checkRateLimit(
		`verify:user:${locals.userId}`,
		RATE_LIMIT_MAX,
		RATE_LIMIT_WINDOW_MS
	);
	const ipLimit = await checkRateLimit(`verify:ip:${ip}`, RATE_LIMIT_MAX * 3, RATE_LIMIT_WINDOW_MS);
	if (!limit.allowed || !ipLimit.allowed) {
		return json(
			{ error: 'Too many verification requests. Try again later.' },
			{ status: 429 }
		);
	}

	const pool = getPool();
	const r = await pool.query(
		`SELECT email, email_verified FROM user_password_logins WHERE user_id = $1`,
		[locals.userId]
	);
	const row = r.rows[0];
	if (!row) {
		return json({ error: 'User not found' }, { status: 404 });
	}
	if (row.email_verified) {
		return json({ success: true, alreadyVerified: true });
	}

	const token = await createEmailVerification(locals.userId, row.email);
	const link = `${appBaseUrl()}/verify-email/${token}`;
	await sendEmail({
		to: row.email,
		subject: 'Verify your nomStack email',
		text: `Confirm your email by visiting:\n\n${link}\n\nThis link expires in 24 hours.`,
		html: `<p>Confirm your email: <a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`
	});

	return json({ success: true });
}
