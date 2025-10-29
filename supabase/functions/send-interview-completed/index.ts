import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InterviewCompletedRequest {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyCareersPage?: string;
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
      companyCareersPage = "https://synchrohr.com/careers"
    }: InterviewCompletedRequest = await req.json();

    console.log("Sending interview completed email to:", candidateEmail);

    const firstName = candidateName.split(' ')[0];

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #2F80ED;">Interview Completed Successfully!</h2>
          <p style="font-size: 16px; color: #333333;">
            Dear ${firstName},
          </p>
          <p style="font-size: 16px; color: #333333;">
            Thank you for completing the <strong>AI Technical Interview</strong> for the <strong>${jobTitle}</strong> position at SynchroHR.
          </p>

          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <p style="font-size: 16px; font-weight: bold; color: #16a34a; margin: 0;">
              ✅ Your interview has been successfully recorded and submitted for review.
            </p>
          </div>

          <p style="font-size: 16px; color: #333333;">
            Our hiring team will carefully review your responses and performance. Here's what happens next:
          </p>

          <ul style="font-size: 16px; color: #333333;">
            <li><strong>Review Process:</strong> Our HR team and hiring managers will evaluate your interview within 3-5 business days</li>
            <li><strong>Next Steps:</strong> If you advance to the HR round, we will contact you via email with scheduling details</li>
            <li><strong>Timeline:</strong> You can expect to hear from us within one week</li>
          </ul>

          <p style="font-size: 16px; color: #333333;">
            <strong>Please keep an eye on your mailbox for updates.</strong> In the meantime, if you have any questions, feel free to reach out to us.
          </p>

          <a href="${companyCareersPage}" style="display: inline-block; margin: 20px 0; padding: 12px 25px; background-color: #2F80ED; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Explore More Opportunities
          </a>

          <p style="font-size: 16px; color: #333333;">
            We appreciate your interest in joining our team and wish you the best of luck!
          </p>

          <p style="font-size: 16px; color: #333333;">
            Best regards,<br>
            <strong>SynchroHR Recruitment Team</strong>
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
          
          <p style="font-size: 12px; color: #777777;">
            SynchroHR © 2025. All rights reserved.<br>
            If you did not expect this message, please contact support at <a href="mailto:support@synchrohr.com">support@synchrohr.com</a>
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
        subject: `Interview Completed - ${jobTitle} Position`,
        html: emailHtml,
      }),
    });

    const emailResponse = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", emailResponse);
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Interview completed email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-interview-completed function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
