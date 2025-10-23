import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Video } from 'lucide-react';

export const CandidateLogin = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  const handleValidateToken = async () => {
    if (!token) {
      toast({
        title: 'Invalid Link',
        description: 'No interview token provided',
        variant: 'destructive',
      });
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
      return;
    }

    setValidating(true);
    try {
      const { data, error } = await supabase.rpc('validate_interview_token', {
        _token: token,
      });

      if (error) throw error;

      if (data && Array.isArray(data) && data.length > 0 && data[0].is_valid) {
        const validationData = data[0];
        // Fetch resume details to get candidate info
        const { data: resumeData } = await supabase
          .from('resumes')
          .select('candidate_name, position_applied')
          .eq('id', validationData.resume_id)
          .single();
        
        // Store token in session storage for interview portal
        sessionStorage.setItem('interview_token', token);
        sessionStorage.setItem('resume_id', validationData.resume_id);
        sessionStorage.setItem('candidate_name', resumeData?.candidate_name || 'Candidate');
        sessionStorage.setItem('job_title', resumeData?.position_applied || 'Position');
        
        navigate('/interview/portal');
      } else {
        toast({
          title: 'Invalid or Expired Link',
          description: 'This interview link is no longer valid. Please contact HR for a new link.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Token validation error:', error);
      toast({
        title: 'Validation Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="max-w-md w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Video Interview Portal</h1>
          <p className="text-muted-foreground">
            Welcome to SynchroHR's AI-powered interview system
          </p>
        </div>

        {token ? (
          <div className="space-y-4">
            <div className="bg-secondary/20 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Ready to begin?</p>
              <p className="text-xs text-muted-foreground">
                Click below to validate your interview link and proceed to the interview portal.
              </p>
            </div>

            <Button
              onClick={handleValidateToken}
              disabled={validating}
              className="w-full"
              size="lg"
            >
              {validating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Start Interview'
              )}
            </Button>
          </div>
        ) : (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-center">
            <p className="font-medium">No Interview Token Found</p>
            <p className="text-sm mt-2">
              Please use the link provided in your selection email.
            </p>
          </div>
        )}

        <div className="pt-6 border-t">
          <p className="text-xs text-center text-muted-foreground">
            Having trouble? Contact us at support@synchrohr.com
          </p>
        </div>
      </Card>
    </div>
  );
};

export default CandidateLogin;
