import { json } from '@sveltejs/kit';
import { getPool } from '$lib/server/sql.js';

const TABLES = [
	'meals',
	'categories',
	'sources',
	'meal_filters',
	'meal_plans',
	'stores',
	'ingredients',
	'recipes',
	'restaurants'
];

export async function GET({ locals }) {
	if (!locals.userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const pool = getPool();
		const lastUpdated = {};

		for (const table of TABLES) {
			try {
				const r = await pool.query(
					`SELECT updated_at FROM ${table}
					 WHERE user_id = $1
					 ORDER BY updated_at DESC NULLS LAST
					 LIMIT 1`,
					[locals.userId]
				);
				lastUpdated[table] = r.rows[0]?.updated_at ?? null;
			} catch (err) {
				console.error(`Error querying ${table}:`, err);
				lastUpdated[table] = null;
			}
		}

		const timestamps = Object.values(lastUpdated).filter((ts) => ts !== null);
		if (timestamps.length === 0) {
			return json({
				success: true,
				lastUpdated: new Date(0).toISOString(),
				tableTimestamps: lastUpdated
			});
		}

		const overallLastUpdated = new Date(
			Math.max(...timestamps.map((ts) => new Date(ts).getTime()))
		).toISOString();

		return json({
			success: true,
			lastUpdated: overallLastUpdated,
			tableTimestamps: lastUpdated
		});
	} catch (error) {
		console.error('Error getting sync status:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
