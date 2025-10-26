import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

export async function POST({ request }) {
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

    // Delete all subscriptions for this user
    const { error: deleteError } = await supabaseAdmin
      .from('user_subscriptions')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting subscriptions:', deleteError);
      return json({ error: deleteError.message }, { status: 500 });
    }

    console.log('All subscriptions deleted for user:', user.id);

    return json({ 
      success: true,
      message: 'All subscriptions cleared. You can now create a new subscription.'
    });

  } catch (error) {
    console.error('Error fixing subscription:', error);
    return json({ error: error.message }, { status: 500 });
  }
}



