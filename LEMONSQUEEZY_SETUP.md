# LemonSqueezy Setup Guide

This guide will help you set up LemonSqueezy as your payment processor for nomStack.

## 1. Create LemonSqueezy Account

1. Go to [LemonSqueezy](https://lemonsqueezy.com) and create an account
2. Complete the onboarding process and verify your account

## 2. Create a Store

1. In your LemonSqueezy dashboard, create a new store
2. Note down your **Store ID** (you'll need this for `LEMONSQUEEZY_STORE_ID`)

## 3. Create a Product and Variant

1. Create a new product for "nomStack Plus"
2. Set up a recurring subscription (monthly/yearly)
3. Note down the **Variant ID** (you'll need this for `PUBLIC_LEMONSQUEEZY_VARIANT_ID`)

## 4. Get API Credentials

1. Go to Settings > API in your LemonSqueezy dashboard
2. Create a new API key
3. Note down the **API Key** (you'll need this for `LEMONSQUEEZY_API_KEY`)

## 5. Set up Webhook

1. Go to Settings > Webhooks in your LemonSqueezy dashboard
2. Create a new webhook with URL: `https://yourdomain.com/api/lemonsqueezy/webhook`
3. Select these events:
   - `order_created`
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_resumed`
   - `subscription_expired`
4. Note down the **Webhook Secret** (you'll need this for `LEMONSQUEEZY_WEBHOOK_SECRET`)

## 6. Environment Variables

Add these to your `.env` file:

```env
# LemonSqueezy Configuration
LEMONSQUEEZY_API_KEY=your_lemonsqueezy_api_key
LEMONSQUEEZY_WEBHOOK_SECRET=your_lemonsqueezy_webhook_secret
LEMONSQUEEZY_STORE_ID=your_lemonsqueezy_store_id
PUBLIC_LEMONSQUEEZY_VARIANT_ID=your_lemonsqueezy_variant_id

# Supabase Configuration (if not already set)
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 7. Database Migration

Run the database migration to add LemonSqueezy fields:

```bash
npx supabase db push
```

## 8. Test the Integration

1. Start your development server
2. Go to the upgrade page
3. Test the checkout flow
4. Check that webhooks are being received (check your server logs)

## 9. Production Deployment

1. Update your production environment variables
2. Deploy your application
3. Update the webhook URL to your production domain
4. Test the complete flow in production

## Troubleshooting

### Webhook Issues
- Check that your webhook URL is accessible from the internet
- Verify the webhook secret matches exactly
- Check server logs for webhook processing errors

### Checkout Issues
- Verify your variant ID is correct
- Check that your store is properly configured
- Ensure API key has the correct permissions

### Database Issues
- Make sure the migration ran successfully
- Check that the user_subscriptions table has the new LemonSqueezy columns
- Verify RLS policies allow the webhook to update subscriptions
