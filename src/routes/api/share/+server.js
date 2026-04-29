import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/pg-data-client.js';

export async function POST({ request, locals }) {
	try {
		if (!locals.userId) {
			return json({ success: false, error: 'Authentication required' }, { status: 401 });
		}

		const { meal_plan_id, expires_at } = await request.json();
		if (!meal_plan_id) {
			return json({ success: false, error: 'Meal plan ID is required' }, { status: 400 });
		}

		const shareToken = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
			byte.toString(16).padStart(2, '0')
		).join('');
		const shareUrl = `/shared/${shareToken}`;

		const { data: shareLink, error: createError } = await supabaseAdmin
			.from('share_links')
			.insert({
				user_id: locals.userId,
				meal_plan_id,
				share_token: shareToken,
				share_url: shareUrl,
				expires_at: expires_at || null
			})
			.select()
			.single();

		if (createError) {
			console.error('Error creating share link:', createError);
			return json({ success: false, error: 'Failed to create share link' }, { status: 500 });
		}
		return json({ success: true, data: shareLink });
	} catch (error) {
		console.error('Error in share link creation:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
