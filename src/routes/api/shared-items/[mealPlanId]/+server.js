import { json } from '@sveltejs/kit';
import { getPool } from '$lib/server/sql.js';

export async function GET({ params }) {
	try {
		const { mealPlanId } = params;
		if (!mealPlanId) {
			return json({ success: false, error: 'Meal plan ID is required' }, { status: 400 });
		}

		const pool = getPool();
		const res = await pool.query(
			`SELECT sli.*
			 FROM shared_list_items sli
			 INNER JOIN share_links sl ON sl.id = sli.share_link_id
			 WHERE sl.meal_plan_id = $1
			 ORDER BY sli.created_at`,
			[mealPlanId]
		);

		const itemsWithDefaults = res.rows.map((item) => ({
			...item,
			created_by: item.created_by || 'Unknown'
		}));

		return json({ success: true, data: itemsWithDefaults });
	} catch (error) {
		console.error('Error in shared items fetch:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
