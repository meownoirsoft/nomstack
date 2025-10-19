import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

export async function DELETE({ params }) {
  try {
    const { token, itemId } = params;

    if (!token || !itemId) {
      return json({ success: false, error: 'Token and item ID are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the share link exists and is valid
    const { data: shareLink, error: shareError } = await supabaseAdmin
      .from('share_links')
      .select('id, expires_at')
      .eq('share_token', token)
      .single();

    if (shareError || !shareLink) {
      return json({ success: false, error: 'Invalid or expired share link' }, { status: 404 });
    }

    // Check if link has expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return json({ success: false, error: 'Share link has expired' }, { status: 410 });
    }

    // Delete the shared item
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
