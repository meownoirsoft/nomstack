-- Drop the existing check constraint
ALTER TABLE user_subscriptions 
DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;

-- Add new check constraint with all valid Stripe subscription statuses
ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_status_check 
CHECK (status IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'));
