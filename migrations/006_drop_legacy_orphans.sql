-- Drop the last remaining pre-Supabase prototype tables (integer user_ids,
-- unrelated to the current UUID-based auth).
DROP TABLE IF EXISTS public.sels CASCADE;
DROP TABLE IF EXISTS public.cats CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
