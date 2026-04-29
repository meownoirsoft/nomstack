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
			`SELECT sc.id, sc.ingredient_id, sc.comment, sc.created_by, sc.created_at
			 FROM shared_comments sc
			 INNER JOIN share_links sl ON sl.id = sc.share_link_id
			 WHERE sl.meal_plan_id = $1
			 ORDER BY sc.created_at ASC`,
			[mealPlanId]
		);

		const commentsByIngredient = res.rows.reduce((acc, row) => {
			if (!acc[row.ingredient_id]) acc[row.ingredient_id] = [];
			acc[row.ingredient_id].push({
				id: row.id,
				comment: row.comment,
				created_by: row.created_by,
				created_at: row.created_at
			});
			return acc;
		}, {});

		return json({ success: true, data: commentsByIngredient });
	} catch (error) {
		console.error('Error in getCommentsForMealPlan API:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
