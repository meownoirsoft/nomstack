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

    // Get user's subscription to find their Stripe customer ID
    const { data: subscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!subscription || !subscription.stripe_customer_id) {
      return json({ 
        error: 'No active subscription found',
        redirectToUpgrade: true 
      }, { status: 400 });
    }

    // Check if this is a manual subscription (not a real Stripe customer)
    if (subscription.stripe_customer_id.startsWith('cus_manual_')) {
      return json({ 
        error: 'This is a manual subscription. Please upgrade to a real subscription for billing management.',
        redirectToUpgrade: true 
      }, { status: 400 });
    }

    try {
      // Create billing portal session
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${request.headers.get('origin')}/settings`,
      });

      console.log('Billing portal session created:', portalSession.id);

      return json({ 
        url: portalSession.url 
      });
    } catch (stripeError) {
      console.error('Stripe billing portal error:', stripeError);
      
      // If customer doesn't exist in Stripe, redirect to upgrade
      if (stripeError.code === 'resource_missing') {
        return json({ 
          error: 'Customer not found in Stripe. Please upgrade to a real subscription.',
          redirectToUpgrade: true 
        }, { status: 400 });
      }
      
      throw stripeError;
    }

  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
