import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { candidateName, candidateEmail, jobTitle }: ConfirmationEmailRequest = await req.json();

    console.log(`Sending application confirmation to ${candidateEmail}`);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .highlight { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .status-badge { display: inline-block; background: #4caf50; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Application Received!</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${candidateName}</strong>,</p>
              
              <p>Thank you for applying for the <strong>${jobTitle}</strong> position at SynchroHR!</p>
              
              <div class="highlight">
                <p><strong>⏳ What's Next?</strong></p>
                <ul>
                  <li>Your resume is being screened by our AI-powered ATS system</li>
                  <li>You will receive an email within the next few minutes with the result</li>
                  <li>If selected, you'll receive an interview link in the same email</li>
                </ul>
              </div>
              
              <p><span class="status-badge">✅ SUBMITTED</span></p>
              
              <p><strong>📧 Keep an eye on your inbox!</strong><br/>
              We'll notify you of the next steps shortly.</p>
              
              <p>Best regards,<br/>
              <strong>The SynchroHR Team</strong></p>
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
        from: "SynchroHR <onboarding@resend.dev>",
        to: [candidateEmail],
        subject: `Application Received - ${jobTitle}`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendData);
      throw new Error(resendData.message || "Failed to send email");
    }

    console.log("Confirmation email sent successfully:", resendData);

    return new Response(JSON.stringify({ success: true, emailResponse: resendData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
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
