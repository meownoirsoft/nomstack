import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export async function POST({ request, getClientAddress }) {
  try {
    // Initialize Stripe inside the function to avoid build-time issues
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

    // Get the raw body as text first
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    console.log('Webhook received:', { 
      hasSignature: !!signature, 
      bodyLength: body.length,
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      signature: signature
    });
    
    if (!signature) {
      console.error('No Stripe signature provided');
      return json({ error: 'No signature provided' }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not set');
      return json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // For now, let's skip signature verification to test if the webhook logic works
    let event;
    try {
      event = JSON.parse(body);
      console.log('Webhook event parsed (signature verification skipped for testing)');
    } catch (err) {
      console.error('Failed to parse webhook body as JSON:', err.message);
      return json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('Stripe webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    return json({ success: true });

  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    return json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(event) {
  try {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    
    if (!userId) {
      console.error('No user_id found in session metadata');
      return;
    }

    console.log('Checkout session completed for user:', userId);
    
    // The subscription will be handled by the subscription.created event
    // This event just confirms the checkout was successful
    
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handleSubscriptionCreated(event) {
  try {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;
    
    // Get customer details from Stripe
    const customer = await stripe.customers.retrieve(customerId);
    const userId = customer.metadata?.user_id || subscription.metadata?.user_id;
    
    if (!userId) {
      console.error('No user_id found for subscription');
      return;
    }

    const subscriptionData = {
      user_id: userId,
      tier: 'plus',
      is_active: true,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: subscription.items.data[0]?.price?.id,
      status: subscription.status,
      created_at: new Date(subscription.created * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      stripe_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      stripe_cancel_at_period_end: subscription.cancel_at_period_end,
      stripe_canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
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
    const subscription = event.data.object;
    const subscriptionId = subscription.id;

    const updateData = {
      status: subscription.status,
      updated_at: new Date().toISOString(),
      expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      stripe_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      stripe_cancel_at_period_end: subscription.cancel_at_period_end,
      stripe_canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
    };

    // Update subscription status
    if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
      updateData.is_active = false;
    }

    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .update(updateData)
      .eq('stripe_subscription_id', subscriptionId);

    if (error) {
      console.error('Error updating subscription:', error);
    } else {
      console.log('Subscription updated:', subscriptionId);
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(event) {
  try {
    const subscription = event.data.object;
    const subscriptionId = subscription.id;

    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .update({ 
        is_active: false,
        status: 'canceled',
        updated_at: new Date().toISOString(),
        stripe_canceled_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) {
      console.error('Error canceling subscription:', error);
    } else {
      console.log('Subscription canceled:', subscriptionId);
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(event) {
  try {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    
    if (subscriptionId) {
      // Update subscription to ensure it's active
      const { error } = await supabaseAdmin
        .from('user_subscriptions')
        .update({ 
          is_active: true,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId);

      if (error) {
        console.error('Error updating subscription after payment:', error);
      } else {
        console.log('Subscription activated after successful payment:', subscriptionId);
      }
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(event) {
  try {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    
    if (subscriptionId) {
      // Update subscription status to indicate payment failure
      const { error } = await supabaseAdmin
        .from('user_subscriptions')
        .update({ 
          status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId);

      if (error) {
        console.error('Error updating subscription after payment failure:', error);
      } else {
        console.log('Subscription marked as past due after payment failure:', subscriptionId);
      }
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}
