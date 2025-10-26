-- Manually activate the subscription
UPDATE user_subscriptions
SET 
  is_active = true,
  status = 'active',
  stripe_current_period_start = NOW(),
  stripe_current_period_end = NOW() + INTERVAL '1 month',
  expires_at = NOW() + INTERVAL '1 month',
  updated_at = NOW()
WHERE stripe_subscription_id = 'sub_1SMGTNCbySKCe8Qo4AAHITpI';
