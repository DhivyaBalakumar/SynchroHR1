import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SelectionEmailRequest {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  interviewLink: string;
  tokenExpiry: string;
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
      tokenExpiry
    }: SelectionEmailRequest = await req.json();

    console.log("Sending selection email to:", candidateEmail);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const mailFrom = Deno.env.get("MAIL_FROM") || "SynchroHR <onboarding@resend.dev>";
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("RESEND_API_KEY not configured");
    }

    console.log("Using mail from:", mailFrom);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Selection Notification</title>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; }
    .header { background-color: #4CAF50; color: white; padding: 10px; text-align: center; }
    .content { padding: 20px; }
    .interview-button { 
      display: inline-block; 
      background-color: #2196F3; 
      color: white; 
      padding: 15px 30px; 
      text-decoration: none; 
      border-radius: 5px; 
      font-weight: bold;
      margin: 20px 0;
    }
    .footer { font-size: 12px; color: #777; padding: 10px; text-align: center; }
    .highlight { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🎉 Congratulations! You are Selected</h2>
    </div>
    <div class="content">
      <p>Dear ${candidateName},</p>
      <p>We are excited to inform you that you have been selected for the <strong>${jobTitle}</strong> position at SynchroHR!</p>
      
      <div class="highlight">
        <strong>Next Step: AI-Powered Interview</strong>
        <p>Please complete your AI interview by clicking the button below. This link expires on ${tokenExpiry}.</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${interviewLink}" class="interview-button">Start AI Interview</a>
      </div>
      
      <p style="margin-top: 20px;">The AI interview will assess your skills and qualifications. Please ensure you have:</p>
      <ul>
        <li>A stable internet connection</li>
        <li>A quiet environment</li>
        <li>About 30 minutes to complete the interview</li>
      </ul>
      
      <p>Thank you for your time and interest. We look forward to working with you!</p>
    </div>
    <div class="footer">
      <p>Best regards,<br>SynchroHR Team<br>SynchroHR<br><a href="mailto:synchro-hr@synchrohr.com">synchro-hr@synchrohr.com</a></p>
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
        subject: `🎉 You've Been Selected for ${jobTitle} - Interview Invitation`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error response:", resendData);
      console.error("Resend API status:", resendResponse.status);
      
      // Special handling for domain verification error
      if (resendData.message?.includes("verify a domain")) {
        console.error("DOMAIN VERIFICATION REQUIRED: Please verify your domain at resend.com/domains");
        throw new Error("Domain verification required. Please verify your domain at resend.com/domains and update the MAIL_FROM environment variable.");
      }
      
      throw new Error(resendData.message || `Failed to send email: ${resendResponse.status}`);
    }

    console.log("Selection email sent successfully to:", candidateEmail, "Response:", resendData);

    return new Response(JSON.stringify(resendData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-selection-email function:", error);
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
