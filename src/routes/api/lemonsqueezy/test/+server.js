import { json } from '@sveltejs/kit';
import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

// Initialize LemonSqueezy
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY,
  onError: (error) => console.error('LemonSqueezy Error:', error)
});

export async function GET() {
  try {
    // Test LemonSqueezy API connection
    const stores = await lemonSqueezySetup.getStores();
    
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

    // Get variants for the store
    const variants = await lemonSqueezySetup.getVariants({ storeId });
    
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
        hasVariantId: !!process.env.PUBLIC_LEMONSQUEEZY_VARIANT_ID
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
