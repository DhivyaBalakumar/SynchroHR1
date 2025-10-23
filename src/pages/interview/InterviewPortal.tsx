import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Upload,
  CheckCircle2,
  Loader2,
  Camera
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VideoRecorder } from '@/components/interview/VideoRecorder';
import { VoiceInterviewInterface } from '@/components/VoiceInterviewInterface';

export const InterviewPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [step, setStep] = useState<'welcome' | 'setup' | 'interview' | 'complete'>('welcome');
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [recordedVideos, setRecordedVideos] = useState<Map<number, Blob>>(new Map());

  useEffect(() => {
    const token = sessionStorage.getItem('interview_token');
    const storedResumeId = sessionStorage.getItem('resume_id');
    const storedName = sessionStorage.getItem('candidate_name');
    const storedJob = sessionStorage.getItem('job_title');

    if (!token || !storedResumeId) {
      toast({
        title: 'Access Denied',
        description: 'Invalid session. Please use your interview link.',
        variant: 'destructive',
      });
      navigate('/interview/login');
      return;
    }

    setResumeId(storedResumeId);
    setCandidateName(storedName || '');
    setJobTitle(storedJob || '');
    
    // Generate AI questions
    generateInterviewQuestions(storedJob || '');
  }, [navigate, toast]);

  // Cleanup streams on unmount or tab visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAllStreams();
      }
    };

    const handleBeforeUnload = () => {
      stopAllStreams();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopAllStreams();
    };
  }, [videoStream, audioStream]);

  const generateInterviewQuestions = async (jobTitle: string) => {
    setLoadingQuestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-interview-questions', {
        body: {
          jobRoleTitle: jobTitle,
          jobRequirements: ['Communication', 'Problem-solving', 'Technical skills'],
          experienceLevel: 'Mid-level',
          numberOfQuestions: 5
        }
      });

      if (error) throw error;

      if (data?.questions) {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      // Fallback questions
      setQuestions([
        {
          question: "Tell me about yourself and your background.",
          category: "cultural-fit",
          difficulty: "easy"
        },
        {
          question: "What interests you about this position?",
          category: "behavioral",
          difficulty: "easy"
        },
        {
          question: "Describe a challenging project you've worked on.",
          category: "problem-solving",
          difficulty: "medium"
        },
        {
          question: "What are your key strengths and how do they apply to this role?",
          category: "behavioral",
          difficulty: "medium"
        },
        {
          question: "Where do you see yourself in the next 3-5 years?",
          category: "cultural-fit",
          difficulty: "easy"
        }
      ]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false
      });
      
      setVideoStream(stream);
      setCameraEnabled(true);
      
      // Wait for next tick to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => {
            console.error('Error playing video:', err);
          });
        }
      }, 100);

      toast({
        title: 'Camera Enabled',
        description: 'Your camera is now active',
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: 'Camera Access Denied',
        description: 'Please allow camera access to continue',
        variant: 'destructive',
      });
    }
  };

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });
      
      setAudioStream(stream);
      setMicEnabled(true);

      toast({
        title: 'Microphone Enabled',
        description: 'Your microphone is now active',
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: 'Microphone Access Denied',
        description: 'Please allow microphone access to continue',
        variant: 'destructive',
      });
    }
  };

  const stopAllStreams = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
      setCameraEnabled(false);
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
      setMicEnabled(false);
    }
  };

  const handleStartInterview = async () => {
    if (!cameraEnabled || !micEnabled) {
      toast({
        title: 'Permissions Required',
        description: 'Please enable both camera and microphone before starting',
        variant: 'destructive',
      });
      return;
    }

    // Create interview session
    try {
      const candidateEmail = sessionStorage.getItem('candidate_email') || '';
      
      const { data, error } = await supabase
        .from('interviews')
        .insert({
          candidate_name: candidateName,
          candidate_email: candidateEmail,
          position: jobTitle || 'Unknown',
          interview_type: 'ai_voice',
          status: 'in_progress',
          scheduled_at: new Date().toISOString(),
          resume_id: resumeId,
        })
        .select()
        .single();

      if (error) throw error;

      setInterviewId(data.id);
      setStep('interview');
      toast({
        title: 'Interview Started',
        description: 'Good luck! Answer naturally - the AI will listen and respond.',
      });
    } catch (error: any) {
      console.error('Error starting interview:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start interview session',
        variant: 'destructive',
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleCompleteInterview();
    }
  };

  const handleCompleteInterview = async () => {
    stopAllStreams();
    setStep('complete');

    // Mark interview as complete and trigger automation
    try {
      const token = sessionStorage.getItem('interview_token');
      
      // Update interview token
      await supabase
        .from('interview_tokens')
        .update({ 
          interview_completed: true,
          used_at: new Date().toISOString()
        })
        .eq('token', token);

      // Trigger automated completion workflow
      if (interviewId && resumeId) {
        await supabase.functions.invoke('process-interview-completion', {
          body: {
            interviewId,
            resumeId,
          },
        });
      }

      toast({
        title: 'Interview Complete!',
        description: 'Thank you for completing the interview. You will receive a confirmation email shortly.',
      });
    } catch (error) {
      console.error('Error completing interview:', error);
      toast({
        title: 'Interview Recorded',
        description: 'Your interview has been saved. HR will review your responses.',
      });
    }
  };

  const renderWelcome = () => (
    <Card className="p-8 max-w-2xl mx-auto">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <Video className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Welcome, {candidateName}!</h1>
        <p className="text-lg text-muted-foreground">
          Interview for: <strong>{jobTitle}</strong>
        </p>
        
        <div className="bg-secondary/20 p-6 rounded-lg text-left space-y-3 my-6">
          <h3 className="font-semibold text-lg">Interview Instructions:</h3>
          <ul className="space-y-2 text-sm">
            <li>✓ Find a quiet, well-lit space</li>
            <li>✓ Ensure stable internet connection</li>
            <li>✓ The interview will take approximately 20-30 minutes</li>
            <li>✓ Answer each question naturally and take your time</li>
            <li>✓ You can review your resume before starting</li>
          </ul>
        </div>

        <div className="flex gap-3 justify-center">
          <Button onClick={() => setStep('setup')} size="lg">
            Continue to Setup
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderSetup = () => (
    <Card className="p-8 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Camera & Microphone Setup</h2>
          <p className="text-muted-foreground">
            Please enable your camera and microphone to proceed
          </p>
        </div>

        <div className="aspect-video bg-secondary/20 rounded-lg overflow-hidden relative">
          {cameraEnabled ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Camera not active</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 items-center">
          <div className="flex gap-3">
            <Button 
              onClick={startVideo} 
              size="lg"
              disabled={cameraEnabled}
              variant={cameraEnabled ? "outline" : "default"}
            >
              {cameraEnabled ? (
                <>
                  <Video className="mr-2 h-5 w-5" />
                  Camera Enabled
                </>
              ) : (
                <>
                  <Video className="mr-2 h-5 w-5" />
                  Enable Camera
                </>
              )}
            </Button>
            <Button 
              onClick={startAudio} 
              size="lg"
              disabled={micEnabled}
              variant={micEnabled ? "outline" : "default"}
            >
              {micEnabled ? (
                <>
                  <Mic className="mr-2 h-5 w-5" />
                  Microphone Enabled
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-5 w-5" />
                  Enable Microphone
                </>
              )}
            </Button>
          </div>
          
          {cameraEnabled && micEnabled && (
            <Button onClick={handleStartInterview} size="lg" className="w-full max-w-xs">
              Start Interview
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  const renderInterview = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">AI Voice Interview</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Position: {jobTitle}
            </p>
          </div>
        </div>
      </Card>

      <VoiceInterviewInterface
        interviewContext={{
          candidateName: candidateName,
          jobTitle: jobTitle,
          resumeData: {}
        }}
        onComplete={handleCompleteInterview}
      />
    </div>
  );

  const renderComplete = () => (
    <Card className="p-8 max-w-2xl mx-auto text-center space-y-6">
      <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
      </div>
      <h1 className="text-3xl font-bold">Interview Complete!</h1>
      <p className="text-lg text-muted-foreground">
        Thank you for completing the video interview, {candidateName}.
      </p>
      <div className="bg-secondary/20 p-6 rounded-lg space-y-2">
        <p className="font-medium">What happens next?</p>
        <ul className="text-sm text-left space-y-2 max-w-md mx-auto">
          <li>✓ Our HR team will review your interview responses</li>
          <li>✓ You'll receive an update within 3-5 business days</li>
          <li>✓ Selected candidates will be contacted for the next round</li>
        </ul>
      </div>
      <p className="text-sm text-muted-foreground">
        You may now close this window.
      </p>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      {step === 'welcome' && renderWelcome()}
      {step === 'setup' && renderSetup()}
      {step === 'interview' && renderInterview()}
      {step === 'complete' && renderComplete()}
    </div>
  );
};

export default InterviewPortal;
