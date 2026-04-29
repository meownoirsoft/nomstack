import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { supabaseAdmin } from '$lib/server/pg-data-client.js';

export async function POST({ request }) {
	try {
		const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
		if (!stripeSecretKey) {
			throw new Error('STRIPE_SECRET_KEY environment variable is not set');
		}
		const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

		const body = await request.text();
		const signature = request.headers.get('stripe-signature');

		if (!signature) {
			return json({ error: 'No signature provided' }, { status: 400 });
		}
		if (!process.env.STRIPE_WEBHOOK_SECRET) {
			return json({ error: 'Webhook secret not configured' }, { status: 500 });
		}

		let event;
		try {
			event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
		} catch (err) {
			console.error('Webhook signature verification failed:', err.message);
			return json({ error: 'Invalid signature' }, { status: 400 });
		}

		console.log('Stripe webhook event:', event.type, event.id);

		switch (event.type) {
			case 'checkout.session.completed':
				await handleCheckoutSessionCompleted(event);
				break;
			case 'customer.subscription.created':
				await handleSubscriptionCreated(event, stripe);
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
	const session = event.data.object;
	const userId = session.metadata?.user_id;
	if (!userId) {
		console.error('No user_id found in session metadata');
		return;
	}
	console.log('Checkout session completed for user:', userId);
}

async function handleSubscriptionCreated(event, stripe) {
	try {
		const subscription = event.data.object;
		const customerId = subscription.customer;
		const customer = await stripe.customers.retrieve(customerId);
		const userId = customer.metadata?.user_id || subscription.metadata?.user_id;
		if (!userId) {
			console.error('No user_id found for subscription');
			return;
		}

		const subscriptionData = {
			user_id: userId,
			tier: 'plus',
			is_active: subscription.status === 'active' || subscription.status === 'trialing',
			stripe_customer_id: customerId,
			stripe_subscription_id: subscription.id,
			stripe_price_id: subscription.items.data[0]?.price?.id,
			status: subscription.status,
			created_at: subscription.created
				? new Date(subscription.created * 1000).toISOString()
				: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			expires_at: subscription.current_period_end
				? new Date(subscription.current_period_end * 1000).toISOString()
				: null,
			stripe_current_period_start: subscription.current_period_start
				? new Date(subscription.current_period_start * 1000).toISOString()
				: null,
			stripe_current_period_end: subscription.current_period_end
				? new Date(subscription.current_period_end * 1000).toISOString()
				: null,
			stripe_cancel_at_period_end: subscription.cancel_at_period_end || false,
			stripe_canceled_at: subscription.canceled_at
				? new Date(subscription.canceled_at * 1000).toISOString()
				: null
		};

		const { error } = await supabaseAdmin
			.from('user_subscriptions')
			.upsert(subscriptionData, { onConflict: 'user_id' });

		if (error) console.error('Error creating subscription:', error);
		else console.log('Subscription created/updated for user:', userId);
	} catch (error) {
		console.error('Error handling subscription created:', error);
	}
}

async function handleSubscriptionUpdated(event) {
	try {
		const subscription = event.data.object;
		const updateData = {
			status: subscription.status,
			updated_at: new Date().toISOString(),
			expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
			stripe_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
			stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
			stripe_cancel_at_period_end: subscription.cancel_at_period_end,
			stripe_canceled_at: subscription.canceled_at
				? new Date(subscription.canceled_at * 1000).toISOString()
				: null
		};
		if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
			updateData.is_active = false;
		}

		const { error } = await supabaseAdmin
			.from('user_subscriptions')
			.update(updateData)
			.eq('stripe_subscription_id', subscription.id);

		if (error) console.error('Error updating subscription:', error);
	} catch (error) {
		console.error('Error handling subscription updated:', error);
	}
}

async function handleSubscriptionDeleted(event) {
	try {
		const subscription = event.data.object;
		const { error } = await supabaseAdmin
			.from('user_subscriptions')
			.update({
				is_active: false,
				status: 'canceled',
				updated_at: new Date().toISOString(),
				stripe_canceled_at: new Date().toISOString()
			})
			.eq('stripe_subscription_id', subscription.id);
		if (error) console.error('Error canceling subscription:', error);
	} catch (error) {
		console.error('Error handling subscription deleted:', error);
	}
}

async function handlePaymentSucceeded(event) {
	try {
		const invoice = event.data.object;
		if (!invoice.subscription) return;
		const { error } = await supabaseAdmin
			.from('user_subscriptions')
			.update({ is_active: true, status: 'active', updated_at: new Date().toISOString() })
			.eq('stripe_subscription_id', invoice.subscription);
		if (error) console.error('Error updating subscription after payment:', error);
	} catch (error) {
		console.error('Error handling payment succeeded:', error);
	}
}

async function handlePaymentFailed(event) {
	try {
		const invoice = event.data.object;
		if (!invoice.subscription) return;
		const { error } = await supabaseAdmin
			.from('user_subscriptions')
			.update({ status: 'past_due', updated_at: new Date().toISOString() })
			.eq('stripe_subscription_id', invoice.subscription);
		if (error) console.error('Error updating subscription after payment failure:', error);
	} catch (error) {
		console.error('Error handling payment failed:', error);
	}
}
