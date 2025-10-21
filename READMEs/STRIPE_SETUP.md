# Stripe Setup Guide

This guide will help you set up Stripe as your payment processor for nomStack.

## 1. Create Stripe Account

1. Go to [Stripe](https://stripe.com) and create an account
2. Complete the onboarding process and verify your account
3. Switch to test mode for development

## 2. Create a Product and Price

1. In your Stripe dashboard, go to Products
2. Create a new product for "nomStack Plus"
3. Add a recurring price (monthly/yearly)
4. Note down the **Price ID** (you'll need this for `PUBLIC_STRIPE_PRICE_ID`)

## 3. Get API Credentials

1. Go to Developers > API keys in your Stripe dashboard
2. Copy your **Secret key** (you'll need this for `STRIPE_SECRET_KEY`)
3. Copy your **Publishable key** (you'll need this for `PUBLIC_STRIPE_PUBLISHABLE_KEY`)

## 4. Set up Webhook

1. Go to Developers > Webhooks in your Stripe dashboard
2. Create a new webhook with URL: `https://yourdomain.com/api/stripe/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Note down the **Webhook secret** (you'll need this for `STRIPE_WEBHOOK_SECRET`)

## 5. Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
PUBLIC_STRIPE_PRICE_ID=price_your_price_id

# Supabase Configuration (if not already set)
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 6. Database Migration

Run the database migration to add Stripe fields:

```bash
# Run the migration SQL file
psql -d your_database -f migrate-to-stripe.sql
```

Or if using Supabase CLI:

```bash
npx supabase db push
```

## 7. Test the Integration

1. Start your development server
2. Go to the upgrade page
3. Test the checkout flow with Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`
4. Check that webhooks are being received (check your server logs)

## 8. Production Setup

1. Switch to live mode in Stripe dashboard
2. Update environment variables with live keys
3. Update webhook URL to production domain
4. Test with real payment methods

## 9. Migration from Lemon Squeezy

If you're migrating from Lemon Squeezy:

1. Export existing subscription data from Lemon Squeezy
2. Create corresponding Stripe customers and subscriptions
3. Update database records with Stripe IDs
4. Test the migration thoroughly
5. Update frontend to use Stripe checkout
6. Remove Lemon Squeezy integration

## 10. Troubleshooting

### Common Issues

1. **Webhook signature verification failed**
   - Check that `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure webhook URL is accessible

2. **Price ID not found**
   - Verify `PUBLIC_STRIPE_PRICE_ID` is correct
   - Check that price is active in Stripe

3. **Checkout session creation failed**
   - Check Stripe secret key is correct
   - Verify user authentication is working

### Testing Webhooks Locally

Use Stripe CLI to forward webhooks to your local development server:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a webhook secret for local testing.

## 11. Security Considerations

1. Never expose secret keys in client-side code
2. Always verify webhook signatures
3. Use HTTPS in production
4. Regularly rotate API keys
5. Monitor for suspicious activity

## 12. Monitoring

Set up monitoring for:
- Failed payments
- Webhook delivery failures
- Subscription cancellations
- Payment disputes

Use Stripe's dashboard and webhooks to track subscription health.
