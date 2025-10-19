import { json } from '@sveltejs/kit';

export async function POST({ params, request }) {
  try {
    const { token } = params;
    const { name, quantity, created_by } = await request.json();

    if (!token) {
      return json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return json({ success: false, error: 'Item name is required' }, { status: 400 });
    }

    if (!created_by || !created_by.trim()) {
      return json({ success: false, error: 'Initials are required' }, { status: 400 });
    }

    if (created_by.length > 5) {
      return json({ success: false, error: 'Initials must be 5 characters or less' }, { status: 400 });
    }

    // Create a Supabase client with service role to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
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

    // Get share link and verify it's valid
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

    // Add item to shared list
    const { data: newItem, error: insertError } = await supabaseAdmin
      .from('shared_list_items')
      .insert({
        share_link_id: shareLink.id,
        name: name.trim(),
        quantity: quantity?.trim() || null,
        created_by: created_by.trim()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding shared item:', insertError);
      return json({ success: false, error: 'Failed to add item' }, { status: 500 });
    }

    return json({ success: true, data: newItem });
  } catch (error) {
    console.error('Error in shared item creation:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
