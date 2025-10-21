import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
console.log('Stripe secret key loaded:', !!stripeSecretKey);
console.log('Stripe secret key starts with:', stripeSecretKey?.substring(0, 7));

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
});

export async function POST({ request }) {
  try {
    const requestData = await request.json();
    const { priceId, successUrl, cancelUrl } = requestData;
    
    console.log('Stripe checkout request data:', { priceId, successUrl, cancelUrl });
    console.log('Environment variables:', {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasStripePriceId: !!process.env.STRIPE_PRICE_ID,
      priceId: process.env.STRIPE_PRICE_ID,
      nodeEnv: process.env.NODE_ENV
    });

    if (!priceId) {
      console.error('Price ID is missing from request:', requestData);
      return json({ error: 'Price ID is required' }, { status: 400 });
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

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (existingSubscription) {
      return json({ error: 'User already has an active subscription' }, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
    });

    console.log('Stripe checkout session created:', session.id);

    return json({ 
      url: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    return json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
}
