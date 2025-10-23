import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, interviewContext, conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build strict role-specific system prompt
    const jobRole = interviewContext?.jobRole || interviewContext?.position || 'General Position';
    const jobRequirements = interviewContext?.jobRequirements || 'Professional skills and experience';
    const experienceLevel = interviewContext?.experienceLevel || 'All levels';
    
    const systemPrompt = `You are an AI interviewer conducting a professional job interview for the position of ${jobRole}.

JOB DESCRIPTION & REQUIREMENTS:
${jobRequirements}

TARGET EXPERIENCE LEVEL: ${experienceLevel}

YOUR ROLE AS INTERVIEWER:
You must ask ONE insightful question at a time that is specifically tailored to:
- The ${jobRole} position's core responsibilities
- Essential technical and behavioral skills mentioned in the job requirements
- The candidate's ${experienceLevel} experience level

CRITICAL RULES - YOU MUST FOLLOW THESE STRICTLY:
1. ❌ NEVER answer your own questions under ANY circumstance
2. ❌ NEVER provide example answers or sample responses
3. ❌ NEVER complete the candidate's sentences or responses
4. ❌ NEVER give advice unless the candidate explicitly asks for it
5. ✅ ONLY ask questions - that is your sole purpose
6. ✅ Keep questions concise and clear (1-2 sentences max)
7. ✅ Ask follow-up questions based on the candidate's actual answers
8. ✅ Be professional, encouraging, and respectful
9. ✅ Wait for the candidate to finish completely before asking next question

QUESTION STRATEGY:
- Start with general background questions relevant to ${jobRole}
- Progress to specific technical/skill-based questions from the job requirements
- Include 1-2 behavioral questions about teamwork, problem-solving, or leadership
- After 5-7 questions, wrap up with: "Thank you for your time today. Do you have any questions for me?"

Current stage: ${conversationHistory?.length < 2 ? 'Opening - ask about background' : conversationHistory?.length < 10 ? `Question ${Math.floor(conversationHistory.length / 2) + 1}` : 'Closing - final question'}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${errorText}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || "I'm sorry, could you repeat that?";

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in interview-ai-chat:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
