import { getPool } from '$lib/server/sql.js';

export async function load({ url, locals }) {
	const isAuthPage = url.pathname === '/login' || url.pathname === '/signup';
	const isSharedPage = url.pathname.startsWith('/shared/');

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
