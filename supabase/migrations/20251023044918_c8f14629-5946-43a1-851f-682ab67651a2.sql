-- Remove all RLS policies from interviews table
DROP POLICY IF EXISTS "anon_insert_interviews" ON public.interviews;
DROP POLICY IF EXISTS "hr_all_interviews" ON public.interviews;

-- Disable RLS on interviews table
ALTER TABLE public.interviews DISABLE ROW LEVEL SECURITY;