import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/pg-data-client.js';

const FREE_TIER = {
	tier: 'free',
	isActive: false,
	expiresAt: null,
	stripeCustomerId: null,
	stripeSubscriptionId: null
};

export async function GET({ locals }) {
	try {
		if (!locals.userId) {
			return json(FREE_TIER);
		}

		const { data: subscription, error: subError } = await supabaseAdmin
			.from('user_subscriptions')
			.select('*')
			.eq('user_id', locals.userId)
			.eq('is_active', true)
			.single();

		if (subError && subError.code !== 'PGRST116') {
			console.error('Error fetching subscription:', subError);
			return json(FREE_TIER);
		}

		if (!subscription) {
			return json(FREE_TIER);
		}

		const now = new Date();
		const expiresAt = new Date(subscription.expires_at);
		const isActive =
			subscription.is_active &&
			(subscription.status === 'active' || subscription.status === 'trialing') &&
			expiresAt > now;

		return json({
			tier: subscription.tier || 'free',
			isActive,
			expiresAt: subscription.expires_at,
			stripeCustomerId: subscription.stripe_customer_id,
			stripeSubscriptionId: subscription.stripe_subscription_id,
			status: subscription.status,
			currentPeriodStart: subscription.stripe_current_period_start,
			currentPeriodEnd: subscription.stripe_current_period_end,
			cancelAtPeriodEnd: subscription.stripe_cancel_at_period_end,
			canceledAt: subscription.stripe_canceled_at
		});
	} catch (error) {
		console.error('Error fetching subscription status:', error);
		return json(FREE_TIER, { status: 500 });
	}
}
