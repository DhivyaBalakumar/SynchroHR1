import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Mic, MicOff, Volume2, VolumeX, Loader2, MessageSquare } from 'lucide-react';
import aiInterviewer from '@/assets/ai-interviewer.png';

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
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [volumeEnabled, setVolumeEnabled] = useState(true);
  const [transcript, setTranscript] = useState<
    Array<{ speaker: 'ai' | 'candidate'; text: string }>
  >([]);
  const chatRef = useRef<RealtimeChat | null>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);

  const handleMessage = (event: any) => {
    console.log('Voice event:', event);

    if (event.type === 'response.audio_transcript.delta') {
      // AI speaking
      setIsSpeaking(true);
      const text = event.delta;
      setTranscript((prev) => {
        const newTranscript = [...prev];
        const lastItem = newTranscript[newTranscript.length - 1];
        if (lastItem && lastItem.speaker === 'ai') {
          lastItem.text += text;
        } else {
          newTranscript.push({ speaker: 'ai', text });
        }
        return newTranscript;
      });
      onTranscript?.(text, 'ai');
    } else if (event.type === 'response.audio_transcript.done') {
      setIsSpeaking(false);
    } else if (event.type === 'input_audio_transcription.completed') {
      // Candidate speaking
      const text = event.transcript;
      setTranscript((prev) => [...prev, { speaker: 'candidate', text }]);
      onTranscript?.(text, 'candidate');
    } else if (event.type === 'session.updated') {
      console.log('Session updated:', event);
    } else if (event.type === 'error') {
      console.error('Voice error:', event);
      toast({
        title: 'Error',
        description: event.error?.message || 'Voice error occurred',
        variant: 'destructive',
      });
    }
  };

  const startConversation = async () => {
    setIsConnecting(true);
    try {
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init(interviewContext);
      setIsConnected(true);

      toast({
        title: 'Connected',
        description: 'Voice interview is ready. Start speaking!',
      });
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start voice interview',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const endConversation = () => {
    chatRef.current?.disconnect();
    setIsConnected(false);
    setIsSpeaking(false);
    onComplete?.();
  };

  useEffect(() => {
    if (videoStream && userVideoRef.current) {
      userVideoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

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
                  onClick={startConversation}
                  disabled={isConnecting}
                  size="lg"
                  className="shadow-lg"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-5 w-5" />
                      Start Interview
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => setMicEnabled(!micEnabled)}
                    variant="secondary"
                    size="lg"
                    className="shadow-lg"
                  >
                    {micEnabled ? (
                      <Mic className="h-5 w-5" />
                    ) : (
                      <MicOff className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    onClick={() => setVolumeEnabled(!volumeEnabled)}
                    variant="secondary"
                    size="lg"
                    className="shadow-lg"
                  >
                    {volumeEnabled ? (
                      <Volume2 className="h-5 w-5" />
                    ) : (
                      <VolumeX className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    onClick={endConversation}
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
            {transcript.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Transcript will appear here...</p>
              </div>
            ) : (
              transcript.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    item.speaker === 'ai' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      item.speaker === 'ai'
                        ? 'bg-secondary text-left'
                        : 'bg-primary text-primary-foreground text-right'
                    }`}
                  >
                    <p className="text-xs font-medium mb-1 opacity-70">
                      {item.speaker === 'ai' ? 'AI Interviewer' : 'You'}
                    </p>
                    <p className="text-sm">{item.text}</p>
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
                💡 Speak clearly and naturally
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
