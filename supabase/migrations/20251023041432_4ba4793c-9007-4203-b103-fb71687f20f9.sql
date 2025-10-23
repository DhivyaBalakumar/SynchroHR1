-- Fix RLS policies for job application submission
-- Drop existing policies
DROP POLICY IF EXISTS "anon_authenticated_can_submit_resumes" ON public.resumes;
DROP POLICY IF EXISTS "anon_authenticated_can_insert_candidates" ON public.candidates;

-- Create new policies that explicitly allow anonymous inserts
CREATE POLICY "Anyone can submit resumes"
ON public.resumes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can insert candidates"
ON public.candidates
FOR INSERT
TO anon, authenticated
WITH CHECK (true);