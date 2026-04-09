import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { destroySession } from '$lib/auth.js';

export async function POST({ cookies }) {
	const token = cookies.get('session');
	destroySession(token);
	cookies.delete('session', {
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		path: '/'
	});

	return json({ success: true });
}
