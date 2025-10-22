-- Fix RLS policies for public job applications
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can submit resumes" ON public.resumes;
DROP POLICY IF EXISTS "Anyone can insert candidates" ON public.candidates;
DROP POLICY IF EXISTS "Anyone can upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read resumes" ON storage.objects;

-- Create permissive policies for anonymous and authenticated users
CREATE POLICY "Public can submit resumes"
ON public.resumes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can insert candidates"
ON public.candidates
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Fix storage bucket policies for resume uploads
CREATE POLICY "Public can upload to resumes bucket"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Public can read from resumes bucket"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'resumes');

-- Create function to seed sample onboarding data
CREATE OR REPLACE FUNCTION seed_sample_onboarding()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sample_employee_id UUID;
  sample_workflow_id UUID;
BEGIN
  -- Get a demo intern employee
  SELECT id INTO sample_employee_id 
  FROM employees 
  WHERE position = 'Intern' OR position LIKE '%Intern%'
  LIMIT 1;

  IF sample_employee_id IS NULL THEN
    RETURN;
  END IF;

  -- Delete existing sample workflows for this employee
  DELETE FROM onboarding_workflows WHERE employee_id = sample_employee_id;

  -- Create sample workflow
  INSERT INTO onboarding_workflows (employee_id, status, started_at, progress_percentage)
  VALUES (sample_employee_id, 'in_progress', NOW() - INTERVAL '3 days', 37)
  RETURNING id INTO sample_workflow_id;

  -- Create sample tasks with various statuses
  INSERT INTO onboarding_tasks (workflow_id, title, description, task_type, priority, status, due_date, order_index, completed_at)
  VALUES
    (sample_workflow_id, 'Complete profile setup', 'Fill in personal and professional information', 'document', 'high', 'completed', CURRENT_DATE + 1, 1, NOW() - INTERVAL '2 days'),
    (sample_workflow_id, 'Review company policies', 'Read and acknowledge company policies', 'document', 'high', 'completed', CURRENT_DATE + 2, 2, NOW() - INTERVAL '2 days'),
    (sample_workflow_id, 'Complete security training', 'Complete security and compliance training', 'training', 'high', 'completed', CURRENT_DATE + 3, 3, NOW() - INTERVAL '1 day'),
    (sample_workflow_id, 'Set up development environment', 'Install required software and tools', 'system_access', 'medium', 'in_progress', CURRENT_DATE + 4, 4, NULL),
    (sample_workflow_id, 'Team introduction meeting', 'Meet team members', 'meeting', 'medium', 'pending', CURRENT_DATE + 5, 5, NULL),
    (sample_workflow_id, 'Manager 1:1 session', 'Initial meeting with manager', 'meeting', 'high', 'pending', CURRENT_DATE + 5, 6, NULL),
    (sample_workflow_id, 'Equipment setup', 'Set up workstation and laptop', 'equipment', 'high', 'pending', CURRENT_DATE + 6, 7, NULL),
    (sample_workflow_id, 'Office orientation', 'Tour of office facilities', 'orientation', 'medium', 'pending', CURRENT_DATE + 7, 8, NULL);
END;
$$;