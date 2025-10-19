import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

export async function DELETE({ params }) {
  try {
    const { token, commentId } = params;

    if (!token || !commentId) {
      return json({ success: false, error: 'Token and comment ID are required' }, { status: 400 });
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
      .select('id, meal_plan_id, expires_at')
      .eq('share_token', token)
      .single();

    if (shareError || !shareLink) {
      return json({ success: false, error: 'Invalid or expired share link' }, { status: 404 });
    }

    // Check if link has expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return json({ success: false, error: 'Share link has expired' }, { status: 410 });
    }

    // Delete the comment
    const { error: deleteError } = await supabaseAdmin
      .from('shared_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return json({ success: false, error: 'Failed to delete comment' }, { status: 500 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error in delete comment API:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
