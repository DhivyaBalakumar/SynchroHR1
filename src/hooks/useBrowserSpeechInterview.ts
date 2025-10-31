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
  const networkErrorCountRef = useRef(0);
  const shouldContinueRef = useRef(false);

  // Get next question (rule-based, no API)
  const getNextQuestion = () => {
    const question = INTERVIEW_QUESTIONS[questionIndexRef.current];
    questionIndexRef.current = Math.min(questionIndexRef.current + 1, INTERVIEW_QUESTIONS.length - 1);
    return question;
  };

  const processUserResponse = async (userMessage: string) => {
    if (isProcessingRef.current) {
      return;
    }
    
    isProcessingRef.current = true;

    try {
      // Stop recognition while processing
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          setIsListening(false);
        } catch (e) {
          // Ignore stop errors
        }
      }

      setIsSpeaking(true);
      isSpeakingRef.current = true;
      
      const nextQuestion = getNextQuestion();

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
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          resolve();
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          resolve();
        };
        
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      });

      isProcessingRef.current = false;

      // Restart listening
      if (recognitionRef.current && shouldContinueRef.current) {
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (e) {
            // Ignore restart errors
          }
        }, 500);
      }
      
    } catch (error) {
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
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      console.log('✅ Recognition configured');

      // Event handlers
      recognition.onstart = () => {
        setIsListening(true);
        networkErrorCountRef.current = 0; // Reset on successful start
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
        }
        
        // Auto-restart with smart delay
        if (shouldContinueRef.current && !isProcessingRef.current && !isSpeakingRef.current) {
          // Longer delay if we've had network errors
          const delay = networkErrorCountRef.current > 2 ? 2000 : 800;
          
          restartTimeoutRef.current = window.setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              // Ignore restart errors
            }
          }, delay);
        }
      };

      recognition.onerror = (event: any) => {
        // Silently handle network errors - Chrome's speech recognition needs internet
        if (event.error === 'network') {
          networkErrorCountRef.current++;
          // Don't log or show error - just retry
          return;
        }
        
        if (event.error === 'no-speech' || event.error === 'aborted') {
          // Normal cases - continue
          networkErrorCountRef.current = 0;
          return;
        }
        
        if (event.error === 'not-allowed') {
          shouldContinueRef.current = false;
          setIsListening(false);
          alert('Please allow microphone access');
        }
      };

      recognition.onresult = (event: any) => {
        networkErrorCountRef.current = 0; // Reset on successful recognition
        
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final.trim()) {
          setInterimTranscript('');
          
          const userMessage = {
            role: 'user' as const,
            content: final.trim(),
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, userMessage]);
          processUserResponse(final.trim());
        }
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
      shouldContinueRef.current = true;
      networkErrorCountRef.current = 0;
      
      // Reset question index
      questionIndexRef.current = 0;

      console.log('✅ Setup complete');

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
      setTimeout(() => {
        try {
          recognition.start();
        } catch (e) {
          console.log('Start error:', e);
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
    
    shouldContinueRef.current = false;
    
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
    networkErrorCountRef.current = 0;
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
