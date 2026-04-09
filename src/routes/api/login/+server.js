import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { createSession, getUserByUsername, verifyPassword } from '$lib/auth.js';

export async function POST({ request, cookies }) {
	const { username, password } = await request.json();

	if (!username || !password) {
		return json({ error: 'Username and password are required' }, { status: 400 });
	}

	const user = getUserByUsername(username);
	if (!user || !verifyPassword(password, user.password_hash)) {
		return json({ error: 'Invalid credentials' }, { status: 401 });
	}

	const sessionId = createSession(user.id);
	cookies.set('session', sessionId, {
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		maxAge: 30 * 24 * 60 * 60,
		path: '/'
	});

	return json({ success: true });
}
