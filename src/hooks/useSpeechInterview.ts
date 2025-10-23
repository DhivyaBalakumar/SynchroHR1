import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useSpeechInterview = (interviewContext: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        console.log('User said:', transcript);
        
        // Add user message
        const userMessage: Message = {
          role: 'user',
          content: transcript,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);

        // Get AI response
        await getAIResponse(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };
    }
  }, []);

  const getAIResponse = async (userMessage: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('interview-ai-chat', {
        body: {
          message: userMessage,
          interviewContext,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      if (error) throw error;

      const aiResponse = data.message;
      
      // Add AI message
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Speak the response
      speakText(aiResponse);
    } catch (error) {
      console.error('Error getting AI response:', error);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1;

      // Select female voice
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('female') ||
        voice.name.includes('Google UK English Female') ||
        voice.name.includes('Microsoft Zira') ||
        voice.name.includes('Samantha')
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        // Stop listening while AI speaks
        if (recognitionRef.current && isListening) {
          recognitionRef.current.stop();
          setIsListening(false);
        }
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        // Resume listening after AI finishes speaking
        setTimeout(() => {
          if (recognitionRef.current && isConnected) {
            recognitionRef.current.start();
            setIsListening(true);
          }
        }, 500);
      };
      utterance.onerror = () => setIsSpeaking(false);

      synthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Silence detection using Web Audio API
  const startSilenceDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.fftSize);
      
      const detectSilence = () => {
        if (!analyserRef.current || !isListening) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        // Silence threshold
        if (average < 5) {
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = window.setTimeout(() => {
              // 3 seconds of silence detected - stop recognition briefly
              console.log('Silence detected, processing speech...');
            }, 3000);
          }
        } else {
          // Sound detected, clear silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        }
        
        requestAnimationFrame(detectSilence);
      };
      
      detectSilence();
    } catch (error) {
      console.error('Error setting up silence detection:', error);
    }
  };

  const stopSilenceDetection = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startConversation = useCallback(async () => {
    setIsConnected(true);
    
    // Load voices
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    
    // Start silence detection
    await startSilenceDetection();
    
    // Start with AI introduction
    const intro = "Hello! I'm your AI interviewer. I'll be asking you a few questions about your background and experience. Let's begin. Can you tell me about yourself?";
    
    const introMessage: Message = {
      role: 'assistant',
      content: intro,
      timestamp: new Date(),
    };
    setMessages([introMessage]);
    speakText(intro);
  }, [interviewContext]);

  const endConversation = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    window.speechSynthesis.cancel();
    stopSilenceDetection();
    setIsListening(false);
    setIsSpeaking(false);
    setIsConnected(false);
  }, []);

  const toggleMic = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  }, [isListening]);

  const toggleVolume = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  return {
    messages,
    isListening,
    isSpeaking,
    isConnected,
    startConversation,
    endConversation,
    toggleMic,
    toggleVolume,
  };
};
