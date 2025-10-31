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

    // Build system prompt for AI interviewer
    const systemPrompt = `You are a professional AI interviewer conducting a video interview for the ${interviewContext.jobTitle} position at SynchroHR.

Candidate: ${interviewContext.candidateName}
Role: ${interviewContext.jobTitle}

Resume Summary:
${JSON.stringify(interviewContext.resumeData, null, 2)}

CRITICAL INSTRUCTIONS:
1. START THE CONVERSATION IMMEDIATELY - Do not wait for the candidate to speak first
2. Begin with a warm greeting and introduction
3. Then ask your first question right away
4. Tailor ALL questions specifically to the ${interviewContext.jobTitle} role
5. Listen carefully and wait for complete responses before asking follow-ups
6. Keep questions concise and role-specific
7. Ask 5-7 questions covering: background, technical skills for ${interviewContext.jobTitle}, problem-solving, cultural fit

OPENING (say this immediately when connected):
"Hello ${interviewContext.candidateName}! I'm your AI interviewer for the ${interviewContext.jobTitle} position at SynchroHR. I'm excited to learn more about your background and experience. Let's get started with our first question: [Ask first ${interviewContext.jobTitle}-specific question based on their resume]"

QUESTION FOCUS FOR ${interviewContext.jobTitle}:
- Adapt questions to match the specific requirements and challenges of a ${interviewContext.jobTitle}
- Reference their resume experiences that relate to ${interviewContext.jobTitle} work
- Probe for relevant technical and soft skills needed for ${interviewContext.jobTitle}
- Assess problem-solving in ${interviewContext.jobTitle} context

Remember: Start speaking immediately when the connection is established!`;

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "coral", // Professional female voice
        instructions: systemPrompt,
        modalities: ["text", "audio"],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`Failed to create realtime session: ${errorText}`);
    }

    const data = await response.json();
    console.log("Realtime session created successfully");

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
