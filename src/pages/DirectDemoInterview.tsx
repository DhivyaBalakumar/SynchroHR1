import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function DirectDemoInterview() {
  const navigate = useNavigate();

  useEffect(() => {
    // Set up session storage for demo interview
    const token = `demo_direct_${Date.now()}`;
    const resumeId = crypto.randomUUID();
    
    sessionStorage.setItem('interview_token', token);
    sessionStorage.setItem('resume_id', resumeId);
    sessionStorage.setItem('candidate_name', 'Dhivya');
    sessionStorage.setItem('candidate_email', 'eng22ct0004@dsu.edu.in');
    sessionStorage.setItem('job_title', 'Software Developer');
    
    // Redirect to interview portal after a brief delay
    setTimeout(() => {
      navigate('/interview/portal');
    }, 1000);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-8">
      <Card className="p-8 text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <h2 className="text-2xl font-bold">Setting up your AI Interview...</h2>
        <p className="text-muted-foreground">
          You'll be redirected to the interview portal in a moment
        </p>
      </Card>
    </div>
  );
}
