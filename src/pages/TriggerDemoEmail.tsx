import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';

export default function TriggerDemoEmail() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailDetails, setEmailDetails] = useState<any>(null);

  const sendDemoEmail = async () => {
    setLoading(true);
    setSent(false);
    try {
      const { data, error } = await supabase.functions.invoke('send-demo-interview-link');

      if (error) throw error;

      setEmailDetails(data);
      setSent(true);
      toast({
        title: '✅ Email Sent Successfully!',
        description: `Demo interview link sent to ${data.email}`,
      });
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send demo email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Send Demo AI Interview Link</h1>
          <p className="text-muted-foreground">
            Trigger an email to eng22ct0004@dsu.edu.in with a unique interview link
          </p>
        </div>

        <Card className="p-8 space-y-6">
          {!sent ? (
            <>
              <div className="text-center space-y-4">
                <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Ready to Send Demo Interview</h2>
                  <p className="text-muted-foreground">
                    Click the button below to send a unique AI interview link to your email
                  </p>
                </div>
              </div>

              <div className="bg-secondary/20 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-sm">Email Details:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <strong>Recipient:</strong> eng22ct0004@dsu.edu.in</li>
                  <li>• <strong>Candidate Name:</strong> Dhivya</li>
                  <li>• <strong>Position:</strong> Software Developer</li>
                  <li>• <strong>Interview Type:</strong> AI Voice Interview</li>
                  <li>• <strong>Link Validity:</strong> 30 days</li>
                </ul>
              </div>

              <Button 
                onClick={sendDemoEmail} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-5 w-5" />
                    Send Demo Interview Link to My Email
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-2 text-green-600">Email Sent Successfully! 🎉</h2>
                <p className="text-muted-foreground">
                  Check your inbox at <strong>eng22ct0004@dsu.edu.in</strong>
                </p>
              </div>

              {emailDetails && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                    <p className="font-semibold text-sm mb-2">Interview Details:</p>
                    <ul className="text-sm space-y-1 text-green-900">
                      <li>• Candidate: {emailDetails.candidateName}</li>
                      <li>• Position: {emailDetails.jobTitle}</li>
                      <li>• Email: {emailDetails.email}</li>
                      <li>• Expires: {new Date(emailDetails.expiresAt).toLocaleDateString()}</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-semibold text-sm mb-2">Your Interview Link:</p>
                    <a 
                      href={emailDetails.interviewLink} 
                      className="text-blue-600 hover:text-blue-800 text-sm break-all font-mono"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {emailDetails.interviewLink}
                    </a>
                  </div>

                  <Button 
                    onClick={() => window.open(emailDetails.interviewLink, '_blank')}
                    className="w-full"
                    size="lg"
                  >
                    🚀 Open Interview Portal Now
                  </Button>
                </div>
              )}

              <Button 
                onClick={() => {
                  setSent(false);
                  setEmailDetails(null);
                }}
                variant="outline"
                className="w-full"
              >
                Send Another Demo Link
              </Button>
            </div>
          )}
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>The email will contain a unique interview link that will take you through:</p>
          <p className="mt-2">Welcome → Camera/Mic Setup → AI Interview → Completion</p>
        </div>
      </div>
    </div>
  );
}
