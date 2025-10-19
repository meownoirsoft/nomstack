-- Migration to add "Snack", "Dessert", and "Side" categories to all existing users
-- This script will only add categories that don't already exist for each user

-- Add "Snack" category to users who don't already have it
INSERT INTO categories (user_id, name, color, sort_order, created_at, updated_at)
SELECT 
    p.id as user_id,
    'Snack' as name,
    '#f97316' as color,
    4 as sort_order,
    NOW() as created_at,
    NOW() as updated_at
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM categories c 
    WHERE c.user_id = p.id 
    AND c.name = 'Snack'
);

-- Add "Dessert" category to users who don't already have it
INSERT INTO categories (user_id, name, color, sort_order, created_at, updated_at)
SELECT 
    p.id as user_id,
    'Dessert' as name,
    '#ec4899' as color,
    5 as sort_order,
    NOW() as created_at,
    NOW() as updated_at
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM categories c 
    WHERE c.user_id = p.id 
    AND c.name = 'Dessert'
);

-- Add "Side" category to users who don't already have it
INSERT INTO categories (user_id, name, color, sort_order, created_at, updated_at)
SELECT 
    p.id as user_id,
    'Side' as name,
    '#84cc16' as color,
    6 as sort_order,
    NOW() as created_at,
    NOW() as updated_at
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM categories c 
    WHERE c.user_id = p.id 
    AND c.name = 'Side'
);

-- Show summary of what was added
SELECT 
    'Migration Summary' as info,
    COUNT(DISTINCT user_id) as users_with_snack,
    (SELECT COUNT(DISTINCT id) FROM profiles) as total_users
FROM categories 
WHERE name = 'Snack';

SELECT 
    'Migration Summary' as info,
    COUNT(DISTINCT user_id) as users_with_dessert,
    (SELECT COUNT(DISTINCT id) FROM profiles) as total_users
FROM categories 
WHERE name = 'Dessert';

SELECT 
    'Migration Summary' as info,
    COUNT(DISTINCT user_id) as users_with_side,
    (SELECT COUNT(DISTINCT id) FROM profiles) as total_users
FROM categories 
WHERE name = 'Side';
