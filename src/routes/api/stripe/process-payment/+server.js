import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { supabaseAdmin } from '$lib/server/pg-data-client.js';

export async function POST({ request, locals }) {
	try {
		const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
		if (!stripeSecretKey) {
			throw new Error('STRIPE_SECRET_KEY environment variable is not set');
		}
		const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

		const { sessionId } = await request.json();
		if (!sessionId) {
			return json({ error: 'Session ID is required' }, { status: 400 });
		}

		if (!locals.userId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const session = await stripe.checkout.sessions.retrieve(sessionId);
		if (session.payment_status !== 'paid') {
			return json({ error: 'Session payment not completed' }, { status: 400 });
		}
		if (!session.subscription) {
			return json({ error: 'No subscription found in session' }, { status: 400 });
		}

		const subscription = await stripe.subscriptions.retrieve(session.subscription);

		const subscriptionData = {
			user_id: locals.userId,
			tier: 'plus',
			is_active: true,
			stripe_customer_id: subscription.customer,
			stripe_subscription_id: subscription.id,
			stripe_price_id: subscription.items.data[0]?.price?.id,
			status: subscription.status,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
			stripe_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
			stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
			stripe_cancel_at_period_end: subscription.cancel_at_period_end,
			stripe_canceled_at: subscription.canceled_at
				? new Date(subscription.canceled_at * 1000).toISOString()
				: null
		};

		const { error: dbError } = await supabaseAdmin
			.from('user_subscriptions')
			.upsert(subscriptionData, { onConflict: 'user_id' });

		if (dbError) {
			console.error('Error saving subscription to database:', dbError);
			return json({ error: 'Failed to save subscription to database' }, { status: 500 });
		}

		return json({
			success: true,
			message: 'Payment processed successfully',
			subscription: {
				id: subscription.id,
				customer: subscription.customer,
				status: subscription.status,
				expiresAt: new Date(subscription.current_period_end * 1000).toISOString()
			}
		});
	} catch (error) {
		console.error('Error processing payment:', error);
		return json({ error: error.message }, { status: 500 });
	}
}
