import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { supabaseAdmin } from '$lib/server/pg-data-client.js';
import { getPool } from '$lib/server/sql.js';

export async function POST({ request, locals }) {
	try {
		const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
		if (!stripeSecretKey) {
			throw new Error('STRIPE_SECRET_KEY environment variable is not set');
		}
		const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

		const { priceId, successUrl, cancelUrl } = await request.json();
		if (!priceId) {
			return json({ error: 'Price ID is required' }, { status: 400 });
		}

		if (!locals.userId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const pool = getPool();
		const userRow = await pool.query(
			`SELECT email FROM user_password_logins WHERE user_id = $1`,
			[locals.userId]
		);
		const email = userRow.rows[0]?.email;
		if (!email) {
			return json({ error: 'User not found' }, { status: 401 });
		}

		const { data: existingSubscription } = await supabaseAdmin
			.from('user_subscriptions')
			.select('*')
			.eq('user_id', locals.userId)
			.eq('is_active', true)
			.single();

		if (existingSubscription) {
			return json({ error: 'User already has an active subscription' }, { status: 400 });
		}

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: [{ price: priceId, quantity: 1 }],
			mode: 'subscription',
			success_url: successUrl,
			cancel_url: cancelUrl,
			customer_email: email,
			metadata: { user_id: locals.userId },
			subscription_data: { metadata: { user_id: locals.userId } }
		});

		console.log('Stripe checkout session created:', session.id);
		return json({ url: session.url, sessionId: session.id });
	} catch (error) {
		console.error('Error creating Stripe checkout session:', error);
		return json({ error: error.message || 'Failed to create checkout session' }, { status: 500 });
	}
}
