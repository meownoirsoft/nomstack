import nodemailer from 'nodemailer';

let cachedTransporter = null;

function getTransporter() {
	if (cachedTransporter) return cachedTransporter;
	const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
	if (!SMTP_HOST) return null;
	cachedTransporter = nodemailer.createTransport({
		host: SMTP_HOST,
		port: Number(SMTP_PORT) || 587,
		secure: Number(SMTP_PORT) === 465,
		auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
	});
	return cachedTransporter;
}

function getFromAddress() {
	return process.env.EMAIL_FROM || process.env.SMTP_FROM || 'no-reply@nomstack.local';
}

async function sendViaResend({ from, to, subject, html, text }) {
	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ from, to, subject, html, text })
	});
	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
	}
	const data = await res.json().catch(() => ({}));
	return { delivered: true, messageId: data?.id, provider: 'resend' };
}

async function sendViaSmtp({ from, to, subject, html, text }) {
	const transporter = getTransporter();
	if (!transporter) {
		throw new Error('SMTP not configured');
	}
	const info = await transporter.sendMail({ from, to, subject, html, text });
	return { delivered: true, messageId: info.messageId, provider: 'smtp' };
}

/**
 * Send an email. Prefers the Resend HTTP API when `RESEND_API_KEY` is set,
 * falls back to SMTP via nodemailer when `SMTP_HOST` is set, and logs to the
 * console when neither is configured (handy for local dev).
 */
export async function sendEmail({ to, subject, html, text }) {
	const from = getFromAddress();

	if (process.env.RESEND_API_KEY) {
		try {
			return await sendViaResend({ from, to, subject, html, text });
		} catch (err) {
			console.error('[email] Resend send failed:', err.message);
			// Fall through to SMTP if it's available, otherwise return error.
		}
	}

	if (process.env.SMTP_HOST) {
		try {
			return await sendViaSmtp({ from, to, subject, html, text });
		} catch (err) {
			console.error('[email] SMTP send failed:', err.message);
			return { delivered: false, error: err.message };
		}
	}

	// No provider configured — log so dev flows still work.
	console.log('[email] no provider configured — would have sent:');
	console.log(`  to: ${to}`);
	console.log(`  from: ${from}`);
	console.log(`  subject: ${subject}`);
	console.log(`  ${text || html}`);
	return { delivered: false, logged: true };
}

export function appBaseUrl() {
	return (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
}
