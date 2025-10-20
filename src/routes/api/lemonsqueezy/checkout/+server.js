import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

export async function POST({ request }) {
  try {
    // Dynamic import of LemonSqueezy
    const lemonSqueezyModule = await import('@lemonsqueezy/lemonsqueezy.js');
    
    // Initialize LemonSqueezy
    if (lemonSqueezyModule.lemonSqueezySetup) {
      lemonSqueezyModule.lemonSqueezySetup({
        apiKey: process.env.LEMONSQUEEZY_API_KEY,
        onError: (error) => console.error('LemonSqueezy Error:', error)
      });
    }

    const requestData = await request.json();
    const { variantId, successUrl, cancelUrl } = requestData;
    
    console.log('Full request data:', requestData);
    console.log('Checkout request data:', { variantId, successUrl, cancelUrl });
    console.log('Environment variables:', {
      hasApiKey: !!process.env.LEMONSQUEEZY_API_KEY,
      hasStoreId: !!process.env.LEMONSQUEEZY_STORE_ID,
      storeId: process.env.LEMONSQUEEZY_STORE_ID,
      nodeEnv: process.env.NODE_ENV
    });
    console.log('All LEMONSQUEEZY env vars:', Object.keys(process.env).filter(key => key.includes('LEMONSQUEEZY')));
    console.log('Raw storeId value:', JSON.stringify(process.env.LEMONSQUEEZY_STORE_ID));

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

    // Get the user from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized - No auth token provided' }, { status: 401 });
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

    // Debug: Log available functions
    console.log('All LemonSqueezy exports:', Object.keys(lemonSqueezyModule));
    console.log('LemonSqueezy module structure:', lemonSqueezyModule);
    
    // Create LemonSqueezy checkout - try different function names
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
    try {
      if (typeof lemonSqueezyModule.createCheckout === 'function') {
        console.log('Using createCheckout function');
        console.log('checkoutParams (object form):', checkoutParams);
        try {
          checkout = await lemonSqueezyModule.createCheckout(checkoutParams);
        } catch (e1) {
          console.warn('Object-form createCheckout failed, retrying positional signature...', e1?.message || e1);
          // Fallback to positional signature: (storeId, variantId, options)
          const positionalOptions = {
            checkoutData: checkoutParams.checkoutData,
            checkoutOptions: checkoutParams.checkoutOptions,
            preview: checkoutParams.preview,
            testMode: checkoutParams.testMode
          };
          console.log('checkoutParams (positional):', process.env.LEMONSQUEEZY_STORE_ID, variantId, positionalOptions);
          checkout = await lemonSqueezyModule.createCheckout(
            process.env.LEMONSQUEEZY_STORE_ID,
            variantId,
            positionalOptions
          );
        }
      } else if (typeof lemonSqueezyModule.checkout === 'function') {
        console.log('Using checkout function');
        checkout = await lemonSqueezyModule.checkout(checkoutParams);
      } else if (typeof lemonSqueezyModule.createCheckoutSession === 'function') {
        console.log('Using createCheckoutSession function');
        checkout = await lemonSqueezyModule.createCheckoutSession(checkoutParams);
      } else {
        // Try to find any function that might be for checkout
        const checkoutFunctions = Object.keys(lemonSqueezyModule).filter(key => 
          key.toLowerCase().includes('checkout') && typeof lemonSqueezyModule[key] === 'function'
        );
        console.log('Checkout-related functions found:', checkoutFunctions);
        throw new Error(`No checkout function found. Available functions: ${Object.keys(lemonSqueezyModule).join(', ')}`);
      }
    } catch (checkoutError) {
      console.error('LemonSqueezy checkout function error:', checkoutError);
      throw checkoutError;
    }

    if (checkout?.error) {
      console.error('LemonSqueezy checkout error:', checkout.error);
      return json({ error: 'Failed to create checkout session', details: checkout.error }, { status: 500 });
    }

    return json({ 
      url: checkout.data?.data?.attributes?.url,
      checkoutId: checkout.data?.data?.id 
    });

  } catch (error) {
    console.error('Error creating LemonSqueezy checkout:', error);
    return json({ error: 'Failed to create checkout session', details: error?.message || String(error) }, { status: 500 });
  }
}
