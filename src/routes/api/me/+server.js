import { json } from '@sveltejs/kit';
import { getPool } from '$lib/server/sql.js';

export async function GET({ locals }) {
	if (!locals.userId) {
		return json({ user: null });
	}

	const pool = getPool();
	const r = await pool.query(
		`SELECT p.id, p.display_name, l.email
		 FROM profiles p
		 LEFT JOIN user_password_logins l ON l.user_id = p.id
		 WHERE p.id = $1`,
		[locals.userId]
	);

	if (!r.rows[0]) {
		return json({ user: null });
	}

	return json({ user: r.rows[0] });
}
