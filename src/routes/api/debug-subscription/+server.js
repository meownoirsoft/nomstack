import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/pg-data-client.js';

export async function GET({ locals }) {
	try {
		if (!locals.userId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { data: subscriptions, error: subError } = await supabaseAdmin
			.from('user_subscriptions')
			.select('*')
			.eq('user_id', locals.userId)
			.order('created_at', { ascending: false });

		return json({
			userId: locals.userId,
			subscriptions: subscriptions || [],
			error: subError
		});
	} catch (error) {
		console.error('Error debugging subscription:', error);
		return json({ error: error.message || 'Failed to debug subscription' }, { status: 500 });
	}
}
