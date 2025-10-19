import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient.js';

export async function POST({ request }) {
  try {
    console.log('🚀 SHARE API POST ENDPOINT HIT!');
    const { meal_plan_id, expires_at } = await request.json();
    console.log('Meal plan ID:', meal_plan_id);

    if (!meal_plan_id) {
      return json({ success: false, error: 'Meal plan ID is required' }, { status: 400 });
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted:', token.substring(0, 20) + '...');

    // Create a Supabase client with the user's token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log('Auth error:', authError);
    console.log('User:', user);
    
    if (authError || !user) {
      return json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Generate secure token
    const shareToken = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');
    
    const shareUrl = `/shared/${shareToken}`;

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

    // Create share link directly with admin client
    const { data: shareLink, error: createError } = await supabaseAdmin
      .from('share_links')
      .insert({
        user_id: user.id,
        meal_plan_id: meal_plan_id,
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