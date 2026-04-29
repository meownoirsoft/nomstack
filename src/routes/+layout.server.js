import { redirect } from '@sveltejs/kit';
import { getPool } from '$lib/server/sql.js';

const AUTH_PAGES = new Set(['/login', '/signup', '/forgot-password']);
const PUBLIC_PREFIXES = ['/shared/', '/verify-email/', '/reset-password/'];

function isAuthPagePath(pathname) {
	return AUTH_PAGES.has(pathname);
}

function isPublicPagePath(pathname) {
	return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function load({ url, locals }) {
	const pathname = url.pathname;
	const isAuthPage = isAuthPagePath(pathname);
	const isSharedPage = pathname.startsWith('/shared/');
	const isPublicPage = isPublicPagePath(pathname);

	// Server-side auth gating. Avoids a client-side flash + ensures `goto` never
	// runs during SSR.
	if (locals.userId && isAuthPage) {
		throw redirect(303, '/');
	}
	if (!locals.userId && !isAuthPage && !isPublicPage) {
		throw redirect(303, '/login');
	}

	let title = 'nomStack';
	let pageTitle = '';
	if (isSharedPage) {
		title = 'Shared List - nomStack';
		pageTitle = 'Shared List';
	}

	let user = null;
	if (locals.userId) {
		try {
			const pool = getPool();
			const r = await pool.query(
				`SELECT p.id, p.display_name, l.email, l.email_verified
				 FROM profiles p
				 LEFT JOIN user_password_logins l ON l.user_id = p.id
				 WHERE p.id = $1`,
				[locals.userId]
			);
			if (r.rows[0]) {
				user = r.rows[0];
			}
		} catch (err) {
			console.error('layout: failed to load user profile:', err);
		}
	}

	return {
		title,
		pageTitle,
		isAuthPage,
		isSharedPage,
		user
	};
}
