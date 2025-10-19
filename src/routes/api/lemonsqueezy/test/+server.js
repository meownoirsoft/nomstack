import { json } from '@sveltejs/kit';

export async function GET() {
  try {
    // Dynamic import of LemonSqueezy
    const { LemonSqueezy } = await import('@lemonsqueezy/lemonsqueezy.js');
    
    // Initialize LemonSqueezy with the correct constructor
    const lemonSqueezy = new LemonSqueezy({
      apiKey: process.env.LEMONSQUEEZY_API_KEY,
    });

    // Debug: Log the lemonSqueezy object to see what methods are available
    console.log('lemonSqueezy object keys:', Object.keys(lemonSqueezy));
    console.log('lemonSqueezy object:', lemonSqueezy);

    // Test LemonSqueezy API connection - try different method names
    let stores;
    if (typeof lemonSqueezy.getStores === 'function') {
      stores = await lemonSqueezy.getStores();
    } else if (typeof lemonSqueezy.stores?.get === 'function') {
      stores = await lemonSqueezy.stores.get();
    } else if (typeof lemonSqueezy.stores?.list === 'function') {
      stores = await lemonSqueezy.stores.list();
    } else if (typeof lemonSqueezy.stores === 'function') {
      stores = await lemonSqueezy.stores();
    } else {
      throw new Error('No valid stores method found. Available methods: ' + Object.keys(lemonSqueezy));
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
    if (typeof lemonSqueezy.getVariants === 'function') {
      variants = await lemonSqueezy.getVariants({ storeId });
    } else if (typeof lemonSqueezy.variants?.get === 'function') {
      variants = await lemonSqueezy.variants.get({ storeId });
    } else if (typeof lemonSqueezy.variants?.list === 'function') {
      variants = await lemonSqueezy.variants.list({ storeId });
    } else if (typeof lemonSqueezy.variants === 'function') {
      variants = await lemonSqueezy.variants({ storeId });
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
