import { useState, useCallback, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Rule-based interview questions
const INTERVIEW_QUESTIONS = [
  "Hello! I'm your AI interviewer. Can you tell me about yourself?",
  "What interests you most about this position?",
  "Can you describe a challenging project you've worked on?",
  "How do you handle working under pressure?",
  "Where do you see yourself in the next few years?",
  "Do you have any questions for me?",
  "Thank you for your time! We'll be in touch soon."
];

export const useBrowserSpeechInterview = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const questionIndexRef = useRef(0);
  const isProcessingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const restartTimeoutRef = useRef<number | null>(null);

  // Get next question (rule-based, no API)
  const getNextQuestion = () => {
    const question = INTERVIEW_QUESTIONS[questionIndexRef.current];
    questionIndexRef.current = Math.min(questionIndexRef.current + 1, INTERVIEW_QUESTIONS.length - 1);
    return question;
  };

  // Process user response and get next question
  const processUserResponse = async (userMessage: string) => {
    if (isProcessingRef.current) {
      console.log('⏳ Already processing, skipping...');
      return;
    }
    
    isProcessingRef.current = true;
    console.log('🤖 Processing response:', userMessage);

    try {
      // Stop recognition while processing
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          setIsListening(false);
        } catch (e) {
          console.log('Recognition already stopped');
        }
      }

      setIsSpeaking(true);
      isSpeakingRef.current = true;
      
      // Get next question
      const nextQuestion = getNextQuestion();
      console.log('✅ Next question:', nextQuestion);

      // Add AI message
      const assistantMessage = {
        role: 'assistant' as const,
        content: nextQuestion,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Speak the question
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(nextQuestion);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        utterance.onend = () => {
          console.log('✅ Finished speaking');
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          resolve();
        };
        
        utterance.onerror = (e) => {
          console.error('Speech error:', e);
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          resolve();
        };
        
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      });

      isProcessingRef.current = false;

      // Restart listening after speaking
      if (recognitionRef.current && isConnected) {
        setTimeout(() => {
          try {
            recognitionRef.current.start();
            console.log('🎤 Restarted listening after AI spoke');
          } catch (e) {
            console.log('Could not restart:', e);
          }
        }, 500);
      }
      
    } catch (error) {
      console.error('❌ Error processing:', error);
      setIsSpeaking(false);
      isProcessingRef.current = false;
    }
  };

  // Start conversation
  const startConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('============================================');
      console.log('🚀 STARTING LOCAL INTERVIEW (NO APIs)');
      console.log('============================================');

      // Check browser support
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) {
        alert('❌ Speech recognition not supported. Please use Chrome or Edge.');
        throw new Error('Speech recognition not supported');
      }

      console.log('✅ Speech recognition supported');

      // Request microphone permission
      console.log('🎤 Requesting microphone...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ Microphone GRANTED');
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error('❌ Microphone DENIED:', err);
        alert('Please allow microphone access!');
        throw err;
      }

      // Create recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Changed to false for better reliability
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      console.log('✅ Recognition configured:', {
        continuous: recognition.continuous,
        interimResults: recognition.interimResults,
        lang: recognition.lang
      });

      // Event handlers
      recognition.onstart = () => {
        console.log('🎤 MICROPHONE ON - SPEAK NOW!');
        setIsListening(true);
      };

      recognition.onend = () => {
        console.log('🛑 Recognition ended');
        setIsListening(false);
        setInterimTranscript('');
        
        // Clear any pending restart
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
        }
        
        // Auto-restart if not processing or speaking (use refs to avoid closure issues)
        if (!isProcessingRef.current && !isSpeakingRef.current) {
          console.log('♻️ Auto-restarting recognition in 500ms...');
          restartTimeoutRef.current = window.setTimeout(() => {
            try {
              recognition.start();
              console.log('✅ Recognition restarted');
            } catch (e) {
              console.log('Could not restart:', e);
            }
          }, 500);
        } else {
          console.log('⏸️ Not restarting (processing or speaking)');
        }
      };

      recognition.onerror = (event: any) => {
        console.error('❌ ERROR:', event.error);
        
        // Ignore certain errors that are recoverable
        if (event.error === 'network') {
          console.log('⚠️ Network error - recognition will auto-restart');
          // Don't prevent auto-restart
          return;
        }
        
        if (event.error === 'no-speech') {
          console.log('⚠️ No speech detected - will retry');
          return;
        }
        
        if (event.error === 'aborted') {
          console.log('⚠️ Recognition aborted - normal');
          return;
        }
        
        if (event.error === 'not-allowed') {
          alert('Microphone blocked!');
          setIsListening(false);
          setInterimTranscript('');
        }
      };

      recognition.onresult = (event: any) => {
        console.log('📊📊📊 ONRESULT TRIGGERED! Event:', event);
        console.log('Results length:', event.results.length);
        
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          console.log(`Result ${i}:`, {
            transcript,
            confidence,
            isFinal: event.results[i].isFinal
          });
          
          if (event.results[i].isFinal) {
            final += transcript;
            console.log('✅✅✅ FINAL RESULT:', transcript);
          } else {
            interim += transcript;
            console.log('⏳ Interim result:', transcript);
          }
        }

        // Show interim
        if (interim) {
          console.log('📝 Setting interim transcript:', interim);
          setInterimTranscript(interim);
        }

        // Process final
        if (final.trim()) {
          console.log('🎯 Processing FINAL transcript:', final.trim());
          setInterimTranscript('');
          
          const userMessage = {
            role: 'user' as const,
            content: final.trim(),
            timestamp: new Date(),
          };
          
          console.log('💬 Adding to messages:', userMessage);
          setMessages(prev => [...prev, userMessage]);

          // Process response
          processUserResponse(final.trim());
        }
      };

      recognition.onspeechstart = () => {
        console.log('🗣️🗣️🗣️ SPEECH STARTED - Audio detected!');
      };

      recognition.onsoundstart = () => {
        console.log('🔊 Sound detected');
      };

      recognition.onaudiostart = () => {
        console.log('🎤 Audio capture started');
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
      
      // Reset question index
      questionIndexRef.current = 0;

      console.log('✅ Setup complete - Starting interview...');

      // Start with first question
      const firstQuestion = getNextQuestion();
      const introMessage = {
        role: 'assistant' as const,
        content: firstQuestion,
        timestamp: new Date(),
      };
      setMessages([introMessage]);

      // Speak introduction
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(firstQuestion);
        utterance.rate = 0.9;
        utterance.onend = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          resolve();
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          resolve();
        };
        window.speechSynthesis.speak(utterance);
      });

      // Start recognition after intro
      console.log('🎤 Starting recognition...');
      setTimeout(() => {
        try {
          recognition.start();
          console.log('✅ Recognition started!');
        } catch (e) {
          console.error('❌ Start failed:', e);
        }
      }, 500);

    } catch (error) {
      console.error('❌ Fatal error:', error);
      setIsLoading(false);
      throw error;
    }
  }, []);

  // End conversation
  const endConversation = useCallback(() => {
    console.log('🏁 Ending interview');
    
    // Clear restart timeout
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
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
    setInterimTranscript('');
    questionIndexRef.current = 0;
    isProcessingRef.current = false;
    isSpeakingRef.current = false;
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
