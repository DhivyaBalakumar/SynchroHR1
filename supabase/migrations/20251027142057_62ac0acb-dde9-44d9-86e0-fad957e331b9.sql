-- Create storage bucket for job descriptions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-descriptions',
  'job-descriptions',
  false,
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Create RLS policies for job descriptions bucket
CREATE POLICY "HR can upload job descriptions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-descriptions' AND
  (SELECT has_role(auth.uid(), 'hr'::app_role))
);

CREATE POLICY "HR can view job descriptions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-descriptions' AND
  (SELECT has_role(auth.uid(), 'hr'::app_role))
);

CREATE POLICY "HR can delete job descriptions"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'job-descriptions' AND
  (SELECT has_role(auth.uid(), 'hr'::app_role))
);

-- Create table to track job description uploads
CREATE TABLE IF NOT EXISTS public.job_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_role_id UUID REFERENCES public.job_roles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_descriptions table
CREATE POLICY "HR can manage job descriptions"
ON public.job_descriptions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'hr'::app_role))
WITH CHECK (has_role(auth.uid(), 'hr'::app_role));