import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

Deno.serve(async (req) => {
  // Handle WebSocket upgrade
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Expected WebSocket", { status: 400 });
  }

  const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
  let openaiWs: WebSocket | null = null;

  clientSocket.onopen = async () => {
    console.log('✅ Client connected');

    try {
      // Connect to OpenAI Realtime API
      const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';
      
      openaiWs = new WebSocket(url, {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "realtime=v1"
        }
      });

      let sessionConfigured = false;

      openaiWs.onopen = () => {
        console.log('✅ Connected to OpenAI');
      };

      openaiWs.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('📨 From OpenAI:', data.type);

        // Configure session after receiving session.created
        if (data.type === 'session.created' && !sessionConfigured) {
          sessionConfigured = true;
          console.log('🔧 Configuring session...');
          
          const sessionUpdate = {
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: `You are an AI interviewer conducting a professional job interview. 
              Ask relevant questions about the candidate's experience, skills, and qualifications.
              Be professional, friendly, and encouraging. Listen carefully to responses and ask follow-up questions.
              Keep your responses concise and natural.`,
              voice: 'alloy',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              input_audio_transcription: {
                model: 'whisper-1'
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 1000
              },
              temperature: 0.8,
              max_response_output_tokens: 4096
            }
          };

          openaiWs?.send(JSON.stringify(sessionUpdate));
          console.log('✅ Session configured');
        }

        // Forward to client
        try {
          if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(event.data);
          }
        } catch (error) {
          console.error('Error forwarding to client:', error);
        }
      };

      openaiWs.onerror = (error) => {
        console.error('❌ OpenAI WebSocket error:', error);
      };

      openaiWs.onclose = () => {
        console.log('🔌 OpenAI disconnected');
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.close();
        }
      };

    } catch (error) {
      console.error('❌ Error connecting to OpenAI:', error);
      clientSocket.close();
    }
  };

  clientSocket.onmessage = (event) => {
    // Forward client messages to OpenAI
    if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.send(event.data);
    }
  };

  clientSocket.onclose = () => {
    console.log('🔌 Client disconnected');
    if (openaiWs) {
      openaiWs.close();
    }
  };

  clientSocket.onerror = (error) => {
    console.error('❌ Client WebSocket error:', error);
  };

  return response;
});
