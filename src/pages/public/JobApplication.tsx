import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const JobApplication = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [interviewLink, setInterviewLink] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    coverLetter: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    const { data, error } = await supabase
      .from('job_roles')
      .select('*')
      .eq('id', jobId)
      .eq('status', 'active')
      .single();

    if (data && !error) {
      setJob(data);
    } else {
      toast({
        title: 'Job not found',
        description: 'This job posting may no longer be available',
        variant: 'destructive',
      });
      navigate('/jobs');
    }
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Resume must be under 5MB',
          variant: 'destructive',
        });
        return;
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF or DOC file',
          variant: 'destructive',
        });
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resumeFile) {
      toast({
        title: 'Resume required',
        description: 'Please upload your resume',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Upload resume to storage
      const fileExt = resumeFile.name.split('.').pop();
      const fileName = `${Date.now()}_${formData.fullName.replace(/\s/g, '_')}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, resumeFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      // Create resume record
      const { data: resumeData, error: resumeError } = await supabase
        .from('resumes')
        .insert({
          candidate_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          position_applied: job.title,
          job_role_id: job.id,
          file_url: publicUrl,
          screening_status: 'pending',
          source: 'real',
          parsed_data: {
            cover_letter: formData.coverLetter
          }
        })
        .select()
        .single();

      if (resumeError) throw resumeError;

      // Create candidate record
      await supabase
        .from('candidates')
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        });

      // Send immediate confirmation email
      console.log('Sending confirmation email to:', formData.email);
      try {
        await supabase.functions.invoke('send-application-confirmation', {
          body: {
            candidateName: formData.fullName,
            candidateEmail: formData.email,
            jobTitle: job.title,
          }
        });
        console.log('Confirmation email sent');
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }

      // Trigger ATS screening immediately
      console.log('🤖 Triggering ATS screening for:', formData.email);
      console.log('📧 Candidate email:', formData.email);
      console.log('🎯 Resume ID:', resumeData.id);
      const isDemoEmail = formData.email === 'eng22ct0004@dsu.edu.in';
      console.log('⭐ Is demo exception email?', isDemoEmail);
      
      try {
        const screeningResult = await supabase.functions.invoke('ai-resume-screening', {
          body: {
            resume_id: resumeData.id,
            job_role_id: job.id,
            is_demo_exception: isDemoEmail
          }
        });

        console.log('📊 ATS screening result:', screeningResult);
        
        if (screeningResult.error) {
          console.error('❌ ATS screening error:', screeningResult.error);
          throw screeningResult.error;
        }
        
        if (screeningResult.data?.success) {
          const finalStatus = screeningResult.data.status;
          const atsScore = screeningResult.data.analysis?.ats_score;
          console.log(`✅ Candidate ${finalStatus} (ATS Score: ${atsScore})`);
          console.log('📧 Email workflow:', screeningResult.data.email_sent ? 'Triggered' : 'Not triggered');
          
          if (isDemoEmail) {
            console.log('⭐ Demo email - auto-selected regardless of ATS score');
            console.log('🎯 Generating interview link...');
            
            // Generate unique interview token for demo
            const token = `demo_${crypto.randomUUID()}`;
            const interviewUrl = `${window.location.origin}/interview/token/${token}`;
            
            // Store token in database
            await supabase
              .from('interview_tokens')
              .insert({
                token,
                resume_id: resumeData.id,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                interview_completed: false,
              });
            
            setInterviewLink(interviewUrl);
            console.log('✅ Interview link generated:', interviewUrl);
          }
        } else {
          console.error('⚠️ Screening completed but no success flag:', screeningResult.data);
        }
      } catch (screeningError) {
        console.error('❌ Error in ATS screening:', screeningError);
        toast({
          title: 'Screening pending',
          description: 'Your application is being processed. You will receive an email shortly.',
        });
      }

      setSubmitted(true);
      toast({
        title: 'Application submitted!',
        description: 'Check your email for confirmation and screening results.',
      });
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Submission failed',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading application form...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-12 text-center max-w-2xl">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for applying to {job.title}. 
              <br /><br />
              <strong>📧 Check your email</strong> - We've sent you a confirmation and your application is being screened by our AI-powered ATS.
              <br /><br />
              You'll receive the screening results and next steps within minutes!
            </p>

            {interviewLink && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-700 font-bold text-lg">
                  <CheckCircle2 className="h-6 w-6" />
                  <span>🎉 You've been selected for an AI Interview!</span>
                </div>
                <p className="text-sm text-green-800 mb-4">
                  Congratulations! Your unique interview link is ready. You can start the interview now or use the link sent to your email.
                </p>
                <div className="bg-white border border-green-300 rounded-lg p-4">
                  <p className="text-xs font-semibold text-green-900 mb-2">Your Interview Link:</p>
                  <a 
                    href={interviewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm break-all font-mono block mb-3"
                  >
                    {interviewLink}
                  </a>
                  <Button
                    onClick={() => window.open(interviewLink, '_blank')}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    🚀 Start AI Interview Now
                  </Button>
                </div>
                <p className="text-xs text-green-700">
                  ⏰ This link is valid for 30 days. The interview will take approximately 20-30 minutes.
                </p>
              </div>
            )}

            <Button onClick={() => navigate('/jobs')}>
              View More Jobs
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/jobs')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
          <h1 className="text-3xl font-bold mb-2">Apply for {job?.title}</h1>
          <p className="text-muted-foreground">{job?.department}</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-3xl">
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="resume">Resume * (PDF or DOC, max 5MB)</Label>
              <div className="mt-2">
                <input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
                <label
                  htmlFor="resume"
                  className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="h-6 w-6" />
                  <span>
                    {resumeFile ? resumeFile.name : 'Click to upload resume'}
                  </span>
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
              <Textarea
                id="coverLetter"
                value={formData.coverLetter}
                onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                rows={6}
                placeholder="Tell us why you're interested in this position..."
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default JobApplication;