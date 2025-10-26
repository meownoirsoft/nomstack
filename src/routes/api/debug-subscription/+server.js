import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

export async function GET({ request }) {
  try {
    // Create Supabase admin client
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

    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Get ALL subscriptions for this user (not just active ones)
    const { data: allSubscriptions, error: allSubError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Get only active subscriptions
    const { data: activeSubscriptions, error: activeSubError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return json({
      userId: user.id,
      userEmail: user.email,
      allSubscriptions: allSubscriptions || [],
      activeSubscriptions: activeSubscriptions || [],
      allSubError,
      activeSubError,
      totalCount: allSubscriptions?.length || 0,
      activeCount: activeSubscriptions?.length || 0
    });

  } catch (error) {
    console.error('Error debugging subscription:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
