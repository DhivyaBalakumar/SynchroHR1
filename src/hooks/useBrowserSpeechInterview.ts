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

  // Get AI response via Lovable AI
  const getAIResponse = async (userMessage: string) => {
    try {
      setIsSpeaking(true);
      console.log('🤖 Getting AI response...');

      const { data, error } = await supabase.functions.invoke('interview-ai-chat', {
        body: {
          message: userMessage,
          interviewContext,
          conversationHistory: conversationHistory.current,
        },
      });

      if (error) throw error;

      const aiMessage = data.message;
      console.log('✅ AI says:', aiMessage);

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
      
      setIsSpeaking(false);
      
      // Restart listening after AI speaks
      setTimeout(() => {
        if (recognitionRef.current) {
          try {
            console.log('🎤 Restarting recognition...');
            recognitionRef.current.start();
          } catch (e) {
            console.log('Recognition restart failed:', e);
          }
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error:', error);
      setIsSpeaking(false);
    }
  };

  // Text to Speech
  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      console.log('🔊 AI speaking...');
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en'));
      if (englishVoice) utterance.voice = englishVoice;

      utterance.onend = () => {
        console.log('✅ AI finished speaking');
        resolve();
      };

      utterance.onerror = () => resolve();

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  };

  // Start conversation
  const startConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🚀 Starting interview...');

      // Check support
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('Speech recognition not supported. Use Chrome or Edge.');
      }

      // Request microphone
      console.log('🎤 Requesting microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Microphone granted!');

      // Initialize recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('🎤🎤🎤 LISTENING NOW - SPEAK!!!');
        setIsListening(true);
      };

      recognition.onspeechstart = () => {
        console.log('🗣️ Speech detected!');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (interimTranscript) {
          console.log('⏳ Interim:', interimTranscript);
        }

        if (finalTranscript) {
          console.log('✅ FINAL:', finalTranscript);
          
          // Stop recognition
          recognition.stop();
          
          // Add user message
          const userMessage = {
            role: 'user' as const,
            content: finalTranscript.trim(),
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, userMessage]);
          conversationHistory.current.push({ role: 'user', content: finalTranscript.trim() });

          // Get AI response
          getAIResponse(finalTranscript.trim());
        }
      };

      recognition.onend = () => {
        console.log('🛑 Recognition stopped');
        setIsListening(false);
        
        // Auto-restart if not speaking
        if (!isSpeaking) {
          setTimeout(() => {
            try {
              console.log('♻️ Auto-restarting...');
              recognition.start();
            } catch (e) {
              console.log('Restart failed:', e);
            }
          }, 1000);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Error:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          alert('🎤 Microphone blocked! Please allow access and refresh.');
        } else if (event.error === 'no-speech') {
          console.log('No speech, will retry...');
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              console.log('Retry failed');
            }
          }, 1000);
        }
      };

      recognitionRef.current = recognition;

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

      // Get AI greeting
      await getAIResponse('');
      
      // Start listening after greeting
      setTimeout(() => {
        console.log('🎤 Starting initial recognition...');
        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to start:', e);
        }
      }, 1500);

    } catch (error) {
      console.error('❌ Startup error:', error);
      setIsLoading(false);
      throw error;
    }
  }, [interviewContext]);

  // End conversation
  const endConversation = useCallback(() => {
    console.log('🏁 Ending...');
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Already stopped');
      }
      recognitionRef.current = null;
    }
    
    window.speechSynthesis.cancel();
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
    conversationHistory.current = [];
  }, []);

  useEffect(() => {
    return () => endConversation();
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
