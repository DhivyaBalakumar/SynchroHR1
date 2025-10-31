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
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      console.log('✅ Recognition configured');

      // Event handlers
      recognition.onstart = () => {
        console.log('🎤 Recognition started');
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
        
        // Auto-restart if we should continue and not processing or speaking
        if (shouldContinueRef.current && !isProcessingRef.current && !isSpeakingRef.current) {
          // Use exponential backoff for network errors
          const delay = networkErrorCountRef.current > 0 
            ? Math.min(5000, 1000 * Math.pow(2, networkErrorCountRef.current - 1))
            : 500;
          
          console.log(`♻️ Auto-restarting recognition in ${delay}ms...`);
          restartTimeoutRef.current = window.setTimeout(() => {
            try {
              recognition.start();
              console.log('✅ Recognition restarted');
            } catch (e) {
              console.log('Could not restart:', e);
            }
          }, delay);
        } else {
          console.log('⏸️ Not restarting');
        }
      };

      recognition.onerror = (event: any) => {
        console.error('❌ ERROR:', event.error);
        
        // Handle network errors with backoff
        if (event.error === 'network') {
          networkErrorCountRef.current++;
          console.log(`⚠️ Network error #${networkErrorCountRef.current} - will retry with backoff`);
          return;
        }
        
        if (event.error === 'no-speech') {
          console.log('⚠️ No speech detected - will retry');
          networkErrorCountRef.current = 0; // Reset on no-speech
          return;
        }
        
        if (event.error === 'aborted') {
          console.log('⚠️ Recognition aborted - normal');
          return;
        }
        
        if (event.error === 'not-allowed') {
          console.log('❌ Microphone blocked!');
          shouldContinueRef.current = false;
          setIsListening(false);
          setInterimTranscript('');
        }
      };

      recognition.onresult = (event: any) => {
        // Reset network error count on successful recognition
        networkErrorCountRef.current = 0;
        
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

      // Remove verbose event listeners
      recognition.onspeechstart = null;
      recognition.onsoundstart = null;
      recognition.onaudiostart = null;
      recognition.onspeechend = null;

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
