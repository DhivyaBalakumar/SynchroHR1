import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useBrowserSpeechInterview = (interviewContext: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const conversationHistory = useRef<Array<{role: string, content: string}>>([]);
  const isProcessingRef = useRef(false);

  // Get AI response via Lovable AI
  const getAIResponse = async (userMessage: string) => {
    if (isProcessingRef.current) {
      console.log('⏭️ Already processing, skipping...');
      return;
    }

    try {
      isProcessingRef.current = true;
      setIsSpeaking(true);
      console.log('🤖 Getting AI response for:', userMessage);

      const { data, error } = await supabase.functions.invoke('interview-ai-chat', {
        body: {
          message: userMessage,
          interviewContext,
          conversationHistory: conversationHistory.current,
        },
      });

      if (error) {
        console.error('❌ Error from AI:', error);
        throw error;
      }

      const aiMessage = data.message;
      console.log('✅ AI response:', aiMessage);

      // Add AI message to state
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
      console.error('❌ Error getting AI response:', error);
    } finally {
      setIsSpeaking(false);
      isProcessingRef.current = false;
    }
  };

  // Text to Speech
  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      console.log('🔊 Speaking:', text);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.includes('en') && (voice.name.includes('Female') || voice.name.includes('Google'))
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        console.log('✅ Finished speaking');
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('❌ Speech error:', event);
        resolve();
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  };

  // Start listening for speech
  const startListening = useCallback(() => {
    if (!recognitionRef.current || isProcessingRef.current || isSpeaking) {
      return;
    }

    try {
      console.log('🎤 Starting to listen...');
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.log('⚠️ Recognition start error:', e);
    }
  }, [isSpeaking]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isConnected) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      console.error('❌ Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('✅ Recognition STARTED - Speak now!');
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript;
      const isFinal = lastResult.isFinal;

      console.log(`${isFinal ? '✅ FINAL' : '⏳ Interim'}: "${transcript}"`);

      if (isFinal && transcript.trim().length > 0) {
        console.log('📝 Processing final transcript:', transcript);
        
        // Add user message
        const userMessage = {
          role: 'user' as const,
          content: transcript.trim(),
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        conversationHistory.current.push({ role: 'user', content: transcript.trim() });

        // Get AI response
        getAIResponse(transcript.trim());
      }
    };

    recognition.onend = () => {
      console.log('🛑 Recognition ended');
      setIsListening(false);
      
      // Restart if still connected and not processing
      if (isConnected && !isProcessingRef.current && !isSpeaking) {
        setTimeout(startListening, 500);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        alert('Microphone permission denied. Please allow microphone access.');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setTimeout(startListening, 1000);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Cleanup: recognition already stopped');
        }
      }
    };
  }, [isConnected, isSpeaking, startListening]);

  // Start the interview
  const startConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🚀 Starting interview...');

      // Check browser support
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('Speech recognition not supported. Please use Chrome or Edge.');
      }

      // Request microphone permission
      console.log('🎤 Requesting microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Microphone access granted');

      // Load voices
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        await new Promise(resolve => {
          window.speechSynthesis.onvoiceschanged = resolve;
          setTimeout(resolve, 200);
        });
      }

      setIsConnected(true);
      setIsLoading(false);
      console.log('✅ Interview started');

      // Get initial AI greeting
      await getAIResponse('');
      
      // Start listening after AI finishes speaking
      setTimeout(startListening, 1000);

    } catch (error) {
      console.error('❌ Error starting:', error);
      setIsLoading(false);
      throw error;
    }
  }, [interviewContext, startListening]);

  // End the interview
  const endConversation = useCallback(() => {
    console.log('🏁 Ending interview...');
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Recognition already stopped');
      }
      recognitionRef.current = null;
    }
    
    window.speechSynthesis.cancel();
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
    isProcessingRef.current = false;
    conversationHistory.current = [];
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
