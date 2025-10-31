import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { candidateName = "Dhivya", jobTitle = "Software Developer" } = await req.json();
    const candidateEmail = "demo@synchrohr.com";

    // Create or get demo resume
    const { data: existingResume } = await supabase
      .from("resumes")
      .select("id")
      .eq("email", candidateEmail)
      .single();

    let resumeId = existingResume?.id;

    if (!resumeId) {
      const { data: newResume, error: resumeError } = await supabase
        .from("resumes")
        .insert({
          name: candidateName,
          email: candidateEmail,
          phone: "+1234567890",
          position_applied: jobTitle,
          pipeline_stage: "interview_scheduled",
          screening_status: "selected",
          ai_screening_complete: true,
        })
        .select()
        .single();

      if (resumeError) throw resumeError;
      resumeId = newResume.id;
    }

    // Generate unique token
    const token = `demo_${crypto.randomUUID()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Valid for 30 days for demo

    // Create interview token
    const { error: tokenError } = await supabase
      .from("interview_tokens")
      .insert({
        token,
        resume_id: resumeId,
        expires_at: expiresAt.toISOString(),
        interview_completed: false,
      });

    if (tokenError) throw tokenError;

    // Create interview record
    const scheduledAt = new Date();
    scheduledAt.setHours(scheduledAt.getHours() + 1);

    const { error: interviewError } = await supabase
      .from("interviews")
      .insert({
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        position: jobTitle,
        interview_type: "ai_voice",
        status: "scheduled",
        scheduled_at: scheduledAt.toISOString(),
        resume_id: resumeId,
        interview_link: `${supabaseUrl.replace('supabase.co', 'vercel.app')}/interview/token/${token}`,
      });

    if (interviewError) throw interviewError;

    const interviewLink = `https://synchro-hr-fwc.vercel.app/interview/token/${token}`;

    console.log("Demo interview link created:", interviewLink);

    return new Response(
      JSON.stringify({
        success: true,
        interviewLink,
        candidateName,
        jobTitle,
        expiresAt: expiresAt.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating demo interview link:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
