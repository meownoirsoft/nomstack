-- Add AllRecipes as a default source for all existing users
-- This migration adds AllRecipes to every user's sources if they don't already have it

INSERT INTO public.sources (user_id, name, abbrev)
SELECT 
    p.id as user_id,
    'AllRecipes' as name,
    'ar' as abbrev
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.sources s 
    WHERE s.user_id = p.id 
    AND s.abbrev = 'ar'
);

-- Add a comment to document this migration
COMMENT ON TABLE public.sources IS 'Sources (cookbooks, blogs, etc.) owned by a user. AllRecipes added in migration 20241212000002.';
