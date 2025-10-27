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

      // Create interview token for immediate interview
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await supabase
        .from('interview_tokens')
        .insert({
          resume_id: resumeData.id,
          token: token,
          expires_at: expiresAt.toISOString(),
        });

      // Generate interview link
      const interviewLink = `${window.location.origin}/interview/login?token=${token}`;
      const tokenExpiry = expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      // Queue selection email for reliable delivery
      console.log('Queueing selection email for:', formData.email);
      const { error: queueError } = await supabase
        .from('email_queue')
        .insert({
          email_type: 'selection',
          resume_id: resumeData.id,
          email_data: {
            candidateName: formData.fullName,
            candidateEmail: formData.email,
            jobTitle: job.title,
            interviewLink: interviewLink,
            tokenExpiry: tokenExpiry,
          },
          scheduled_for: new Date().toISOString(),
          status: 'pending',
        });

      if (queueError) {
        console.error('Error queueing email:', queueError);
        toast({
          title: 'Email queueing failed',
          description: 'Application submitted but email could not be queued. Please check your inbox or contact HR.',
          variant: 'destructive',
        });
      } else {
        console.log('Email queued successfully for:', formData.email);
        
        // Immediately trigger email processing
        try {
          await supabase.functions.invoke('process-email-queue');
          console.log('Email processing triggered for:', formData.email);
        } catch (error) {
          console.error('Error triggering email processing:', error);
        }
      }

      setSubmitted(true);
      toast({
        title: 'Application submitted!',
        description: 'Check your email for the AI interview link!',
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-12 text-center max-w-md">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for applying to {job.title}. 
              <br /><br />
              <strong>📧 Check your email</strong> - We've sent you a link to start your AI interview immediately!
            </p>
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