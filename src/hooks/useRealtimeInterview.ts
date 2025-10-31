import { useState, useCallback, useRef, useEffect } from 'react';
import { AudioRecorder, encodeAudioForAPI, AudioQueue } from '@/utils/RealtimeAudio';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useRealtimeInterview = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const currentTranscriptRef = useRef('');

  const startConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🚀 Starting realtime interview...');

      // Request microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted');
      stream.getTracks().forEach(track => track.stop());

      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      audioQueueRef.current = new AudioQueue(audioContextRef.current);
      console.log('✅ Audio system initialized');

      // Connect to WebSocket
      const wsUrl = 'wss://bvrvhmurbsyafdwwmmry.supabase.co/functions/v1/realtime-interview';
      console.log('🔌 Connecting to:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setIsLoading(false);
        setIsListening(true);

        // Start audio recording
        recorderRef.current = new AudioRecorder((audioData) => {
          if (ws.readyState === WebSocket.OPEN) {
            const encoded = encodeAudioForAPI(audioData);
            ws.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: encoded
            }));
          }
        });

        recorderRef.current.start().then(() => {
          console.log('✅ Recording started');
        });
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('📨 Received:', data.type);

        // Handle different event types
        switch (data.type) {
          case 'session.created':
            console.log('✅ Session created');
            break;

          case 'session.updated':
            console.log('✅ Session configured');
            break;

          case 'input_audio_buffer.speech_started':
            console.log('🗣️ User started speaking');
            setIsListening(true);
            break;

          case 'input_audio_buffer.speech_stopped':
            console.log('🤐 User stopped speaking');
            setIsListening(false);
            break;

          case 'conversation.item.input_audio_transcription.completed':
            console.log('📝 Transcript:', data.transcript);
            const userMessage: Message = {
              role: 'user',
              content: data.transcript,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, userMessage]);
            break;

          case 'response.audio_transcript.delta':
            console.log('💬 AI transcript delta:', data.delta);
            currentTranscriptRef.current += data.delta;
            setInterimTranscript(currentTranscriptRef.current);
            break;

          case 'response.audio_transcript.done':
            console.log('✅ AI transcript complete:', currentTranscriptRef.current);
            const assistantMessage: Message = {
              role: 'assistant',
              content: currentTranscriptRef.current,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
            currentTranscriptRef.current = '';
            setInterimTranscript('');
            break;

          case 'response.audio.delta':
            if (data.delta && audioQueueRef.current) {
              setIsSpeaking(true);
              const binaryString = atob(data.delta);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              await audioQueueRef.current.addToQueue(bytes);
            }
            break;

          case 'response.audio.done':
            console.log('✅ AI finished speaking');
            setIsSpeaking(false);
            break;

          case 'error':
            console.error('❌ Error from server:', data.error);
            break;
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsLoading(false);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket closed');
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
      };

    } catch (error) {
      console.error('❌ Error starting conversation:', error);
      setIsLoading(false);
      throw error;
    }
  }, []);

  const endConversation = useCallback(() => {
    console.log('🏁 Ending conversation');
    
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }

    if (audioQueueRef.current) {
      audioQueueRef.current.clear();
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setInterimTranscript('');
    currentTranscriptRef.current = '';
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
    interimTranscript,
    startConversation,
    endConversation,
  };
};
