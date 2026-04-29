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

/**
 * Send an email via SMTP. If SMTP env vars aren't configured, logs the email
 * to the server console instead — useful for local dev where wiring up SMTP
 * isn't worth the friction.
 */
export async function sendEmail({ to, subject, html, text }) {
	const transporter = getTransporter();
	const from = process.env.SMTP_FROM || 'no-reply@nomstack.local';
	if (!transporter) {
		console.log('[email] SMTP not configured — would have sent:');
		console.log(`  to: ${to}`);
		console.log(`  from: ${from}`);
		console.log(`  subject: ${subject}`);
		console.log(`  ${text || html}`);
		return { delivered: false, logged: true };
	}
	try {
		const info = await transporter.sendMail({ from, to, subject, html, text });
		return { delivered: true, messageId: info.messageId };
	} catch (err) {
		console.error('[email] send failed:', err);
		return { delivered: false, error: err.message };
	}
}

export function appBaseUrl() {
	return (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
}
