import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient.js';

export async function GET({ request, locals }) {
  try {
    // Get the user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return json({ 
        tier: 'free',
        isActive: false,
        expiresAt: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null
      });
    }

    // Get user's subscription status from database
    const { data: subscription, error: subError } = await supabase
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
    const isActive = subscription.is_active && expiresAt > now;

    return json({
      tier: subscription.tier || 'free',
      isActive,
      expiresAt: subscription.expires_at,
      stripeCustomerId: subscription.stripe_customer_id,
      stripeSubscriptionId: subscription.stripe_subscription_id
    });

  } catch (error) {
    console.error('Error in subscription status endpoint:', error);
    return json({ 
      tier: 'free',
      isActive: false,
      expiresAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null
    }, { status: 500 });
  }
}
