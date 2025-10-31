import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Link as LinkIcon, Loader2 } from 'lucide-react';

export default function DemoInterviewLink() {
  const { toast } = useToast();
  const [candidateName, setCandidateName] = useState('Dhivya');
  const [jobTitle, setJobTitle] = useState('Software Developer');
  const [loading, setLoading] = useState(false);
  const [interviewLink, setInterviewLink] = useState('');

  const generateLink = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-demo-interview-link', {
        body: { candidateName, jobTitle }
      });

      if (error) throw error;

      setInterviewLink(data.interviewLink);
      toast({
        title: 'Demo Interview Link Generated!',
        description: 'Click the link below to start the AI interview demonstration',
      });
    } catch (error: any) {
      console.error('Error generating link:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate demo link',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(interviewLink);
    toast({
      title: 'Copied!',
      description: 'Interview link copied to clipboard',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Generate Demo Interview Link</h1>
          <p className="text-muted-foreground">
            Create a unique AI interview link for demonstration purposes
          </p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="candidateName">Candidate Name</Label>
              <Input
                id="candidateName"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Enter candidate name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Enter job title"
              />
            </div>

            <Button 
              onClick={generateLink} 
              disabled={loading || !candidateName || !jobTitle}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Link...
                </>
              ) : (
                <>
                  <LinkIcon className="mr-2 h-5 w-5" />
                  Generate Demo Interview Link
                </>
              )}
            </Button>
          </div>

          {interviewLink && (
            <div className="space-y-4 pt-4 border-t">
              <div className="bg-secondary/20 p-4 rounded-lg space-y-3">
                <p className="font-semibold text-sm">Your Demo Interview Link:</p>
                <div className="flex gap-2">
                  <Input 
                    value={interviewLink} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button onClick={copyToClipboard} size="icon" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => window.open(interviewLink, '_blank')}
                  className="flex-1"
                  size="lg"
                >
                  Open Interview Portal
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg text-sm space-y-2">
                <p className="font-semibold">Interview Details:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Candidate: {candidateName}</li>
                  <li>• Position: {jobTitle}</li>
                  <li>• Link valid for: 30 days</li>
                  <li>• AI Interviewer: Sarah (Professional voice)</li>
                </ul>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
