import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

export async function POST({ request }) {
  try {
    // Dynamic import of LemonSqueezy
    const { lemonSqueezySetup, createCheckout } = await import('@lemonsqueezy/lemonsqueezy.js');
    
    // Initialize LemonSqueezy
    lemonSqueezySetup({
      apiKey: process.env.LEMONSQUEEZY_API_KEY,
      onError: (error) => console.error('LemonSqueezy Error:', error)
    });

    const requestData = await request.json();
    const { variantId, successUrl, cancelUrl } = requestData;
    
    console.log('Full request data:', requestData);
    console.log('Checkout request data:', { variantId, successUrl, cancelUrl });
    console.log('Environment variables:', {
      hasApiKey: !!process.env.LEMONSQUEEZY_API_KEY,
      hasStoreId: !!process.env.LEMONSQUEEZY_STORE_ID,
      nodeEnv: process.env.NODE_ENV
    });

    if (!variantId) {
      console.error('Variant ID is missing from request:', requestData);
      return json({ error: 'Variant ID is required' }, { status: 400 });
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

    // Get the user from the session
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
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

    // Debug: Log the imported functions
    console.log('createCheckout function available:', typeof createCheckout === 'function');
    
    // Create LemonSqueezy checkout using the imported function
    const checkoutParams = {
      storeId: process.env.LEMONSQUEEZY_STORE_ID,
      variantId: variantId,
      checkoutData: {
        email: user.email,
        custom: {
          user_id: user.id
        }
      },
      checkoutOptions: {
        embed: false,
        media: false,
        logo: true
      },
      preview: false,
      testMode: process.env.NODE_ENV !== 'production'
    };

    let checkout;
    if (typeof createCheckout === 'function') {
      checkout = await createCheckout(checkoutParams);
    } else {
      throw new Error('createCheckout function not available');
    }

    if (checkout.error) {
      console.error('LemonSqueezy checkout error:', checkout.error);
      return json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    return json({ 
      url: checkout.data?.data?.attributes?.url,
      checkoutId: checkout.data?.data?.id 
    });

  } catch (error) {
    console.error('Error creating LemonSqueezy checkout:', error);
    return json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
