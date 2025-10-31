import { useState, useCallback, useRef, useEffect } from 'react';
import { RealtimeChat } from '@/utils/RealtimeAudio';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useRealtimeInterview = (interviewContext: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<RealtimeChat | null>(null);

  const handleMessage = useCallback((event: any) => {
    console.log('Received event:', event);

    if (event.type === 'session.created') {
      console.log('Session created successfully');
    } else if (event.type === 'conversation.item.created') {
      console.log('Conversation item created:', event);
    } else if (event.type === 'response.audio_transcript.delta') {
      // Handle transcript deltas
      const delta = event.delta;
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          return [
            ...prev.slice(0, -1),
            {
              ...lastMessage,
              content: lastMessage.content + delta,
            },
          ];
        } else {
          return [
            ...prev,
            {
              role: 'assistant',
              content: delta,
              timestamp: new Date(),
            },
          ];
        }
      });
    } else if (event.type === 'response.audio_transcript.done') {
      console.log('Transcript complete:', event.transcript);
    } else if (event.type === 'input_audio_buffer.speech_started') {
      console.log('User started speaking');
      setIsSpeaking(false); // AI stops speaking when user starts
    } else if (event.type === 'input_audio_buffer.speech_stopped') {
      console.log('User stopped speaking');
    } else if (event.type === 'response.audio.delta') {
      setIsSpeaking(true);
    } else if (event.type === 'response.audio.done') {
      setIsSpeaking(false);
    } else if (event.type === 'conversation.item.input_audio_transcription.completed') {
      // User's speech transcribed
      const transcript = event.transcript;
      console.log('User said:', transcript);
      setMessages(prev => [
        ...prev,
        {
          role: 'user',
          content: transcript,
          timestamp: new Date(),
        },
      ]);
    } else if (event.type === 'error') {
      console.error('Realtime API error:', event);
    }
  }, []);

  const startConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Starting conversation with context:', interviewContext);
      
      chatRef.current = new RealtimeChat(handleMessage, interviewContext);
      await chatRef.current.init();
      
      setIsConnected(true);
      setIsLoading(false);
      console.log('Conversation started successfully');
    } catch (error) {
      console.error('Error starting conversation:', error);
      setIsLoading(false);
      throw error;
    }
  }, [interviewContext, handleMessage]);

  const endConversation = useCallback(() => {
    chatRef.current?.disconnect();
    setIsConnected(false);
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  return {
    messages,
    isConnected,
    isSpeaking,
    isLoading,
    startConversation,
    endConversation,
  };
};
