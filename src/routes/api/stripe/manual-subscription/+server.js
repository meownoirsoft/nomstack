import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

export async function POST({ request }) {
  try {
    const requestData = await request.json();
    const { userId, stripeCustomerId, stripeSubscriptionId, stripePriceId } = requestData;
    
    console.log('Manual subscription creation:', { userId, stripeCustomerId, stripeSubscriptionId, stripePriceId });

    if (!userId || !stripeCustomerId || !stripeSubscriptionId) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

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

    // Create subscription record
    const subscriptionData = {
      user_id: userId,
      tier: 'plus',
      is_active: true,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_price_id: stripePriceId,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      stripe_current_period_start: new Date().toISOString(),
      stripe_current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      stripe_cancel_at_period_end: false,
      stripe_canceled_at: null
    };

    const { data, error } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert(subscriptionData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error creating manual subscription:', error);
      return json({ error: error.message }, { status: 500 });
    }

    console.log('Manual subscription created successfully:', data);

    return json({ 
      success: true, 
      subscription: data,
      message: 'Subscription created manually'
    });

  } catch (error) {
    console.error('Error in manual subscription creation:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
