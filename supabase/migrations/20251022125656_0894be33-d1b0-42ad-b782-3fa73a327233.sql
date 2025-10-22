-- Drop the existing policy that's not working properly
DROP POLICY IF EXISTS "Public can insert candidates" ON public.candidates;

-- Create a new policy that allows both anonymous and authenticated users to insert
CREATE POLICY "Anyone can insert candidates" 
ON public.candidates 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Also ensure anonymous users can read candidates they just created
DROP POLICY IF EXISTS "Authenticated users can view candidates" ON public.candidates;

CREATE POLICY "Anyone can view candidates" 
ON public.candidates 
FOR SELECT 
TO anon, authenticated
USING (true);