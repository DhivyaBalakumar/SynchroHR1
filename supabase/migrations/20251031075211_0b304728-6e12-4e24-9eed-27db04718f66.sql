-- Add INSERT policy for interview_tokens to allow public token creation
CREATE POLICY "Allow public insert of interview tokens"
ON public.interview_tokens
FOR INSERT
TO public
WITH CHECK (true);