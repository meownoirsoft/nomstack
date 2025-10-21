import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

export async function GET({ request, locals }) {
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
      return json({ 
        tier: 'free',
        isActive: false,
        expiresAt: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return json({ 
        tier: 'free',
        isActive: false,
        expiresAt: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null
      });
    }

    // Get user's subscription status from database
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    console.log('Subscription query result:', { subscription, subError, userId: user.id });

    if (subError && subError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching subscription:', subError);
      return json({ 
        tier: 'free',
        isActive: false,
        expiresAt: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null
      });
    }

    if (!subscription) {
      return json({ 
        tier: 'free',
        isActive: false,
        expiresAt: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null
      });
    }

    // Check if subscription is still valid
    const now = new Date();
    const expiresAt = new Date(subscription.expires_at);
    const isActive = subscription.is_active && 
                    (subscription.status === 'active' || subscription.status === 'trialing') && 
                    expiresAt > now;

    return json({
      tier: subscription.tier || 'free',
      isActive: isActive,
      expiresAt: subscription.expires_at,
      stripeCustomerId: subscription.stripe_customer_id,
      stripeSubscriptionId: subscription.stripe_subscription_id,
      status: subscription.status,
      currentPeriodStart: subscription.stripe_current_period_start,
      currentPeriodEnd: subscription.stripe_current_period_end,
      cancelAtPeriodEnd: subscription.stripe_cancel_at_period_end,
      canceledAt: subscription.stripe_canceled_at
    });

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return json({ 
      tier: 'free',
      isActive: false,
      expiresAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null
    }, { status: 500 });
  }
}
