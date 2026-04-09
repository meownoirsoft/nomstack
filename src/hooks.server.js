import { getUserFromSessionToken } from '$lib/auth.js';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const token = event.cookies.get('session');
	event.locals.user = token ? getUserFromSessionToken(token) : null;

	const { pathname } = event.url;

	if (pathname.startsWith('/_app/')) {
		return resolve(event);
	}

	const publicPages =
		pathname === '/login' || pathname === '/register' || pathname === '/logout';
	const publicApi =
		pathname === '/api/login' ||
		pathname === '/api/register' ||
		pathname === '/api/logout';

	if (pathname.startsWith('/api/')) {
		if (!publicApi && !event.locals.user) {
			return new Response(JSON.stringify({ error: 'Unauthorized', success: false }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	} else if (!publicPages) {
		if (!event.locals.user) {
			return Response.redirect(new URL('/login', event.url), 302);
		}
	}

	return resolve(event);
}
