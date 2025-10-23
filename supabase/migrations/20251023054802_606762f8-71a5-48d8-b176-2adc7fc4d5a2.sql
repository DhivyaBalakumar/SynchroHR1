-- Create permanent demo interview data
INSERT INTO public.resumes (
  id,
  candidate_name,
  email,
  phone,
  position_applied,
  screening_status,
  source,
  pipeline_stage,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Candidate',
  'demo@synchrohr.com',
  '+1-555-0100',
  'Senior Software Engineer',
  'selected',
  'demo',
  'interview',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  candidate_name = EXCLUDED.candidate_name,
  email = EXCLUDED.email,
  position_applied = EXCLUDED.position_applied;

-- Create permanent demo interview token
INSERT INTO public.interview_tokens (
  id,
  resume_id,
  token,
  expires_at,
  created_at,
  interview_completed
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  '38c1bf34-6e88-4223-851c-b77a87c571ba',
  '2099-12-31 23:59:59+00',
  NOW(),
  false
)
ON CONFLICT (token) DO UPDATE SET
  expires_at = EXCLUDED.expires_at;