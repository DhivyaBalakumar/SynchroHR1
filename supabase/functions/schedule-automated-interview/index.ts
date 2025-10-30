import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduleInterviewRequest {
  resumeId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  delayHours?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      resumeId, 
      candidateName, 
      candidateEmail, 
      jobTitle,
      delayHours = 1 
    }: ScheduleInterviewRequest = await req.json();

    console.log("Scheduling automated interview for resume:", resumeId);

    // Generate secure interview token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Token valid for 30 days

    // Create interview token
    const { data: tokenData, error: tokenError } = await supabase
      .from("interview_tokens")
      .insert({
        resume_id: resumeId,
        token: token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (tokenError) {
      console.error("Error creating interview token:", tokenError);
      throw new Error("Failed to create interview token");
    }

    console.log("Interview token created:", tokenData.id);

    // Generate interview link - use the app URL
    const appUrl = Deno.env.get("SUPABASE_URL")?.includes('localhost') 
      ? 'http://localhost:8080'
      : Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovableproject.com') || '';
    const interviewLink = `${appUrl}/interview/login?token=${token}`;

    // Calculate scheduled time (delay from now)
    const scheduledFor = new Date();
    scheduledFor.setHours(scheduledFor.getHours() + delayHours);

    // Create interview record
    const { data: interviewData, error: interviewError } = await supabase
      .from("interviews")
      .insert({
        resume_id: resumeId,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        status: "scheduled",
        scheduled_for: scheduledFor.toISOString(),
        interview_link: interviewLink,
        interview_type: "ai_screening",
      })
      .select()
      .single();

    if (interviewError) {
      console.error("Error creating interview:", interviewError);
      throw new Error("Failed to create interview record");
    }

    console.log("Interview record created:", interviewData.id);

    // Queue email to be sent after delay
    const emailScheduledFor = new Date();
    emailScheduledFor.setHours(emailScheduledFor.getHours() + delayHours);

    const { error: queueError } = await supabase
      .from("email_queue")
      .insert({
        resume_id: resumeId,
        email_type: "interview_scheduled",
        scheduled_for: emailScheduledFor.toISOString(),
        status: "pending",
        email_data: {
          candidateName,
          candidateEmail,
          jobTitle,
          interviewLink,
          scheduledFor: scheduledFor.toISOString(),
        },
      });

    if (queueError) {
      console.error("Error queuing email:", queueError);
      throw new Error("Failed to queue email");
    }

    // Update resume with scheduling info
    const { error: updateError } = await supabase
      .from("resumes")
      .update({
        interview_scheduled_at: new Date().toISOString(),
        pipeline_stage: "interview_scheduled",
      })
      .eq("id", resumeId);

    if (updateError) {
      console.error("Error updating resume:", updateError);
    }

    // Log pipeline transition
    const { error: auditError } = await supabase
      .from("pipeline_audit_logs")
      .insert({
        resume_id: resumeId,
        from_stage: "selected",
        to_stage: "interview_scheduled",
        automation_triggered: true,
        notes: `Automated interview scheduled with ${delayHours}h delay`,
      });

    if (auditError) {
      console.error("Error logging audit:", auditError);
    }

    console.log("Interview scheduling completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        interviewId: interviewData.id,
        tokenId: tokenData.id,
        interviewLink,
        scheduledFor: scheduledFor.toISOString(),
        emailScheduledFor: emailScheduledFor.toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in schedule-automated-interview function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
