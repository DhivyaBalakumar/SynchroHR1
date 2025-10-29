import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InterviewScheduledRequest {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  interviewLink: string;
  scheduledFor: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      candidateName, 
      candidateEmail, 
      jobTitle, 
      interviewLink,
      scheduledFor
    }: InterviewScheduledRequest = await req.json();

    console.log("Sending interview scheduled email to:", candidateEmail);

    const firstName = candidateName.split(' ')[0];
    const scheduledDate = new Date(scheduledFor).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #2F80ED;">Interview Scheduled - ${jobTitle}</h2>
          <p style="font-size: 16px; color: #333333;">
            Dear ${firstName},
          </p>
          <p style="font-size: 16px; color: #333333;">
            Congratulations! You have been selected for the next stage of our recruitment process.
            Your <strong>AI Technical Interview</strong> has been scheduled for:
          </p>
          
          <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2F80ED;">
            <p style="font-size: 18px; font-weight: bold; color: #2F80ED; margin: 0;">
              📅 ${scheduledDate}
            </p>
          </div>

          <p style="font-size: 16px; color: #333333;">
            <strong>Position:</strong> ${jobTitle}
          </p>

          <p style="font-size: 16px; color: #333333;">
            The interview will be conducted by our AI interviewer, which will ask you questions based on:
          </p>
          <ul style="font-size: 16px; color: #333333;">
            <li>Your resume and experience</li>
            <li>The specific requirements for the ${jobTitle} role</li>
            <li>Technical skills and problem-solving abilities</li>
          </ul>

          <p style="font-size: 16px; color: #333333;">
            <strong>What to expect:</strong>
          </p>
          <ul style="font-size: 16px; color: #333333;">
            <li>Duration: Approximately 30-45 minutes</li>
            <li>Format: Video and audio recording with AI-driven questions</li>
            <li>Device: Use a computer with a working webcam and microphone</li>
            <li>Environment: Choose a quiet location with stable internet</li>
          </ul>

          <a href="${interviewLink}" style="display: inline-block; margin: 20px 0; padding: 15px 30px; background-color: #2F80ED; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Start Your Interview
          </a>

          <p style="font-size: 14px; color: #666666; margin-top: 20px;">
            <strong>Note:</strong> This interview link is unique to you and will expire 48 hours after the scheduled time.
            Please ensure you complete the interview within this timeframe.
          </p>

          <p style="font-size: 16px; color: #333333;">
            If you have any questions or need to reschedule, please contact us immediately.
          </p>

          <p style="font-size: 16px; color: #333333;">
            Best regards,<br>
            <strong>SynchroHR Recruitment Team</strong>
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
          
          <p style="font-size: 12px; color: #777777;">
            SynchroHR © 2025. All rights reserved.<br>
            If you did not expect this message, please contact us at <a href="mailto:support@synchrohr.com">support@synchrohr.com</a>
          </p>
        </div>
      </body>
      </html>
    `;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const mailFrom = "SynchroHR <onboarding@resend.dev>";
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("RESEND_API_KEY not configured");
    }
    
    console.log("Using Resend API with from:", mailFrom);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: mailFrom,
        to: [candidateEmail],
        subject: `Interview Scheduled - ${jobTitle} Position`,
        html: emailHtml,
      }),
    });

    const emailResponse = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", emailResponse);
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Interview scheduled email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-interview-scheduled function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
