-- Disable RLS on resumes and candidates tables to allow public job applications
ALTER TABLE public.resumes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates DISABLE ROW LEVEL SECURITY;