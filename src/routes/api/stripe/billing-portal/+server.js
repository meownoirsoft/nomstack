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

		if (!locals.userId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { data: subscription } = await supabaseAdmin
			.from('user_subscriptions')
			.select('stripe_customer_id')
			.eq('user_id', locals.userId)
			.eq('is_active', true)
			.single();

		if (!subscription || !subscription.stripe_customer_id) {
			return json(
				{ error: 'No active subscription found', redirectToUpgrade: true },
				{ status: 400 }
			);
		}

		if (subscription.stripe_customer_id.startsWith('cus_manual_')) {
			return json(
				{
					error:
						'This is a manual subscription. Please upgrade to a real subscription for billing management.',
					redirectToUpgrade: true
				},
				{ status: 400 }
			);
		}

		try {
			const portalSession = await stripe.billingPortal.sessions.create({
				customer: subscription.stripe_customer_id,
				return_url: `${request.headers.get('origin')}/settings`
			});
			return json({ url: portalSession.url });
		} catch (stripeError) {
			console.error('Stripe billing portal error:', stripeError);
			if (stripeError.code === 'resource_missing') {
				return json(
					{
						error: 'Customer not found in Stripe. Please upgrade to a real subscription.',
						redirectToUpgrade: true
					},
					{ status: 400 }
				);
			}
			throw stripeError;
		}
	} catch (error) {
		console.error('Error creating billing portal session:', error);
		return json({ error: error.message }, { status: 500 });
	}
}
