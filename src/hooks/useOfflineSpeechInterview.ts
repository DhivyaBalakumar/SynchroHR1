import { useState, useCallback, useRef, useEffect } from 'react';
import { pipeline } from '@huggingface/transformers';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const INTERVIEW_QUESTIONS = [
  "Hello! I'm your AI interviewer. Can you tell me about yourself?",
  "What interests you most about this position?",
  "Can you describe a challenging project you've worked on?",
  "How do you handle working under pressure?",
  "Where do you see yourself in the next few years?",
  "Do you have any questions for me?",
  "Thank you for your time! We'll be in touch soon."
];

export const useOfflineSpeechInterview = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('');
  
  const transcriberRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const questionIndexRef = useRef(0);
  const isProcessingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const shouldContinueRef = useRef(false);

  const getNextQuestion = () => {
    const question = INTERVIEW_QUESTIONS[questionIndexRef.current];
    questionIndexRef.current = Math.min(questionIndexRef.current + 1, INTERVIEW_QUESTIONS.length - 1);
    return question;
  };

  const speakText = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
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
  };

  const processUserResponse = async (userMessage: string) => {
    if (isProcessingRef.current || !userMessage.trim()) {
      return;
    }
    
    isProcessingRef.current = true;
    console.log('💬 Processing user response:', userMessage);

    try {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      
      const nextQuestion = getNextQuestion();

      const assistantMessage = {
        role: 'assistant' as const,
        content: nextQuestion,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      await speakText(nextQuestion);

      isProcessingRef.current = false;

      // Start listening again after AI speaks
      if (shouldContinueRef.current) {
        setTimeout(() => {
          startListening();
        }, 500);
      }
      
    } catch (error) {
      console.error('Error processing response:', error);
      setIsSpeaking(false);
      isProcessingRef.current = false;
    }
  };

  const startListening = () => {
    if (!shouldContinueRef.current || isProcessingRef.current || isSpeakingRef.current) {
      return;
    }

    console.log('🎤 Starting to listen...');
    audioChunksRef.current = [];
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          console.log('🎤 Recording stopped, transcribing...');
          setIsListening(false);
          
          if (audioChunksRef.current.length > 0 && transcriberRef.current) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            
            try {
              // Convert blob to array buffer
              const arrayBuffer = await audioBlob.arrayBuffer();
              const audioData = new Uint8Array(arrayBuffer);
              
              console.log('🔄 Transcribing audio...');
              const output = await transcriberRef.current(audioData);
              const transcribedText = output.text.trim();
              
              console.log('✅ Transcribed:', transcribedText);
              
              if (transcribedText) {
                const userMessage = {
                  role: 'user' as const,
                  content: transcribedText,
                  timestamp: new Date(),
                };
                
                setMessages(prev => [...prev, userMessage]);
                await processUserResponse(transcribedText);
              }
            } catch (error) {
              console.error('Transcription error:', error);
            }
          }
          
          // Cleanup
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsListening(true);
        console.log('🎤 Recording started, speak now...');

        // Record for 5 seconds then auto-stop
        setTimeout(() => {
          if (mediaRecorderRef.current?.state === 'recording') {
            console.log('⏱️ 5 seconds elapsed, stopping recording...');
            mediaRecorderRef.current.stop();
          }
        }, 5000);

      })
      .catch(error => {
        console.error('Microphone error:', error);
        alert('Please allow microphone access');
      });
  };

  const startConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadingProgress('Loading AI model (first time only, ~50MB)...');
      console.log('🚀 STARTING OFFLINE INTERVIEW');

      // Request microphone permission
      console.log('🎤 Requesting microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted');
      stream.getTracks().forEach(track => track.stop());

      // Load Whisper model for speech recognition
      console.log('📦 Loading Whisper model...');
      setLoadingProgress('Downloading Whisper model... (this may take a minute)');
      
      const transcriber = await pipeline(
        'automatic-speech-recognition',
        'onnx-community/whisper-tiny.en',
        { 
          device: 'webgpu',
          progress_callback: (progress: any) => {
            if (progress.status === 'progress') {
              const percent = Math.round((progress.loaded / progress.total) * 100);
              setLoadingProgress(`Loading model: ${percent}%`);
            }
          }
        }
      );
      
      transcriberRef.current = transcriber;
      console.log('✅ Model loaded successfully');

      setIsConnected(true);
      setIsLoading(false);
      setLoadingProgress('');
      shouldContinueRef.current = true;
      questionIndexRef.current = 0;

      // Start with first question
      const firstQuestion = getNextQuestion();
      const introMessage = {
        role: 'assistant' as const,
        content: firstQuestion,
        timestamp: new Date(),
      };
      setMessages([introMessage]);

      setIsSpeaking(true);
      isSpeakingRef.current = true;
      await speakText(firstQuestion);

      // Start listening after intro
      setTimeout(() => {
        startListening();
      }, 500);

    } catch (error) {
      console.error('❌ Setup error:', error);
      setIsLoading(false);
      setLoadingProgress('');
      alert('Failed to initialize: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  }, []);

  const endConversation = useCallback(() => {
    console.log('🏁 Ending interview');
    
    shouldContinueRef.current = false;
    
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    window.speechSynthesis.cancel();
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
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
    loadingProgress,
    startConversation,
    endConversation,
  };
};
