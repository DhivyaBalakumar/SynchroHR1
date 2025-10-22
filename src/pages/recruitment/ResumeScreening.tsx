import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  FileText,
  Star,
  TrendingUp,
  Filter,
  Video,
  Brain,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDemoModeFilter } from '@/hooks/useDemoModeFilter';
import { DemoModeToggle } from '@/components/DemoModeToggle';

export const ResumeScreening = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedJobRole, setSelectedJobRole] = useState<string>('all');
  const [jobRoles, setJobRoles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const { toast } = useToast();
  const { applyFilter, isDemoMode } = useDemoModeFilter();

  useEffect(() => {
    loadData();
  }, [selectedJobRole, activeTab]);

  const loadData = async () => {
    setLoading(true);
    
    // Load job roles
    const { data: rolesData } = await supabase
      .from('job_roles')
      .select('*')
      .eq('status', 'active');
    
    if (rolesData) setJobRoles(rolesData);

    // Load resumes based on filters with interview tokens
    let query = supabase
      .from('resumes')
      .select('*, job_roles(title, department), interview_tokens(token, expires_at, interview_completed)')
      .order('created_at', { ascending: false });

    if (selectedJobRole !== 'all') {
      query = query.eq('job_role_id', selectedJobRole);
    }

    if (activeTab === 'pending') {
      query = query.eq('screening_status', 'pending');
    } else if (activeTab === 'selected') {
      query = query.eq('screening_status', 'selected');
    } else if (activeTab === 'rejected') {
      query = query.eq('screening_status', 'rejected');
    }

    // Filter out demo data in production mode
    if (!isDemoMode) {
      query = query.neq('source', 'demo');
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load resumes',
        variant: 'destructive',
      });
    } else {
      // Additional client-side filtering for safety
      setResumes(applyFilter(data || []));
    }

    setLoading(false);
  };

  const runAIScreening = async (resumeId: string) => {
    setProcessing(resumeId);

    try {
      const resume = resumes.find(r => r.id === resumeId);

      const { data, error } = await supabase.functions.invoke('ai-resume-screening', {
        body: {
          resume_id: resumeId,
          job_role_id: resume?.job_role_id,
        },
      });

      if (error) throw error;

      const emailStatus = data.demo_mode ? 'Demo data processed' : 'Email sent automatically';
      toast({
        title: data.status === 'selected' ? 'Candidate Selected!' : 'Candidate Rejected',
        description: `AI Score: ${data.analysis.ai_score} | ATS: ${data.analysis.ats_score} | ${emailStatus}`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Screening Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const runBulkAIScreening = async () => {
    const pendingResumes = resumes.filter(r => 
      r.screening_status === 'pending'
    );

    if (pendingResumes.length === 0) {
      toast({
        title: 'No Pending Resumes',
        description: 'There are no pending resumes to screen.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing('bulk');
    let processed = 0;
    let selected = 0;
    let rejected = 0;
    let failed = 0;

    const realCount = pendingResumes.filter(r => r.source === 'real').length;
    const demoCount = pendingResumes.filter(r => r.source === 'demo').length;
    
    toast({
      title: 'AI Bulk Screening Started',
      description: `Processing ${pendingResumes.length} applicants (${realCount} real, ${demoCount} demo) with ATS scoring...`,
    });

    for (const resume of pendingResumes) {
      try {
        const { data, error } = await supabase.functions.invoke('ai-resume-screening', {
          body: {
            resume_id: resume.id,
            job_role_id: resume.job_role_id,
          },
        });

        if (error) throw error;

        processed++;
        if (data.status === 'selected') {
          selected++;
        } else {
          rejected++;
        }

        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`Failed to screen resume ${resume.id}:`, error);
        failed++;
      }
    }

    setProcessing(null);
    loadData();

    toast({
      title: '✅ Bulk Screening Complete!',
      description: `✓ Processed: ${processed} | ✓ Selected: ${selected} (ATS ≥75) | ✗ Rejected: ${rejected} | ⚠ Failed: ${failed}`,
      duration: 5000,
    });
  };

  const handleManualDecision = async (resumeId: string, decision: 'selected' | 'rejected') => {
    const resume = resumes.find(r => r.id === resumeId);
    if (!resume) return;

    try {
      // Update resume status
      const { error: updateError } = await supabase
        .from('resumes')
        .update({
          screening_status: decision,
          manual_override: true,
          pipeline_stage: decision === 'selected' ? 'selected' : 'rejected',
        })
        .eq('id', resumeId);

      if (updateError) throw updateError;

      // Log pipeline transition
      await supabase.from('pipeline_audit_logs').insert({
        action: `Manual ${decision} by HR`,
        details: { from_stage: 'screening', to_stage: decision === 'selected' ? 'selected' : 'rejected' }
      });

      // If selected, send selection email for real applicants only
      if (decision === 'selected') {
        // Only send emails for real applicants
        if (resume.source === 'real') {
          // Send selection email immediately
          const { error: selectionEmailError } = await supabase.functions.invoke(
            'send-selection-email',
            {
              body: {
                candidateName: resume.candidate_name,
                candidateEmail: resume.email,
                jobTitle: resume.job_roles?.title || resume.position_applied,
              },
            }
          );

          if (selectionEmailError) throw selectionEmailError;

          // Then trigger automated interview scheduling with 1 hour delay
          const { error: scheduleError } = await supabase.functions.invoke(
            'schedule-automated-interview',
            {
              body: {
                resumeId,
                candidateName: resume.candidate_name,
                candidateEmail: resume.email,
                jobTitle: resume.job_roles?.title || resume.position_applied,
                delayHours: 1, // 1 hour delay before sending interview invitation
              },
            }
          );

          if (scheduleError) throw scheduleError;
        }

        // Mark selection email as sent
        await supabase
          .from('resumes')
          .update({ selection_email_sent: true })
          .eq('id', resumeId);

        toast({
          title: 'Candidate Selected',
          description: resume.source === 'real' 
            ? 'Selection confirmation email sent. AI interview invitation will be sent in 1 hour.'
            : 'Demo candidate selected (no emails sent)',
        });
      } else {
        // Send rejection email for real applicants only
        if (resume.source === 'real') {
          await supabase.functions.invoke('send-rejection-email', {
            body: {
              candidateName: resume.candidate_name,
              candidateEmail: resume.email,
              jobTitle: resume.job_roles?.title || resume.position_applied,
            },
          });
        }

        // Mark as sent
        await supabase
          .from('resumes')
          .update({ selection_email_sent: true })
          .eq('id', resumeId);

        toast({
          title: 'Candidate Rejected',
          description: resume.source === 'real' ? 'Rejection email sent' : 'Demo candidate rejected (no email sent)',
        });
      }

      loadData();
    } catch (error: any) {
      console.error('Decision error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process decision',
        variant: 'destructive',
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendationBadge = (recommendation: string) => {
    const colors: any = {
      strongly_recommended: 'bg-green-500',
      recommended: 'bg-blue-500',
      maybe: 'bg-yellow-500',
      not_recommended: 'bg-red-500',
    };
    return colors[recommendation] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">AI-Powered Resume Screening</h1>
            <p className="text-muted-foreground">
              AI assists - You decide
            </p>
          </div>
          <div className="flex gap-3">
            <DemoModeToggle />
            <Button 
              onClick={runBulkAIScreening}
              disabled={processing !== null}
              size="lg"
              className="gap-2"
            >
              {processing === 'bulk' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Run AI Screening
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Production Mode Banner */}
        {!isDemoMode && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                Production mode is active.
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Only real data from your database will be displayed. All demo/sample data is hidden. 
                To add real data, use the application features to create employees, job roles, resumes, etc.
              </p>
            </div>
          </div>
        )}
      </div>

        <div className="mb-6 flex gap-4 items-center">
          <div className="flex-1">
            <Select value={selectedJobRole} onValueChange={setSelectedJobRole}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by job role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {jobRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.title} - {role.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
            <TabsTrigger value="selected">Selected</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : resumes.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">No resumes found</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {resumes.map((resume) => (
              <Card key={resume.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{resume.candidate_name}</h3>
                      {resume.source === 'real' && (
                        <Badge variant="default" className="bg-blue-600">
                          Real Applicant
                        </Badge>
                      )}
                      {resume.ai_score && (
                        <Badge className={getScoreColor(resume.ai_score)}>
                          <Star className="h-4 w-4 mr-1" />
                          AI Score: {resume.ai_score}/100
                        </Badge>
                      )}
                      {resume.ai_analysis?.ats_score && (
                        <Badge variant="secondary" className="bg-purple-600 text-white">
                          ATS: {resume.ai_analysis.ats_score}/100
                        </Badge>
                      )}
                      {resume.screening_status === 'selected' && (
                        <Badge variant="default" className="bg-green-600">
                          Auto-Selected
                        </Badge>
                      )}
                      {resume.screening_status === 'rejected' && (
                        <Badge variant="destructive">
                          Auto-Rejected
                        </Badge>
                      )}
                      {resume.interview_tokens?.length > 0 && (
                        <Badge variant="secondary">
                          {resume.interview_tokens[0].interview_completed ? 
                            'Interview Completed' : 
                            'Interview Invited'
                          }
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-4">
                      <p>{resume.email}</p>
                      <p>Applied for: {resume.job_roles?.title} - {resume.job_roles?.department}</p>
                    </div>

                    {resume.ai_analysis && (
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            Recommendation:
                          </span>
                          <Badge className={getRecommendationBadge(resume.ai_analysis.recommendation)}>
                            {resume.ai_analysis.recommendation?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {resume.ai_analysis.summary}
                        </p>
                        {resume.ai_analysis.key_strengths && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {resume.ai_analysis.key_strengths.map((strength: string, idx: number) => (
                              <Badge key={idx} variant="secondary">
                                {strength}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {resume.screening_status === 'pending' && (
                      <Button
                        onClick={() => runAIScreening(resume.id)}
                        disabled={processing === resume.id}
                        size="sm"
                      >
                        {processing === resume.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            AI Screening...
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-2" />
                            Run AI Screening
                          </>
                        )}
                      </Button>
                    )}

                    {resume.interview_tokens?.length > 0 && resume.interview_tokens[0].interview_completed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/recruitment/interviews')}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        View Interview
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(resume.file_url, '_blank')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Resume
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeScreening;
