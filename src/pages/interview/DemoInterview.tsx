import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VoiceInterviewInterface } from '@/components/VoiceInterviewInterface';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Video, CheckCircle } from 'lucide-react';

const DemoInterview = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'welcome' | 'setup' | 'interview' | 'complete'>('welcome');
  const [userStream, setUserStream] = useState<MediaStream | null>(null);
  const [transcriptCount, setTranscriptCount] = useState(0);

  // Demo interview context
  const demoInterviewContext = {
    candidateName: 'Demo Candidate',
    jobTitle: 'Software Engineer',
    resumeData: {
      email: 'demo@example.com',
      position: 'Software Engineer',
      jobRole: 'Software Engineer',
      jobRequirements: 'Strong programming skills in JavaScript/TypeScript, experience with React, good communication skills, problem-solving abilities',
      experienceLevel: 'Mid-level (2-5 years)',
      company: 'SynchroHR'
    }
  };

  useEffect(() => {
    return () => {
      if (userStream) {
        userStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [userStream]);

  const startPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setUserStream(stream);
      setStep('interview');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Please allow camera and microphone access to continue with the demo interview.');
    }
  };

  const handleTranscriptUpdate = (text: string, speaker: 'ai' | 'candidate') => {
    console.log(`${speaker}: ${text}`);
    setTranscriptCount(prev => prev + 1);
  };

  const handleComplete = () => {
    if (userStream) {
      userStream.getTracks().forEach(track => track.stop());
    }
    setStep('complete');
  };

  const renderWelcome = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <Card className="max-w-2xl w-full p-8 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">AI Interview Demo</h1>
          <p className="text-xl text-muted-foreground">
            Experience our AI-powered interview system
          </p>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <p>
            This is a demonstration of our AI interview feature. You'll be interviewed by an AI assistant
            that will ask you questions based on the job role and requirements.
          </p>
          
          <div className="bg-secondary/20 p-4 rounded-lg space-y-2">
            <p className="font-semibold text-foreground">Demo Details:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Position: {demoInterviewContext.jobTitle}</li>
              <li>Experience Level: {demoInterviewContext.resumeData.experienceLevel}</li>
              <li>Duration: 5-7 questions (approximately 10-15 minutes)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-foreground">What to expect:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>AI will speak questions to you using text-to-speech (female voice)</li>
              <li>Your responses will be captured via speech recognition</li>
              <li>AI waits for 3 seconds of silence before asking the next question</li>
              <li>Questions are tailored to the job role and requirements</li>
            </ul>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
            <p className="font-semibold text-amber-700 dark:text-amber-400 mb-2">Requirements:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-amber-600 dark:text-amber-300">
              <li>Working microphone and camera</li>
              <li>Quiet environment for best speech recognition</li>
              <li>Modern browser (Chrome, Edge, or Safari recommended)</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={() => setStep('setup')}
            className="flex-1"
            size="lg"
          >
            Start Demo Interview
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            size="lg"
          >
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderSetup = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <Card className="max-w-2xl w-full p-8 space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Setup Your Devices</h2>
          <p className="text-muted-foreground">
            We need access to your camera and microphone for the demo interview
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-secondary/20 rounded-lg">
            <Video className="w-6 h-6 text-primary mt-1" />
            <div>
              <p className="font-semibold text-foreground">Camera Access</p>
              <p className="text-sm text-muted-foreground">
                Your video will be displayed during the interview for a realistic experience
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-secondary/20 rounded-lg">
            <Mic className="w-6 h-6 text-primary mt-1" />
            <div>
              <p className="font-semibold text-foreground">Microphone Access</p>
              <p className="text-sm text-muted-foreground">
                Required for speech recognition to capture your responses
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={startPermissions}
            className="flex-1"
            size="lg"
          >
            Grant Permissions & Continue
          </Button>
          <Button
            onClick={() => setStep('welcome')}
            variant="outline"
            size="lg"
          >
            Back
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderComplete = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <Card className="max-w-2xl w-full p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Demo Interview Complete!</h2>
          <p className="text-xl text-muted-foreground">
            Thank you for trying our AI interview demo
          </p>
        </div>

        <div className="bg-secondary/20 p-6 rounded-lg space-y-2 text-left">
          <p className="font-semibold text-foreground">Demo Summary:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Total exchanges: {transcriptCount}</li>
            <li>Position: {demoInterviewContext.jobTitle}</li>
            <li>Interview Type: AI-Powered Voice Interview</li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            In a real interview, candidates would receive detailed AI analysis including sentiment analysis,
            communication scores, technical assessment, and personalized feedback.
          </p>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={() => {
              setStep('welcome');
              setTranscriptCount(0);
            }}
            className="flex-1"
            size="lg"
          >
            Try Again
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            size="lg"
          >
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );

  if (step === 'welcome') return renderWelcome();
  if (step === 'setup') return renderSetup();
  if (step === 'complete') return renderComplete();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <VoiceInterviewInterface
        interviewContext={demoInterviewContext}
        videoStream={userStream}
        onTranscript={handleTranscriptUpdate}
        onComplete={handleComplete}
      />
    </div>
  );
};

export default DemoInterview;
