import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RejectionEmailRequest {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  atsScore?: number;
  feedback?: string;
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
      atsScore = 0,
      feedback = 'After careful consideration'
    }: RejectionEmailRequest = await req.json();

    console.log("Sending rejection email to:", candidateEmail);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const mailFrom = "SynchroHR <onboarding@resend.dev>";
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("RESEND_API_KEY not configured");
    }
    
    console.log("Using Resend API with from:", mailFrom);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Application Status Update</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #d9534f 0%, #c9302c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .score-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .feedback-box { background: #e3f2fd; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .footer { font-size: 12px; color: #777; padding: 10px; text-align: center; margin-top: 20px; }
    .score-label { font-weight: bold; color: #856404; }
    h3 { color: #667eea; margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Application Status Update</h2>
    </div>
    <div class="content">
      <p>Dear <strong>${candidateName}</strong>,</p>
      <p>Thank you for taking the time to apply for the <strong>${jobTitle}</strong> position at SynchroHR.</p>
      
      ${atsScore > 0 ? `
      <div class="score-box">
        <p class="score-label">🎯 Your ATS Score: ${atsScore}%</p>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Minimum required score: 75%</p>
      </div>
      ` : ''}
      
      <p>After careful review of your application through our AI-powered screening system, we regret to inform you that we will not be moving forward with your application at this time.</p>
      
      ${feedback && feedback !== 'After careful consideration' ? `
      <div class="feedback-box">
        <h3>💡 Feedback for Future Applications:</h3>
        <p>${feedback}</p>
      </div>
      ` : ''}
      
      <p><strong>We encourage you to:</strong></p>
      <ul>
        <li>Review the job requirements carefully and ensure your resume highlights relevant skills</li>
        <li>Include specific examples and projects demonstrating your technical abilities</li>
        <li>Apply again when you have gained additional experience in the required areas</li>
      </ul>
      
      <p>We appreciate your interest in SynchroHR and wish you all the best in your career journey.</p>
      
      <p>Best regards,<br/><strong>The SynchroHR Team</strong></p>
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
        subject: `Application Update: ${jobTitle} Position`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error response:", resendData);
      console.error("Resend API status:", resendResponse.status);
      console.error("Candidate email:", candidateEmail);
      console.error("From email:", mailFrom);
      throw new Error(resendData.message || `Failed to send email: ${resendResponse.status}`);
    }

    console.log("✅ Rejection email sent successfully to:", candidateEmail, "Response:", resendData);

    return new Response(JSON.stringify(resendData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-rejection-email function:", error);
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
