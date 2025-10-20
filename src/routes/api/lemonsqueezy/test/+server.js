import { json } from '@sveltejs/kit';

export async function GET() {
  try {
    // Dynamic import of LemonSqueezy - import everything to see what's available
    const lemonSqueezyModule = await import('@lemonsqueezy/lemonsqueezy.js');
    
    // Debug: Log all available exports
    console.log('All LemonSqueezy exports:', Object.keys(lemonSqueezyModule));
    console.log('LemonSqueezy module:', lemonSqueezyModule);
    
    // Initialize LemonSqueezy
    if (lemonSqueezyModule.lemonSqueezySetup) {
      lemonSqueezyModule.lemonSqueezySetup({
        apiKey: process.env.LEMONSQUEEZY_API_KEY,
        onError: (error) => console.error('LemonSqueezy Error:', error)
      });
    }

    // Test LemonSqueezy API connection - try different function names
    let stores;
    if (typeof lemonSqueezyModule.getStores === 'function') {
      stores = await lemonSqueezyModule.getStores();
    } else if (typeof lemonSqueezyModule.stores === 'function') {
      stores = await lemonSqueezyModule.stores();
    } else if (typeof lemonSqueezyModule.listStores === 'function') {
      stores = await lemonSqueezyModule.listStores();
    } else if (typeof lemonSqueezyModule.getStoresList === 'function') {
      stores = await lemonSqueezyModule.getStoresList();
    } else {
      // Try to find any function that might be for stores
      const storeFunctions = Object.keys(lemonSqueezyModule).filter(key => 
        key.toLowerCase().includes('store') && typeof lemonSqueezyModule[key] === 'function'
      );
      console.log('Store-related functions found:', storeFunctions);
      throw new Error(`No stores function found. Available functions: ${Object.keys(lemonSqueezyModule).join(', ')}`);
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

    // Get variants for the store - try different function names
    let variants;
    if (typeof lemonSqueezyModule.getVariants === 'function') {
      variants = await lemonSqueezyModule.getVariants({ storeId });
    } else if (typeof lemonSqueezyModule.variants === 'function') {
      variants = await lemonSqueezyModule.variants({ storeId });
    } else if (typeof lemonSqueezyModule.listVariants === 'function') {
      variants = await lemonSqueezyModule.listVariants({ storeId });
    } else if (typeof lemonSqueezyModule.getVariantsList === 'function') {
      variants = await lemonSqueezyModule.getVariantsList({ storeId });
    } else {
      console.warn('No variants function found, skipping variants check');
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
