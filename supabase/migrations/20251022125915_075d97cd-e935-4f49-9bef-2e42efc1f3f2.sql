-- Allow anonymous users to submit resumes through job applications
CREATE POLICY "Anyone can submit resumes" 
ON public.resumes 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);