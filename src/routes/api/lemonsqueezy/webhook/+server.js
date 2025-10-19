import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';
import crypto from 'crypto';

// Initialize LemonSqueezy
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY,
  onError: (error) => console.error('LemonSqueezy Error:', error)
});

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const digest = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(digest, 'hex'));
}

export async function POST({ request }) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-signature');
    
    if (!signature) {
      console.error('No signature provided');
      return json({ error: 'No signature provided' }, { status: 400 });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      body, 
      signature, 
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('LemonSqueezy webhook event:', event.meta?.event_name);

    // Handle different event types
    switch (event.meta?.event_name) {
      case 'order_created':
        await handleOrderCreated(event);
        break;
      case 'subscription_created':
        await handleSubscriptionCreated(event);
        break;
      case 'subscription_updated':
        await handleSubscriptionUpdated(event);
        break;
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(event);
        break;
      case 'subscription_resumed':
        await handleSubscriptionResumed(event);
        break;
      case 'subscription_expired':
        await handleSubscriptionExpired(event);
        break;
      default:
        console.log('Unhandled event type:', event.meta?.event_name);
    }

    return json({ success: true });

  } catch (error) {
    console.error('Error processing LemonSqueezy webhook:', error);
    return json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleOrderCreated(event) {
  try {
    const order = event.data;
    const userId = order.attributes?.custom_data?.user_id;
    
    if (!userId) {
      console.error('No user_id in order custom data');
      return;
    }

    console.log('Order created for user:', userId);
    // Order created - subscription will be handled by subscription_created event
  } catch (error) {
    console.error('Error handling order created:', error);
  }
}

async function handleSubscriptionCreated(event) {
  try {
    const subscription = event.data;
    const userId = subscription.attributes?.user_email ? 
      await getUserIdByEmail(subscription.attributes.user_email) : 
      subscription.attributes?.custom_data?.user_id;

    if (!userId) {
      console.error('No user_id found for subscription');
      return;
    }

    const subscriptionData = {
      user_id: userId,
      tier: 'plus',
      is_active: true,
      lemon_squeezy_subscription_id: subscription.id,
      lemon_squeezy_customer_id: subscription.attributes?.customer_id,
      status: subscription.attributes?.status,
      created_at: subscription.attributes?.created_at,
      updated_at: subscription.attributes?.updated_at,
      expires_at: subscription.attributes?.renews_at || subscription.attributes?.ends_at
    };

    // Insert or update subscription
    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert(subscriptionData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error creating subscription:', error);
    } else {
      console.log('Subscription created for user:', userId);
    }
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(event) {
  try {
    const subscription = event.data;
    const subscriptionId = subscription.id;

    const updateData = {
      status: subscription.attributes?.status,
      updated_at: subscription.attributes?.updated_at,
      expires_at: subscription.attributes?.renews_at || subscription.attributes?.ends_at
    };

    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .update(updateData)
      .eq('lemon_squeezy_subscription_id', subscriptionId);

    if (error) {
      console.error('Error updating subscription:', error);
    } else {
      console.log('Subscription updated:', subscriptionId);
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionCancelled(event) {
  try {
    const subscription = event.data;
    const subscriptionId = subscription.id;

    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .update({ 
        is_active: false,
        status: 'cancelled',
        updated_at: subscription.attributes?.updated_at,
        expires_at: subscription.attributes?.ends_at
      })
      .eq('lemon_squeezy_subscription_id', subscriptionId);

    if (error) {
      console.error('Error cancelling subscription:', error);
    } else {
      console.log('Subscription cancelled:', subscriptionId);
    }
  } catch (error) {
    console.error('Error handling subscription cancelled:', error);
  }
}

async function handleSubscriptionResumed(event) {
  try {
    const subscription = event.data;
    const subscriptionId = subscription.id;

    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .update({ 
        is_active: true,
        status: 'active',
        updated_at: subscription.attributes?.updated_at,
        expires_at: subscription.attributes?.renews_at
      })
      .eq('lemon_squeezy_subscription_id', subscriptionId);

    if (error) {
      console.error('Error resuming subscription:', error);
    } else {
      console.log('Subscription resumed:', subscriptionId);
    }
  } catch (error) {
    console.error('Error handling subscription resumed:', error);
  }
}

async function handleSubscriptionExpired(event) {
  try {
    const subscription = event.data;
    const subscriptionId = subscription.id;

    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .update({ 
        is_active: false,
        status: 'expired',
        updated_at: subscription.attributes?.updated_at
      })
      .eq('lemon_squeezy_subscription_id', subscriptionId);

    if (error) {
      console.error('Error expiring subscription:', error);
    } else {
      console.log('Subscription expired:', subscriptionId);
    }
  } catch (error) {
    console.error('Error handling subscription expired:', error);
  }
}

async function getUserIdByEmail(email) {
  try {
    const { data: user, error } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    if (error || !user) {
      console.error('User not found for email:', email);
      return null;
    }
    return user.user.id;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}
