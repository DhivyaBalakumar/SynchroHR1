import { useState, useCallback, useRef } from 'react';
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
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const conversationHistory = useRef<Array<{role: string, content: string}>>([]);
  const isProcessing = useRef(false);

  // Get AI response
  const getAIResponse = async (userMessage: string) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    try {
      setIsSpeaking(true);
      console.log('🤖 Getting AI response for:', userMessage);

      const { data, error } = await supabase.functions.invoke('interview-ai-chat', {
        body: {
          message: userMessage,
          interviewContext,
          conversationHistory: conversationHistory.current,
        },
      });

      if (error) throw error;

      const aiMessage = data.message;
      console.log('✅ AI response:', aiMessage);

      // Add to messages
      const assistantMessage = {
        role: 'assistant' as const,
        content: aiMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      conversationHistory.current.push({ role: 'assistant', content: aiMessage });

      // Speak it
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(aiMessage);
        utterance.rate = 0.9;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      });

      setIsSpeaking(false);
      isProcessing.current = false;

      // Restart listening
      if (recognitionRef.current) {
        setTimeout(() => {
          try {
            recognitionRef.current.start();
            console.log('🎤 Restarted listening');
          } catch (e) {
            console.log('Already listening');
          }
        }, 500);
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
      setIsSpeaking(false);
      isProcessing.current = false;
    }
  };

  // Start conversation
  const startConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('============================================');
      console.log('🚀 STARTING INTERVIEW');
      console.log('============================================');

      // Check browser support
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) {
        alert('❌ Speech recognition not supported in this browser. Please use Chrome or Edge.');
        throw new Error('Speech recognition not supported');
      }

      console.log('✅ Speech recognition supported');

      // Request microphone permission
      console.log('🎤 Requesting microphone permission...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ Microphone permission GRANTED');
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error('❌ Microphone permission DENIED:', err);
        alert('🎤 Microphone access denied! Please allow microphone access in your browser settings and refresh the page.');
        throw err;
      }

      // Create recognition instance
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening
      recognition.interimResults = true; // Show interim results
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      console.log('✅ Recognition instance created');

      // Event handlers
      recognition.onstart = () => {
        console.log('🎤🎤🎤 MICROPHONE ACTIVE - YOU CAN SPEAK NOW! 🎤🎤🎤');
        setIsListening(true);
      };

      recognition.onend = () => {
        console.log('🛑 Recognition ended');
        setIsListening(false);
        setInterimTranscript('');
        
        // Auto-restart if still connected and not processing
        if (isConnected && !isProcessing.current) {
          console.log('♻️ Auto-restarting recognition...');
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              console.log('Recognition already running');
            }
          }, 100);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Recognition ERROR:', event.error);
        setIsListening(false);
        setInterimTranscript('');
        
        if (event.error === 'not-allowed') {
          alert('🎤 Microphone access blocked! Please allow microphone access.');
        } else if (event.error === 'no-speech') {
          console.log('No speech detected, continuing...');
        } else if (event.error === 'aborted') {
          console.log('Recognition aborted');
        } else {
          console.log('Will attempt to restart...');
        }
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            final += transcript;
            console.log('✅✅✅ FINAL TRANSCRIPT:', transcript);
          } else {
            interim += transcript;
            console.log('⏳ Interim:', transcript);
          }
        }

        // Show interim transcript
        if (interim) {
          setInterimTranscript(interim);
        }

        // Process final transcript
        if (final.trim()) {
          setInterimTranscript('');
          
          const userMessage = {
            role: 'user' as const,
            content: final.trim(),
            timestamp: new Date(),
          };
          
          console.log('📝 Adding user message:', final.trim());
          setMessages(prev => [...prev, userMessage]);
          conversationHistory.current.push({ role: 'user', content: final.trim() });

          // Stop recognition before processing
          try {
            recognition.stop();
          } catch (e) {
            console.log('Recognition already stopped');
          }

          // Get AI response
          getAIResponse(final.trim());
        }
      };

      recognition.onspeechstart = () => {
        console.log('🗣️ SPEECH DETECTED!');
      };

      recognition.onspeechend = () => {
        console.log('🤐 Speech ended');
      };

      recognitionRef.current = recognition;

      // Load voices
      if (window.speechSynthesis.getVoices().length === 0) {
        await new Promise(resolve => {
          window.speechSynthesis.onvoiceschanged = resolve;
          setTimeout(resolve, 200);
        });
      }

      setIsConnected(true);
      setIsLoading(false);
      console.log('✅ Setup complete');

      // Get initial AI greeting
      console.log('🤖 Getting initial AI greeting...');
      await getAIResponse('');

      // Start recognition after greeting
      console.log('🎤 Starting speech recognition...');
      setTimeout(() => {
        try {
          recognition.start();
          console.log('✅ Recognition started successfully!');
        } catch (e) {
          console.error('❌ Failed to start recognition:', e);
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Fatal error during startup:', error);
      setIsLoading(false);
      throw error;
    }
  }, [interviewContext, isConnected]);

  // End conversation
  const endConversation = useCallback(() => {
    console.log('🏁 Ending interview');
    
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
    setInterimTranscript('');
    conversationHistory.current = [];
    isProcessing.current = false;
  }, []);

  return {
    messages,
    isConnected,
    isSpeaking,
    isLoading,
    isListening,
    interimTranscript,
    startConversation,
    endConversation,
  };
};
