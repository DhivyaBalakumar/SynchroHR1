-- Ensure RLS is enabled
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public can create interviews" ON public.interviews;
DROP POLICY IF EXISTS "Allow anonymous interview creation" ON public.interviews;
DROP POLICY IF EXISTS "HR can view all interviews" ON public.interviews;
DROP POLICY IF EXISTS "HR can manage interviews" ON public.interviews;

-- Create policy for anonymous interview creation
CREATE POLICY "anon_insert_interviews"
ON public.interviews
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Create policy for HR to manage everything
CREATE POLICY "hr_all_interviews"
ON public.interviews
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'hr'))
WITH CHECK (has_role(auth.uid(), 'hr'));