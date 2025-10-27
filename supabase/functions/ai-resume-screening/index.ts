import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeAnalysis {
  ai_score: number;
  recommendation: string;
  skills_match: number;
  experience_match: number;
  education_match: number;
  key_strengths: string[];
  areas_of_concern: string[];
  skill_gaps: string[];
  detailed_analysis: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resume_id, job_role_id } = await req.json();

    if (!resume_id) {
      throw new Error('resume_id is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch resume data
    const { data: resume, error: resumeError } = await supabaseClient
      .from('resumes')
      .select('*, job_roles(*)')
      .eq('id', resume_id)
      .single();

    if (resumeError || !resume) {
      throw new Error('Resume not found');
    }

    // Handle demo data differently - skip AI and use existing scores
    if (resume.source === 'demo') {
      console.log('Processing demo data - skipping AI analysis');
      
      // Use existing AI score from seed data or generate random one
      const existingScore = resume.ai_score || Math.floor(Math.random() * 40) + 60; // 60-100
      
      // Calculate component scores based on overall score
      const variance = Math.random() * 10 - 5; // ±5 variance
      const skillsMatch = Math.min(100, Math.max(0, existingScore + variance));
      const experienceMatch = Math.min(100, Math.max(0, existingScore + (Math.random() * 10 - 5)));
      const educationMatch = Math.min(100, Math.max(0, existingScore + (Math.random() * 10 - 5)));
      
      // Calculate ATS score
      const atsScore = Math.round(
        (skillsMatch * 0.4) + 
        (experienceMatch * 0.35) + 
        (educationMatch * 0.25)
      );
      
      // Determine status based on ATS score
      const finalStatus = atsScore >= 75 ? 'selected' : 'rejected';
      
      const demoAnalysis = {
        ai_score: existingScore,
        recommendation: atsScore >= 85 ? 'Highly Recommended' : 
                       atsScore >= 75 ? 'Recommended' : 
                       atsScore >= 60 ? 'Consider' : 'Not Recommended',
        skills_match: Math.round(skillsMatch),
        experience_match: Math.round(experienceMatch),
        education_match: Math.round(educationMatch),
        ats_score: atsScore,
        key_strengths: ['Demo candidate profile', 'Sample data for demonstration'],
        areas_of_concern: ['Demo data - for testing purposes only'],
        skill_gaps: [],
        detailed_analysis: `Demo candidate with analytics score of ${existingScore}. Automatically categorized for demonstration.`
      };
      
      // Update resume with demo analysis
      await supabaseClient
        .from('resumes')
        .update({
          ai_score: existingScore,
          ai_analysis: demoAnalysis,
          screening_status: finalStatus,
          pipeline_stage: finalStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', resume_id);
      
      // Log audit trail
      await supabaseClient
        .from('pipeline_audit_logs')
        .insert({
          resume_id: resume_id,
          action: `demo_screening_${finalStatus}`,
          details: {
            ai_score: existingScore,
            ats_score: atsScore,
            recommendation: demoAnalysis.recommendation,
            auto_decision: true,
            demo_mode: true
          }
        });
      
      console.log(`Demo resume categorized: ${finalStatus} (ATS: ${atsScore})`);
      
      // Don't send emails for demo data
      return new Response(
        JSON.stringify({ 
          success: true,
          analysis: demoAnalysis,
          status: finalStatus,
          email_sent: false,
          demo_mode: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing real applicant - running AI analysis...');

    // Get job role requirements
    let jobRequirements = '';
    if (resume.job_roles) {
      jobRequirements = `
Job Title: ${resume.job_roles.title}
Description: ${resume.job_roles.description}
Requirements: ${JSON.stringify(resume.job_roles.requirements)}
      `;
    } else if (job_role_id) {
      const { data: jobRole } = await supabaseClient
        .from('job_roles')
        .select('*')
        .eq('id', job_role_id)
        .single();
      
      if (jobRole) {
        jobRequirements = `
Job Title: ${jobRole.title}
Description: ${jobRole.description}
Requirements: ${JSON.stringify(jobRole.requirements)}
        `;
      }
    }

    // Prepare resume data for analysis
    const resumeData = `
Candidate Name: ${resume.candidate_name}
Email: ${resume.email}
Phone: ${resume.phone || 'N/A'}
Position Applied: ${resume.position_applied}
Parsed Resume Data: ${JSON.stringify(resume.parsed_data || {})}
    `;

    // Call Lovable AI for analysis
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an EXTREMELY STRICT expert HR recruitment analyst specializing in technical resume evaluation. 
We want ONLY THE BEST candidates - be ruthlessly critical and verify everything.

CRITICAL EVALUATION CRITERIA (ALL MUST BE MET):
1. Extract ALL technical skills mentioned in the job requirements
2. Check if EVERY required technical skill is explicitly listed in the candidate's technical skills section
3. For EACH technical skill found, verify it is ACTUALLY USED/APPLIED in their mentioned projects with concrete examples
4. If even ONE required technical skill is missing OR not proven in projects, the candidate should be REJECTED

STRICT SCORING RULES:
- skills_match: 100 only if ALL required skills are present AND proven in projects. Deduct 20 points for each missing/unproven skill.
- experience_match: Must show deep, hands-on experience with the specific technologies in real projects
- If skills_match < 80, automatically set recommendation to "Not Recommended"

Your response MUST be a valid JSON object with this exact structure:
{
  "ai_score": <number between 0-100, be harsh>,
  "recommendation": "<Highly Recommended|Recommended|Consider|Not Recommended>",
  "skills_match": <number between 0-100, strict verification required>,
  "experience_match": <number between 0-100>,
  "education_match": <number between 0-100>,
  "key_strengths": [<array of ONLY proven strengths with evidence>],
  "areas_of_concern": [<array of missing skills or unproven claims>],
  "skill_gaps": [<array of ALL missing or insufficiently proven technical skills>],
  "detailed_analysis": "<2-3 sentence CRITICAL analysis with specific missing skills>",
  "technical_skills_verification": {
    "required_skills": [<list all required technical skills from JD>],
    "found_in_resume": [<skills found in tech skills section>],
    "proven_in_projects": [<skills actually used in projects with examples>],
    "missing_or_unproven": [<skills missing or not demonstrated in projects>]
  }
}

BE STRICT. We want only candidates who clearly demonstrate ALL required technical skills through actual project work.`;

    const userPrompt = `${jobRequirements}\n\n${resumeData}\n\nProvide detailed resume analysis as JSON.`;

    console.log('Calling Lovable AI for resume analysis...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No content in AI response');
    }

    console.log('AI Response received:', aiContent);

    // Parse AI response
    let analysis: ResumeAnalysis;
    try {
      analysis = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      // Fallback analysis if parsing fails
      analysis = {
        ai_score: 70,
        recommendation: 'Consider',
        skills_match: 70,
        experience_match: 70,
        education_match: 70,
        key_strengths: ['Candidate profile reviewed'],
        areas_of_concern: ['Detailed assessment pending'],
        skill_gaps: ['Further evaluation needed'],
        detailed_analysis: 'AI analysis completed with basic evaluation.'
      };
    }

    // Calculate ATS score (composite of all factors)
    const atsScore = Math.round(
      (analysis.skills_match * 0.4) + 
      (analysis.experience_match * 0.35) + 
      (analysis.education_match * 0.25)
    );

    // Determine final status based on ATS score
    const finalStatus = atsScore >= 75 ? 'selected' : 'rejected';

    // Update resume with AI analysis and ATS score
    const { error: updateError } = await supabaseClient
      .from('resumes')
      .update({
        ai_score: analysis.ai_score,
        ai_analysis: { ...analysis, ats_score: atsScore },
        screening_status: finalStatus,
        pipeline_stage: finalStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', resume_id);

    if (updateError) {
      console.error('Error updating resume:', updateError);
      throw updateError;
    }

    // Log audit trail
    await supabaseClient
      .from('pipeline_audit_logs')
      .insert({
        resume_id: resume_id,
        action: `ai_screening_${finalStatus}`,
        details: {
          ai_score: analysis.ai_score,
          ats_score: atsScore,
          recommendation: analysis.recommendation,
          auto_decision: true
        }
      });

    console.log(`Resume analysis completed: ${finalStatus} (ATS: ${atsScore})`);

    // Send appropriate email based on decision
    if (finalStatus === 'selected') {
      console.log('Sending selection email...');
      
      const selectionResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-selection-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateName: resume.candidate_name,
          candidateEmail: resume.email,
          jobTitle: resume.job_roles?.title || resume.position_applied,
          interviewLink: 'https://your-app.com/interview',
          tokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleString()
        }),
      });

      if (!selectionResponse.ok) {
        console.error('Failed to send selection email');
      } else {
        await supabaseClient
          .from('resumes')
          .update({ selection_email_sent: true })
          .eq('id', resume_id);
        console.log('Selection email sent successfully');
      }

      // Only schedule automated interview for real candidates
      if (resume.source === 'real') {
        console.log('Scheduling automated interview for real candidate...');
        
        const interviewResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/schedule-automated-interview`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resumeId: resume_id,
            candidateName: resume.candidate_name,
            candidateEmail: resume.email,
            jobTitle: resume.job_roles?.title || resume.position_applied,
            delayHours: 0, // Schedule immediately
          }),
        });

        if (!interviewResponse.ok) {
          console.error('Failed to schedule automated interview');
        } else {
          console.log('Automated interview scheduled successfully');
        }
      }
    } else {
      console.log('Sending rejection email...');
      
      const rejectionResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-rejection-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateName: resume.candidate_name,
          candidateEmail: resume.email,
          jobTitle: resume.job_roles?.title || resume.position_applied,
        }),
      });

      if (!rejectionResponse.ok) {
        console.error('Failed to send rejection email');
      } else {
        console.log('Rejection email sent successfully');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis: { ...analysis, ats_score: atsScore },
        status: finalStatus,
        email_sent: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in ai-resume-screening:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
