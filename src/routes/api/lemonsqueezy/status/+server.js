import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

export async function GET({ request, locals }) {
  try {
    // Create Supabase admin client
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

    // Get the user from the session
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    
    if (authError || !user) {
      return json({ 
        tier: 'free',
        isActive: false,
        expiresAt: null,
        lemonSqueezyCustomerId: null,
        lemonSqueezySubscriptionId: null
      });
    }

    // Get user's subscription status from database
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (subError && subError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching subscription:', subError);
      return json({ 
        tier: 'free',
        isActive: false,
        expiresAt: null,
        lemonSqueezyCustomerId: null,
        lemonSqueezySubscriptionId: null
      });
    }

    if (!subscription) {
      return json({ 
        tier: 'free',
        isActive: false,
        expiresAt: null,
        lemonSqueezyCustomerId: null,
        lemonSqueezySubscriptionId: null
      });
    }

    // Check if subscription is still valid
    const now = new Date();
    const expiresAt = new Date(subscription.expires_at);
    const isActive = subscription.is_active && subscription.status === 'active' && expiresAt > now;

    return json({
      tier: subscription.tier || 'free',
      isActive,
      expiresAt: subscription.expires_at,
      lemonSqueezyCustomerId: subscription.lemon_squeezy_customer_id,
      lemonSqueezySubscriptionId: subscription.lemon_squeezy_subscription_id,
      status: subscription.status
    });

  } catch (error) {
    console.error('Error in subscription status endpoint:', error);
    return json({ 
      tier: 'free',
      isActive: false,
      expiresAt: null,
      lemonSqueezyCustomerId: null,
      lemonSqueezySubscriptionId: null
    }, { status: 500 });
  }
}
