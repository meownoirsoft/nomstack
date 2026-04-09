import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { countUsers, createSession, createUser, getUserByUsername } from '$lib/auth.js';

export async function POST({ request, cookies }) {
	const allowExtra =
		env.ALLOW_REGISTRATION === 'true' || env.ALLOW_REGISTRATION === '1';
	const userCount = countUsers();

	if (userCount > 0 && !allowExtra) {
		return json({ error: 'Registration is disabled' }, { status: 403 });
	}

	const { username, password } = await request.json();
	if (!username || !password) {
		return json({ error: 'Username and password are required' }, { status: 400 });
	}
	if (password.length < 8) {
		return json({ error: 'Password must be at least 8 characters' }, { status: 400 });
	}

	if (getUserByUsername(username)) {
		return json({ error: 'Username already taken' }, { status: 409 });
	}

	try {
		const userId = createUser(username, password);
		const sessionId = createSession(userId);
		cookies.set('session', sessionId, {
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax',
			maxAge: 30 * 24 * 60 * 60,
			path: '/'
		});
	} catch (e) {
		console.error(e);
		return json({ error: 'Could not create account' }, { status: 500 });
	}

	return json({ success: true });
}
