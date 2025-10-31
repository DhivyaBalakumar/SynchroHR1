import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    const { interviewContext } = await req.json();
    
    console.log('Received interview context:', JSON.stringify(interviewContext, null, 2));
    
    // Validate interviewContext
    if (!interviewContext) {
      throw new Error("Interview context is required");
    }
    
    const jobTitle = interviewContext.jobTitle || 'this position';
    const candidateName = interviewContext.candidateName || 'there';
    
    console.log(`Creating session for ${candidateName} interviewing for ${jobTitle}`);

    // Build system prompt for AI interviewer - CRITICAL: Use the actual job title
    const systemPrompt = `You are a professional HR interviewer named Sarah conducting a real-time voice interview for the "${jobTitle}" position at SynchroHR.

CANDIDATE INFORMATION:
- Name: ${candidateName}
- Position Applied: ${jobTitle}

YOUR ROLE AS INTERVIEWER:
1. Start IMMEDIATELY by greeting the candidate by name and clearly stating the SPECIFIC position: "Hello ${candidateName}, I'm Sarah, your interviewer for the ${jobTitle} position at SynchroHR. How are you doing today?"

2. NEVER say "General Position" - ALWAYS use the exact job title: "${jobTitle}"

3. Ask relevant, specific questions about:
   - Their background and relevant experience for ${jobTitle}
   - Technical skills needed for ${jobTitle}
   - Problem-solving abilities
   - Cultural fit and motivation for applying to ${jobTitle}
   - Their questions about the ${jobTitle} role

4. CONVERSATION FLOW:
   - Listen carefully to COMPLETE answers before responding
   - Acknowledge what they said before asking next question
   - Ask natural follow-up questions based on their responses
   - Keep responses concise (2-3 sentences max)
   - If they give a short answer, ask them to elaborate
   - Move through 5-6 questions naturally

5. IMPORTANT RULES:
   - DO NOT repeat the same question
   - DO NOT ignore their responses
   - DO build on what they say
   - DO make it feel like a natural conversation
   - ALWAYS refer to the position as "${jobTitle}", never as "General Position" or anything else

6. Example conversation flow:
   - Greeting with specific job title
   - "Tell me about your background"
   - Follow up on something specific they mentioned
   - Ask about relevant technical skills for ${jobTitle}
   - Behavioral question
   - Their questions for you
   - Thank them and close

Remember: This is for the "${jobTitle}" position. Use that EXACT title every time.`;

    // Request an ephemeral token from OpenAI with session configuration
    const sessionConfig = {
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: "coral",
      instructions: systemPrompt,
      modalities: ["text", "audio"],
      temperature: 0.8,
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 1000
      },
      input_audio_transcription: {
        model: "whisper-1"
      }
    };
    
    console.log('Session config:', JSON.stringify(sessionConfig, null, 2));
    
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionConfig),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`Failed to create realtime session: ${errorText}`);
    }

    const data = await response.json();
    console.log("Realtime session created successfully with job title:", jobTitle);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
