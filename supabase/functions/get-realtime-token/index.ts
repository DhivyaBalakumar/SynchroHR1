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

Guidelines:
- Ask relevant questions based on the candidate's resume and the job role
- Be friendly and professional
- Give the candidate time to think and respond
- Ask follow-up questions to dig deeper into their experience
- Maintain a natural conversation flow
- Keep questions concise and clear
- Assess technical skills, communication, problem-solving, and cultural fit
- Take notes on their responses for later analysis

Ask 5-7 questions total, covering:
1. Background and experience
2. Technical skills related to the role
3. Problem-solving scenarios
4. Cultural fit and motivation
5. Questions they have for the company

IMPORTANT: Start the interview by introducing yourself and clearly stating that this is an interview for the ${interviewContext.jobTitle} position. For example: "Hello ${interviewContext.candidateName}, I'm your AI interviewer for the ${interviewContext.jobTitle} position at SynchroHR."`;

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
