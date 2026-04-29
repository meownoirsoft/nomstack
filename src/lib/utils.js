import { getUserIdForSession } from './server/session.js';

/**
 * Resolve user id from the httpOnly `session` cookie.
 * The cookie value is a session id (row in `app_sessions`); we look up
 * the user id from that row, returning null if the session is missing,
 * expired, or revoked.
 *
 * @param {{ request: Request; cookies: import('@sveltejs/kit').Cookies }} ctx
 * @returns {Promise<string | null>}
 */
export async function getUserIdFromRequest({ cookies }) {
	const sessionId = cookies.get('session');
	if (!sessionId) {
		return null;
	}
	return await getUserIdForSession(sessionId);
}
