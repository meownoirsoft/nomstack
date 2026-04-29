import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/pg-data-client.js';

export async function POST({ locals }) {
	try {
		if (!locals.userId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { error: deleteError } = await supabaseAdmin
			.from('user_subscriptions')
			.delete()
			.eq('user_id', locals.userId);

		if (deleteError) {
			console.error('Error deleting subscriptions:', deleteError);
			return json({ error: deleteError.message }, { status: 500 });
		}

		return json({
			success: true,
			message: 'All subscriptions cleared. You can now create a new subscription.'
		});
	} catch (error) {
		console.error('Error fixing subscription:', error);
		return json({ error: error.message }, { status: 500 });
	}
}
