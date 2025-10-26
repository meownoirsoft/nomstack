-- Migration to fix user_subscriptions table constraints
-- This adds a unique constraint on user_id to prevent duplicate subscriptions

-- First, remove any duplicate subscriptions (keep the most recent one)
WITH ranked_subscriptions AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM user_subscriptions
)
DELETE FROM user_subscriptions 
WHERE id IN (
  SELECT id FROM ranked_subscriptions WHERE rn > 1
);

-- Add unique constraint on user_id
ALTER TABLE user_subscriptions 
ADD CONSTRAINT unique_user_subscription UNIQUE (user_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id 
ON user_subscriptions(user_id);

-- Add index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id 
ON user_subscriptions(stripe_customer_id);

-- Add index for Stripe subscription lookups  
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id 
ON user_subscriptions(stripe_subscription_id);

-- Show summary
SELECT 
  'Migration Summary' as info,
  COUNT(*) as total_subscriptions,
  COUNT(DISTINCT user_id) as unique_users
FROM user_subscriptions;



