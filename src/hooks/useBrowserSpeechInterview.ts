import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Check if browser supports Speech APIs
const isSpeechRecognitionSupported = () => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

const isSpeechSynthesisSupported = () => {
  return 'speechSynthesis' in window;
};

export const useBrowserSpeechInterview = (interviewContext: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const conversationHistory = useRef<Array<{role: string, content: string}>>([]);
  const questionCountRef = useRef(0);

  // Initialize Speech Recognition
  const initRecognition = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      throw new Error('Speech recognition not supported in this browser');
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      // Restart if still connected
      if (isConnected) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.log('Recognition already started');
          }
        }, 100);
      }
    };

    recognition.onresult = async (event: any) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      
      console.log('User said:', transcript);
      
      // Add user message
      const userMessage = {
        role: 'user' as const,
        content: transcript,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      conversationHistory.current.push({ role: 'user', content: transcript });

      // Get AI response
      await getAIResponse(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    return recognition;
  }, [isConnected]);

  // Get AI response via Lovable AI
  const getAIResponse = async (userMessage: string) => {
    try {
      setIsSpeaking(true);

      const { data, error } = await supabase.functions.invoke('interview-ai-chat', {
        body: {
          message: userMessage,
          interviewContext,
          conversationHistory: conversationHistory.current,
        },
      });

      if (error) throw error;

      const aiMessage = data.message;
      questionCountRef.current++;

      // Add AI message
      const assistantMessage = {
        role: 'assistant' as const,
        content: aiMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      conversationHistory.current.push({ role: 'assistant', content: aiMessage });

      // Speak the response
      await speakText(aiMessage);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      setIsSpeaking(false);
    }
  };

  // Text to Speech
  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!isSpeechSynthesisSupported()) {
        console.error('Speech synthesis not supported');
        setIsSpeaking(false);
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to get a natural voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || voice.name.includes('Female')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        console.log('AI started speaking');
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        console.log('AI finished speaking');
        setIsSpeaking(false);
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        resolve();
      };

      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);
    });
  };

  // Start the interview
  const startConversation = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check browser support
      if (!isSpeechRecognitionSupported()) {
        throw new Error('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      }
      if (!isSpeechSynthesisSupported()) {
        throw new Error('Speech synthesis is not supported in your browser.');
      }

      // Initialize speech recognition
      recognitionRef.current = initRecognition();
      synthRef.current = window.speechSynthesis;

      // Load voices (needed for some browsers)
      if (window.speechSynthesis.getVoices().length === 0) {
        await new Promise(resolve => {
          window.speechSynthesis.onvoiceschanged = resolve;
        });
      }

      // Start recognition
      recognitionRef.current.start();
      setIsConnected(true);
      setIsLoading(false);

      // Get initial AI greeting
      await getAIResponse('');

    } catch (error) {
      console.error('Error starting conversation:', error);
      setIsLoading(false);
      throw error;
    }
  }, [interviewContext, initRecognition]);

  // End the interview
  const endConversation = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (synthRef.current) {
      window.speechSynthesis.cancel();
    }
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
    conversationHistory.current = [];
    questionCountRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      endConversation();
    };
  }, [endConversation]);

  return {
    messages,
    isConnected,
    isSpeaking,
    isLoading,
    isListening,
    startConversation,
    endConversation,
  };
};
