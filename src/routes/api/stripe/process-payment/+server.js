import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export async function POST({ request }) {
  try {
    // Initialize Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    });

    const requestData = await request.json();
    const { sessionId } = requestData;
    
    if (!sessionId) {
      return json({ error: 'Session ID is required' }, { status: 400 });
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

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    console.log('Retrieved session:', {
      id: session.id,
      payment_status: session.payment_status,
      subscription: session.subscription,
      customer: session.customer,
      mode: session.mode
    });

    // Check if session is completed and has subscription
    if (session.payment_status !== 'paid') {
      return json({ error: 'Session payment not completed' }, { status: 400 });
    }

    if (!session.subscription) {
      return json({ error: 'No subscription found in session' }, { status: 400 });
    }

    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    
    console.log('Retrieved subscription:', {
      id: subscription.id,
      customer: subscription.customer,
      status: subscription.status,
      current_period_end: subscription.current_period_end
    });

    // Create subscription record in database
    const subscriptionData = {
      user_id: user.id,
      tier: 'plus',
      is_active: true,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price?.id,
      status: subscription.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      stripe_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      stripe_cancel_at_period_end: subscription.cancel_at_period_end,
      stripe_canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
    };

    // Insert or update subscription
    const { error: dbError } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert(subscriptionData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      });

    if (dbError) {
      console.error('Error saving subscription to database:', dbError);
      return json({ error: 'Failed to save subscription to database' }, { status: 500 });
    }

    console.log('Successfully processed payment and created subscription');

    return json({
      success: true,
      message: 'Payment processed successfully',
      subscription: {
        id: subscription.id,
        customer: subscription.customer,
        status: subscription.status,
        expiresAt: new Date(subscription.current_period_end * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    return json({ error: error.message }, { status: 500 });
  }
}




