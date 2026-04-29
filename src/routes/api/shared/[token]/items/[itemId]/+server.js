import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/pg-data-client.js';

export async function DELETE({ params }) {
	try {
		const { token, itemId } = params;
		if (!token || !itemId) {
			return json({ success: false, error: 'Token and item ID are required' }, { status: 400 });
		}

		const { data: shareLink, error: shareError } = await supabaseAdmin
			.from('share_links')
			.select('id, expires_at')
			.eq('share_token', token)
			.single();

		if (shareError || !shareLink) {
			return json({ success: false, error: 'Invalid or expired share link' }, { status: 404 });
		}
		if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
			return json({ success: false, error: 'Share link has expired' }, { status: 410 });
		}

		const { error: deleteError } = await supabaseAdmin
			.from('shared_list_items')
			.delete()
			.eq('id', itemId)
			.eq('share_link_id', shareLink.id);

		if (deleteError) {
			console.error('Error deleting shared item:', deleteError);
			return json({ success: false, error: 'Failed to delete item' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error in delete shared item API:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
