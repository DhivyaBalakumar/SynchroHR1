-- Allow anyone to view active job postings
CREATE POLICY "Anyone can view active job roles" 
ON public.job_roles 
FOR SELECT 
USING (status = 'active');