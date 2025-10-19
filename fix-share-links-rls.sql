-- Fix RLS policies for share_links table
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.share_links;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.share_links;
DROP POLICY IF EXISTS "Enable update for users who own meal_plan" ON public.share_links;
DROP POLICY IF EXISTS "Enable delete for users who own meal_plan" ON public.share_links;

-- Create new policies that work with the API
CREATE POLICY "Enable read access for all users" ON public.share_links FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.share_links FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Enable update for users who own share link" ON public.share_links FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Enable delete for users who own share link" ON public.share_links FOR DELETE USING (auth.uid() = created_by);
