import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/pg-data-client.js';
import { getPool } from '$lib/server/sql.js';

export async function GET({ locals }) {
	try {
		if (!locals.userId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const pool = getPool();
		const userRow = await pool.query(
			`SELECT email FROM user_password_logins WHERE user_id = $1`,
			[locals.userId]
		);
		const userEmail = userRow.rows[0]?.email ?? null;

		const { data: allSubscriptions, error: allSubError } = await supabaseAdmin
			.from('user_subscriptions')
			.select('*')
			.eq('user_id', locals.userId)
			.order('created_at', { ascending: false });

		const { data: activeSubscriptions, error: activeSubError } = await supabaseAdmin
			.from('user_subscriptions')
			.select('*')
			.eq('user_id', locals.userId)
			.eq('is_active', true)
			.order('created_at', { ascending: false });

		return json({
			userId: locals.userId,
			userEmail,
			allSubscriptions: allSubscriptions || [],
			activeSubscriptions: activeSubscriptions || [],
			allSubError,
			activeSubError,
			totalCount: allSubscriptions?.length || 0,
			activeCount: activeSubscriptions?.length || 0
		});
	} catch (error) {
		console.error('Error debugging subscription:', error);
		return json({ error: error.message }, { status: 500 });
	}
}
