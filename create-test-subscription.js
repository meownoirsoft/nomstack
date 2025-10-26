import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestSubscription() {
  // Get the current user
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);
  
  if (usersError || !users || users.length === 0) {
    console.error('No users found:', usersError);
    return;
  }
  
  const userId = users[0].id;
  console.log('Creating subscription for user:', userId);
  
  // Create a test subscription with a real-looking Stripe customer ID
  const subscriptionData = {
    user_id: userId,
    tier: 'plus',
    is_active: true,
    status: 'active',
    stripe_customer_id: 'cus_RealStripeCustomer123', // Real-looking ID
    stripe_subscription_id: 'sub_RealStripeSubscription123',
    stripe_price_id: process.env.PUBLIC_STRIPE_PRICE_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    stripe_current_period_start: new Date().toISOString(),
    stripe_current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    stripe_cancel_at_period_end: false,
    stripe_canceled_at: null
  };
  
  const { data, error } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' });
  
  if (error) {
    console.error('Error creating subscription:', error);
    return;
  }
  
  console.log('Test subscription created successfully!');
  console.log('Customer ID:', subscriptionData.stripe_customer_id);
  console.log('This should allow the Manage Subscription button to appear.');
}

createTestSubscription();
