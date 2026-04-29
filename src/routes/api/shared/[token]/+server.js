import { json } from '@sveltejs/kit';
import { getPool } from '$lib/server/sql.js';

export async function GET({ params }) {
	try {
		const { token } = params;
		if (!token) {
			return json({ success: false, error: 'Token is required' }, { status: 400 });
		}

		const pool = getPool();

		const shareRes = await pool.query(
			`SELECT sl.*, mp.title AS meal_plan_title
			 FROM share_links sl
			 INNER JOIN meal_plans mp ON mp.id = sl.meal_plan_id
			 WHERE sl.share_token = $1
			 LIMIT 1`,
			[token]
		);
		const shareLink = shareRes.rows[0];
		if (!shareLink) {
			return json({ success: false, error: 'Invalid or expired share link' }, { status: 404 });
		}
		if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
			return json({ success: false, error: 'Share link has expired' }, { status: 410 });
		}

		const ingredientsRes = await pool.query(
			`SELECT i.*,
			        COALESCE(
			          (SELECT json_agg(json_build_object('id', sc.id, 'comment', sc.comment, 'created_at', sc.created_at))
			           FROM shared_comments sc
			           WHERE sc.ingredient_id = i.id),
			          '[]'::json
			        ) AS shared_comments
			 FROM ingredients i
			 WHERE i.plan_id = $1 AND i.store_id IS NULL
			 ORDER BY i.name`,
			[shareLink.meal_plan_id]
		);

		const allItems = ingredientsRes.rows.map((ingredient) => ({
			id: ingredient.id,
			name: ingredient.name,
			quantity: ingredient.quantity,
			comments: ingredient.shared_comments || [],
			type: 'ingredient'
		}));

		return json({
			success: true,
			data: {
				meal_plan_title: shareLink.meal_plan_title,
				ingredients: allItems,
				share_link: shareLink
			}
		});
	} catch (error) {
		console.error('Error in shared list fetch:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
