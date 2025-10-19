import { json } from '@sveltejs/kit';

export async function GET() {
  try {
    // Dynamic import of LemonSqueezy
    const { lemonSqueezySetup } = await import('@lemonsqueezy/lemonsqueezy.js');
    
    // Initialize LemonSqueezy
    lemonSqueezySetup({
      apiKey: process.env.LEMONSQUEEZY_API_KEY,
      onError: (error) => console.error('LemonSqueezy Error:', error)
    });

    // Debug: Log the lemonSqueezySetup object to see what methods are available
    console.log('lemonSqueezySetup object:', Object.keys(lemonSqueezySetup));
    console.log('lemonSqueezySetup methods:', lemonSqueezySetup);

    // Test LemonSqueezy API connection - try different method names
    let stores;
    if (typeof lemonSqueezySetup.getStores === 'function') {
      stores = await lemonSqueezySetup.getStores();
    } else if (typeof lemonSqueezySetup.stores?.get === 'function') {
      stores = await lemonSqueezySetup.stores.get();
    } else if (typeof lemonSqueezySetup.stores?.list === 'function') {
      stores = await lemonSqueezySetup.stores.list();
    } else {
      throw new Error('No valid stores method found. Available methods: ' + Object.keys(lemonSqueezySetup));
    }
    
    if (stores.error) {
      return json({ 
        success: false, 
        error: 'LemonSqueezy API connection failed',
        details: stores.error 
      }, { status: 500 });
    }

    // Get store details
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    const store = stores.data?.data?.find(s => s.id === storeId);
    
    if (!store) {
      return json({ 
        success: false, 
        error: 'Store not found',
        storeId,
        availableStores: stores.data?.data?.map(s => ({ id: s.id, name: s.attributes?.name }))
      }, { status: 404 });
    }

    // Get variants for the store - try different method names
    let variants;
    if (typeof lemonSqueezySetup.getVariants === 'function') {
      variants = await lemonSqueezySetup.getVariants({ storeId });
    } else if (typeof lemonSqueezySetup.variants?.get === 'function') {
      variants = await lemonSqueezySetup.variants.get({ storeId });
    } else if (typeof lemonSqueezySetup.variants?.list === 'function') {
      variants = await lemonSqueezySetup.variants.list({ storeId });
    } else {
      console.warn('No valid variants method found, skipping variants check');
      variants = { data: { data: [] } };
    }
    
    return json({
      success: true,
      store: {
        id: store.id,
        name: store.attributes?.name,
        domain: store.attributes?.domain
      },
      variants: variants.data?.data?.map(v => ({
        id: v.id,
        name: v.attributes?.name,
        price: v.attributes?.price,
        status: v.attributes?.status
      })) || [],
      config: {
        hasApiKey: !!process.env.LEMONSQUEEZY_API_KEY,
        hasWebhookSecret: !!process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
        hasStoreId: !!process.env.LEMONSQUEEZY_STORE_ID,
        hasVariantId: !!process.env.PUBLIC_LEMONSQUEEZY_VARIANT_ID,
        apiKeyLength: process.env.LEMONSQUEEZY_API_KEY?.length || 0,
        storeId: process.env.LEMONSQUEEZY_STORE_ID,
        variantId: process.env.PUBLIC_LEMONSQUEEZY_VARIANT_ID,
        nodeEnv: process.env.NODE_ENV
      }
    });

  } catch (error) {
    console.error('Error testing LemonSqueezy:', error);
    return json({ 
      success: false, 
      error: 'Test failed',
      details: error.message 
    }, { status: 500 });
  }
}
