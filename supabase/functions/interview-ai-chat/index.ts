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

    // Build system prompt for AI interviewer
    const systemPrompt = `You are a professional AI interviewer conducting a video interview for the ${interviewContext.jobTitle} position at SynchroHR.

Candidate: ${interviewContext.candidateName}
Role: ${interviewContext.jobTitle}

Resume Summary:
${JSON.stringify(interviewContext.resumeData, null, 2)}

CRITICAL INSTRUCTIONS:
1. If this is the first message (no conversation history), START by greeting the candidate warmly and ask your FIRST question immediately
2. Tailor ALL questions specifically to the ${interviewContext.jobTitle} role
3. Ask follow-up questions based on their responses
4. Keep responses concise and conversational (2-3 sentences max)
5. Ask 5-7 questions total covering: background, technical skills for ${interviewContext.jobTitle}, problem-solving, cultural fit
6. After 5-7 questions, thank them and conclude the interview

OPENING (if first message):
"Hello ${interviewContext.candidateName}! I'm your AI interviewer for the ${interviewContext.jobTitle} position at SynchroHR. Let's begin - Can you tell me about your experience with [relevant skill from their resume]?"

QUESTION FOCUS FOR ${interviewContext.jobTitle}:
- Adapt questions to match the specific requirements of a ${interviewContext.jobTitle}
- Reference their resume experiences that relate to ${interviewContext.jobTitle} work
- Probe for relevant skills needed for ${interviewContext.jobTitle}
- Keep it conversational and natural

Remember: Keep responses SHORT and ask ONE question at a time!`;

    // Format messages for the AI
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
    ];

    if (message) {
      messages.push({ role: "user", content: message });
    }

    console.log('Sending request to Lovable AI with', messages.length, 'messages');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.8,
        max_tokens: 200, // Keep responses concise
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Lovable AI error:", errorText);
      throw new Error("Failed to get response from AI");
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || "I'm sorry, could you repeat that?";

    console.log('AI response:', aiMessage);

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
