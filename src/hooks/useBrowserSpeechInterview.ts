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
        console.log('✅ Finished speaking - now starting to listen for your response');
        setIsSpeaking(false);
        
        // Start listening immediately after AI finishes
        setTimeout(() => {
          if (recognitionRef.current && !isProcessingRef.current) {
            console.log('🎤 AUTO-STARTING recognition after AI speech');
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.log('Could not auto-start:', e);
            }
          }
        }, 500);
        
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

  // Start listening for speech - simplified version
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      console.log('⚠️ No recognition instance');
      return;
    }
    
    if (isProcessingRef.current) {
      console.log('⚠️ Already processing, skip starting');
      return;
    }
    
    if (isSpeaking) {
      console.log('⚠️ AI is speaking, skip starting');
      return;
    }

    try {
      console.log('🎤 STARTING SPEECH RECOGNITION - YOU CAN SPEAK NOW!');
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e: any) {
      if (e.message && e.message.includes('already started')) {
        console.log('⚠️ Recognition already running');
      } else {
        console.error('❌ Failed to start recognition:', e);
      }
    }
  }, [isSpeaking]);

  // Initialize and manage Speech Recognition
  useEffect(() => {
    if (!isConnected) {
      console.log('Not connected, skipping recognition setup');
      return;
    }

    console.log('Setting up speech recognition...');
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('❌ Speech recognition not supported in this browser');
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    let restartTimeout: any = null;

    recognition.onstart = () => {
      console.log('🎤 ✅ MICROPHONE IS ACTIVE - SPEAK NOW!');
      setIsListening(true);
    };

    recognition.onspeechstart = () => {
      console.log('🗣️ Speech detected!');
    };

    recognition.onspeechend = () => {
      console.log('🤐 Speech ended, processing...');
    };

    recognition.onresult = (event: any) => {
      console.log('📊 Got result event');
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        const isFinal = result.isFinal;

        console.log(`${isFinal ? '✅ FINAL' : '⏳ Interim'}: "${transcript}" (confidence: ${confidence})`);

        if (isFinal && transcript.trim().length > 0) {
          console.log('📝 FINAL transcript received:', transcript);
          
          // Stop recognition
          try {
            recognition.stop();
          } catch (e) {
            console.log('Recognition already stopped');
          }
          
          // Add user message
          const userMessage = {
            role: 'user' as const,
            content: transcript.trim(),
            timestamp: new Date(),
          };
          
          console.log('Adding user message to transcript');
          setMessages(prev => [...prev, userMessage]);
          conversationHistory.current.push({ role: 'user', content: transcript.trim() });

          // Get AI response
          console.log('Getting AI response...');
          getAIResponse(transcript.trim());
        }
      }
    };

    recognition.onend = () => {
      console.log('🛑 Recognition ended');
      setIsListening(false);
      
      // Auto-restart if still connected and not processing
      if (isConnected && !isProcessingRef.current && !isSpeaking) {
        console.log('♻️ Will restart recognition in 1 second...');
        restartTimeout = setTimeout(() => {
          if (recognitionRef.current && !isProcessingRef.current && !isSpeaking) {
            console.log('Attempting to restart recognition...');
            try {
              recognition.start();
            } catch (e) {
              console.log('Could not restart:', e);
            }
          }
        }, 1000);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Recognition ERROR:', event.error, event);
      setIsListening(false);
      
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        alert('🎤 Microphone access denied! Please allow microphone access and refresh the page.');
      } else if (event.error === 'no-speech') {
        console.log('No speech detected, will try again...');
      } else if (event.error === 'audio-capture') {
        alert('🎤 No microphone found! Please connect a microphone.');
      } else if (event.error === 'aborted') {
        console.log('Recognition was aborted');
      } else {
        console.log('Other error, will retry...');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      console.log('Cleaning up recognition...');
      if (restartTimeout) clearTimeout(restartTimeout);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Cleanup: already stopped');
        }
      }
    };
  }, [isConnected, isSpeaking]);

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
