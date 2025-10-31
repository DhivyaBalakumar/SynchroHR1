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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const candidateName = "Dhivya";
    const jobTitle = "Software Developer";
    const candidateEmail = "eng22ct0004@dsu.edu.in";

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
        })
        .select()
        .single();

      if (resumeError) throw resumeError;
      resumeId = newResume.id;
    }

    // Generate unique token
    const token = `demo_${crypto.randomUUID()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Valid for 30 days

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

    const interviewLink = `https://synchro-hr-fwc.vercel.app/interview/token/${token}`;

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
        interview_link: interviewLink,
      });

    if (interviewError) throw interviewError;

    // Send email with interview link
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SynchroHR <onboarding@resend.dev>",
        to: [candidateEmail],
        subject: "🎉 Your AI Interview Link - Demo for Dhivya",
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎤 Your AI Interview is Ready!</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">
                Hello <strong>${candidateName}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #4b5563; margin-bottom: 25px;">
                Welcome to your AI-powered interview for the <strong>${jobTitle}</strong> position at SynchroHR! 
                This is a demonstration link to showcase our cutting-edge AI interview platform.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #667eea;">
                <h3 style="margin-top: 0; color: #1f2937;">📋 Interview Details:</h3>
                <ul style="color: #4b5563; padding-left: 20px;">
                  <li><strong>Position:</strong> ${jobTitle}</li>
                  <li><strong>Interview Type:</strong> AI Voice Interview</li>
                  <li><strong>Duration:</strong> 20-30 minutes</li>
                  <li><strong>AI Interviewer:</strong> Sarah (Professional voice)</li>
                  <li><strong>Link Valid Until:</strong> ${expiresAt.toLocaleDateString()}</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${interviewLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  🚀 Start Your AI Interview
                </a>
              </div>
              
              <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                <h4 style="margin-top: 0; color: #9a3412;">💡 Before You Start:</h4>
                <ul style="color: #9a3412; padding-left: 20px; margin-bottom: 0;">
                  <li>Find a quiet, well-lit space</li>
                  <li>Ensure stable internet connection</li>
                  <li>Allow camera and microphone access</li>
                  <li>Have your resume handy for reference</li>
                  <li>Speak naturally - the AI will wait for you to finish</li>
                </ul>
              </div>
              
              <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <p style="margin: 0; color: #0c4a6e;">
                  <strong>🔗 Your Interview Link:</strong><br>
                  <a href="${interviewLink}" style="color: #0284c7; word-break: break-all;">${interviewLink}</a>
                </p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
                This AI interview will assess your technical skills, communication abilities, and cultural fit. 
                The AI interviewer will ask relevant questions based on the ${jobTitle} role.
              </p>
              
              <p style="color: #6b7280; font-size: 14px;">
                Good luck! We're excited to see how you perform. 🌟
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>© 2025 SynchroHR - AI-Powered Recruitment Platform</p>
              <p>This is a demonstration email for the AI interview system.</p>
            </div>
          </body>
        </html>
      `,
      }),
    });

    const emailResponse = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", emailResponse);
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Demo interview email sent successfully to:", candidateEmail);
    console.log("Interview link:", interviewLink);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Demo interview link sent successfully!",
        email: candidateEmail,
        candidateName,
        jobTitle,
        interviewLink,
        expiresAt: expiresAt.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending demo interview link:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
