import { getUserIdForSession } from '$lib/server/session.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// State-changing endpoints that legitimately receive cross-origin POSTs
// (server-to-server with their own signature/auth scheme).
const CSRF_EXEMPT_PATHS = new Set(['/api/stripe/webhook']);

export async function handle({ event, resolve }) {
	// CSRF defense-in-depth: reject state-changing requests when an Origin
	// header is present and doesn't match the request's own origin. SameSite=lax
	// on the session cookie already blocks the common case; this catches edge
	// cases (some browsers, embedded webviews) where the cookie still rides.
	if (
		!SAFE_METHODS.has(event.request.method) &&
		!CSRF_EXEMPT_PATHS.has(event.url.pathname)
	) {
		const origin = event.request.headers.get('origin');
		if (origin && origin !== event.url.origin) {
			return new Response('Forbidden: origin mismatch', { status: 403 });
		}
	}

	const sessionId = event.cookies.get('session');
	event.locals.userId = sessionId ? await getUserIdForSession(sessionId) : null;

	return resolve(event);
}
