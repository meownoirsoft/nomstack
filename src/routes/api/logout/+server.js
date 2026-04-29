import { json } from '@sveltejs/kit';
import { destroySession } from '$lib/server/session.js';

export async function POST({ cookies }) {
	const sessionId = cookies.get('session');
	if (sessionId) {
		try {
			await destroySession(sessionId);
		} catch (err) {
			console.error('Failed to destroy session row:', err);
		}
	}

	cookies.delete('session', {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/'
	});

	return json({ success: true });
}
