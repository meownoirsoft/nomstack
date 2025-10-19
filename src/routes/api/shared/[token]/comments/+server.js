import { json } from '@sveltejs/kit';

export async function POST({ params, request }) {
  try {
    const { token } = params;
    const { ingredient_id, comment, created_by } = await request.json();

    if (!token) {
      return json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    if (!ingredient_id) {
      return json({ success: false, error: 'Ingredient ID is required' }, { status: 400 });
    }

    if (!comment || !comment.trim()) {
      return json({ success: false, error: 'Comment is required' }, { status: 400 });
    }

    if (!created_by || !created_by.trim()) {
      return json({ success: false, error: 'Initials are required' }, { status: 400 });
    }

    if (comment.length > 255) {
      return json({ success: false, error: 'Comment must be 255 characters or less' }, { status: 400 });
    }

    if (created_by.length > 5) {
      return json({ success: false, error: 'Initials must be 5 characters or less' }, { status: 400 });
    }

    // Create a Supabase client with service role to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get share link and verify it's valid
    const { data: shareLink, error: shareError } = await supabaseAdmin
      .from('share_links')
      .select('id, expires_at, meal_plan_id')
      .eq('share_token', token)
      .single();

    if (shareError || !shareLink) {
      return json({ success: false, error: 'Invalid or expired share link' }, { status: 404 });
    }

    // Check if link has expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return json({ success: false, error: 'Share link has expired' }, { status: 410 });
    }

    // Verify the ingredient belongs to this meal plan
    const { data: ingredient, error: ingredientError } = await supabaseAdmin
      .from('ingredients')
      .select('id, plan_id')
      .eq('id', ingredient_id)
      .eq('plan_id', shareLink.meal_plan_id)
      .single();

    if (ingredientError || !ingredient) {
      return json({ success: false, error: 'Ingredient not found' }, { status: 404 });
    }

    // Add comment
    const { data: newComment, error: insertError } = await supabaseAdmin
      .from('shared_comments')
      .insert({
        share_link_id: shareLink.id,
        ingredient_id: ingredient_id,
        comment: comment.trim(),
        created_by: created_by.trim()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding comment:', insertError);
      return json({ success: false, error: 'Failed to add comment' }, { status: 500 });
    }

    return json({ success: true, data: newComment });
  } catch (error) {
    console.error('Error in comment creation:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
