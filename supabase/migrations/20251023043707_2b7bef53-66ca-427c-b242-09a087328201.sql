-- Allow anonymous users to insert interviews (for public interview portal)
DROP POLICY IF EXISTS "Public can create interviews" ON public.interviews;
CREATE POLICY "Public can create interviews"
ON public.interviews
FOR INSERT
TO anon, authenticated
WITH CHECK (true);