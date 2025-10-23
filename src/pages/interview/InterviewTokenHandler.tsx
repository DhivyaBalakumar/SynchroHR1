import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const InterviewTokenHandler = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast({
          title: 'Invalid Link',
          description: 'No interview token provided',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      // Permanent demo token - bypass validation
      const PERMANENT_DEMO_TOKEN = '38c1bf34-6e88-4223-851c-b77a87c571ba';
      if (token === PERMANENT_DEMO_TOKEN) {
        sessionStorage.setItem('interview_token', token);
        sessionStorage.setItem('resume_id', 'demo-resume-id');
        sessionStorage.setItem('candidate_name', 'Demo Candidate');
        sessionStorage.setItem('job_title', 'Senior Software Engineer');
        sessionStorage.setItem('candidate_email', 'demo@synchrohr.com');
        navigate('/interview/portal');
        setValidating(false);
        return;
      }

      try {
        // Validate token using the database function
        const { data, error } = await supabase.rpc('validate_interview_token', {
          _token: token
        });

        if (error) throw error;

        if (!data || data.length === 0 || !data[0]?.is_valid) {
          toast({
            title: 'Invalid or Expired Link',
            description: 'This interview link is invalid or has expired',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        const resumeId = data[0].resume_id;

        // Fetch resume details
        const { data: resumeData, error: resumeError } = await supabase
          .from('resumes')
          .select('candidate_name, position_applied, email')
          .eq('id', resumeId)
          .single();

        if (resumeError) throw resumeError;

        // Store in session storage
        sessionStorage.setItem('interview_token', token);
        sessionStorage.setItem('resume_id', resumeId);
        sessionStorage.setItem('candidate_name', resumeData.candidate_name || '');
        sessionStorage.setItem('job_title', resumeData.position_applied || '');
        sessionStorage.setItem('candidate_email', resumeData.email || '');

        // Redirect to interview portal
        navigate('/interview/portal');

      } catch (error: any) {
        console.error('Error validating token:', error);
        toast({
          title: 'Error',
          description: 'Failed to validate interview link',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <h2 className="text-xl font-semibold">Validating Interview Link...</h2>
        <p className="text-muted-foreground">Please wait while we verify your credentials</p>
      </div>
    </div>
  );
};

export default InterviewTokenHandler;
