import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NextStepsEmailRequest {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      candidateName, 
      candidateEmail, 
      jobTitle
    }: NextStepsEmailRequest = await req.json();

    console.log("📧 Sending next steps email to:", candidateEmail);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const mailFrom = "SynchroHR <onboarding@resend.dev>";
    
    if (!resendApiKey) {
      console.error("❌ RESEND_API_KEY not configured");
      throw new Error("RESEND_API_KEY not configured");
    }

    console.log("📤 Using Resend API with from:", mailFrom);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Next Steps - SynchroHR</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .timeline { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .timeline-item { margin: 15px 0; padding-left: 25px; border-left: 3px solid #667eea; }
    .footer { font-size: 12px; color: #777; padding: 10px; text-align: center; margin-top: 20px; }
    h3 { color: #667eea; margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>📋 Next Steps in Your Application</h2>
    </div>
    <div class="content">
      <p>Dear <strong>${candidateName}</strong>,</p>
      
      <p>Thank you for completing your AI interview for the <strong>${jobTitle}</strong> position at SynchroHR!</p>
      
      <div class="info-box">
        <h3>🎯 What Happens Next?</h3>
        <p>Our hiring team is currently reviewing your interview responses and will be in touch soon with the next steps.</p>
      </div>
      
      <div class="timeline">
        <h3>📅 Typical Timeline:</h3>
        <div class="timeline-item">
          <strong>Days 1-3:</strong> Interview analysis and evaluation
        </div>
        <div class="timeline-item">
          <strong>Days 4-5:</strong> Team review and discussion
        </div>
        <div class="timeline-item">
          <strong>Days 6-7:</strong> Final decision and notification
        </div>
      </div>
      
      <p><strong>What you can do while waiting:</strong></p>
      <ul>
        <li>Keep an eye on your email for updates</li>
        <li>Connect with us on LinkedIn</li>
        <li>Explore more about our company culture</li>
        <li>Prepare questions for the potential next round</li>
      </ul>
      
      <div class="info-box">
        <p><strong>💡 Pro Tip:</strong> Ensure our emails don't land in your spam folder by adding onboarding@resend.dev to your contacts.</p>
      </div>
      
      <p>We appreciate your patience during this process. If you have any questions, feel free to reach out!</p>
      
      <p>Best regards,<br/><strong>The SynchroHR Recruitment Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 SynchroHR. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: mailFrom,
        to: [candidateEmail],
        subject: `Next Steps: ${jobTitle} Position at SynchroHR`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("❌ Resend API error response:", resendData);
      console.error("📧 Status:", resendResponse.status);
      console.error("📧 Recipient:", candidateEmail);
      console.error("📧 From:", mailFrom);
      throw new Error(resendData.message || `Failed to send email: ${resendResponse.status}`);
    }

    console.log("✅ Next steps email sent successfully to:", candidateEmail, "Response:", resendData);

    return new Response(JSON.stringify(resendData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in send-next-steps function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
