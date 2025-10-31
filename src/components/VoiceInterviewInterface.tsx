import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealtimeInterview } from '@/hooks/useRealtimeInterview';
import { Loader2, MessageSquare } from 'lucide-react';
import aiInterviewer from '@/assets/ai-interviewer.png';
import { useToast } from '@/hooks/use-toast';

interface VoiceInterviewInterfaceProps {
  interviewContext: {
    candidateName: string;
    jobTitle: string;
    resumeData: any;
  };
  videoStream?: MediaStream | null;
  onTranscript?: (text: string, speaker: 'ai' | 'candidate') => void;
  onComplete?: () => void;
}

export const VoiceInterviewInterface = ({
  interviewContext,
  videoStream,
  onTranscript,
  onComplete,
}: VoiceInterviewInterfaceProps) => {
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  
  const {
    messages,
    isSpeaking,
    isConnected,
    isLoading,
    startConversation,
    endConversation,
  } = useRealtimeInterview(interviewContext);

  const handleStartConversation = async () => {
    try {
      await startConversation();
      toast({
        title: 'Interview Started',
        description: 'The AI interviewer will now begin. Speak naturally and clearly.',
      });
    } catch (error) {
      console.error('Failed to start:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to start interview',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (videoStream && userVideoRef.current) {
      userVideoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  useEffect(() => {
    if (onTranscript && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      onTranscript(lastMessage.content, lastMessage.role === 'assistant' ? 'ai' : 'candidate');
    }
  }, [messages, onTranscript]);

  const handleEndInterview = () => {
    endConversation();
    onComplete?.();
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)]">
      {/* Left side - Video area */}
      <div className="flex-1 relative">
        <Card className="h-full overflow-hidden">
          {/* Large AI interviewer image */}
          <div className="relative h-full bg-gradient-to-br from-primary/5 to-secondary/10">
            <img 
              src={aiInterviewer} 
              alt="AI Interviewer" 
              className="w-full h-full object-cover"
            />
            
            {/* AI Interviewer label */}
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-black/70 text-white">
                AI Interviewer
              </Badge>
            </div>

            {/* Small user video overlay */}
            {videoStream && (
              <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden shadow-lg border-2 border-white">
                <video
                  ref={userVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2">
                  <Badge className="bg-black/70 text-white text-xs">
                    You
                  </Badge>
                </div>
              </div>
            )}

            {/* Controls overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
              {!isConnected ? (
                <Button
                  onClick={handleStartConversation}
                  size="lg"
                  className="shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Start AI Interview'
                  )}
                </Button>
              ) : (
                <>
                  <Badge variant={isSpeaking ? 'default' : 'secondary'} className="px-4 py-2">
                    {isSpeaking ? '🎤 AI Speaking...' : '👂 Listening...'}
                  </Badge>
                  <Button
                    onClick={handleEndInterview}
                    variant="destructive"
                    size="lg"
                    className="shadow-lg"
                  >
                    End Interview
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Right side - Transcript panel */}
      <div className="w-96">
        <Card className="h-full flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Transcript</h3>
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {isConnected ? 'Live' : 'Not Connected'}
              </Badge>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Transcript will appear here...</p>
              </div>
            ) : (
              messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    message.role === 'assistant' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === 'assistant'
                        ? 'bg-secondary text-left'
                        : 'bg-primary text-primary-foreground text-right'
                    }`}
                  >
                    <p className="text-xs font-medium mb-1 opacity-70">
                      {message.role === 'assistant' ? 'AI Interviewer' : 'You'}
                    </p>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            {isSpeaking && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI is speaking...
              </div>
            )}
          </div>

          {isConnected && (
            <div className="p-4 border-t bg-secondary/20">
              <p className="text-xs text-muted-foreground text-center">
                💡 The AI will wait for you to finish speaking before responding
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
