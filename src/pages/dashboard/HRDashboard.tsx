import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  UserPlus, 
  DollarSign, 
  Shield, 
  LogOut, 
  TrendingUp,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Calendar,
  Database,
  Video,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DemoModeToggle } from '@/components/DemoModeToggle';
import { useDemoModeFilter } from '@/hooks/useDemoModeFilter';
import { FloatingChatbot } from '@/components/FloatingChatbot';
import { AIInterviewWidget } from '@/components/hr/AIInterviewWidget';
import { InterviewReportsSection } from '@/components/hr/InterviewReportsSection';
import { JobDescriptionUpload } from '@/components/hr/JobDescriptionUpload';

const HRDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { applyFilter } = useDemoModeFilter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    openPositions: 0,
    pendingResumes: 0,
    complianceScore: 98,
    completedInterviews: 0,
    pendingInvitations: 0,
    activeCandidates: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [jobRoles, setJobRoles] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading HR dashboard data...');
      
      // Load employees
      const { data: allEmployees, error: employeesError } = await supabase
        .from('employees')
        .select('*');
      
      if (employeesError) {
        console.error('Error loading employees:', employeesError);
        throw new Error(`Failed to load employees: ${employeesError.message}`);
      }
      const employeeCount = allEmployees?.length || 0;

      // Load job roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('job_roles')
        .select('*')
        .eq('status', 'active');
      
      if (rolesError) {
        console.error('Error loading job roles:', rolesError);
        throw new Error(`Failed to load job roles: ${rolesError.message}`);
      }
      const rolesCount = rolesData?.length || 0;

      // Load resumes with filter
      const { data: allResumes, error: resumesError } = await supabase
        .from('resumes')
        .select('*');
      
      if (resumesError) {
        console.error('Error loading resumes:', resumesError);
        throw new Error(`Failed to load resumes: ${resumesError.message}`);
      }
      
      const filteredResumes = applyFilter(allResumes || []);
      
      const pendingResumes = filteredResumes.filter(r => r.screening_status === 'pending');
      const selectedResumes = filteredResumes.filter(r => r.screening_status === 'selected');
      const pendingInvitations = filteredResumes.filter(r => 
        r.screening_status === 'selected' && r.selection_email_sent === true
      );

      // Load interviews (no source field, so no filter needed)
      const { count: interviewCount, error: interviewsError } = await supabase
        .from('interviews')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      if (interviewsError) {
        console.error('Error loading interviews:', interviewsError);
        throw new Error(`Failed to load interviews: ${interviewsError.message}`);
      }

      // Load recent resumes for activity feed
      const { data: recentResumesData, error: recentError } = await supabase
        .from('resumes')
        .select('*, job_roles(title)')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (recentError) {
        console.error('Error loading recent resumes:', recentError);
        // This is non-critical, so just log it
      }
      
      const filteredRecentResumes = applyFilter(recentResumesData || []).slice(0, 5);

      setStats({
        totalEmployees: employeeCount,
        openPositions: rolesCount,
        pendingResumes: pendingResumes.length,
        complianceScore: 98,
        completedInterviews: interviewCount || 0,
        pendingInvitations: pendingInvitations.length,
        activeCandidates: selectedResumes.length,
      });

      if (rolesData) setJobRoles(rolesData);
      setRecentActivities(filteredRecentResumes);
      
      console.log('HR dashboard data loaded successfully');
      setLoading(false);
    } catch (error: any) {
      console.error('Critical error loading dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string | undefined) => {
    if (!urgency) return 'bg-gray-500';
    switch (urgency) {
      case 'urgent_hiring': return 'bg-red-500';
      case 'hiring': return 'bg-yellow-500';
      case 'hiring_can_wait': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const statCards = [
    { 
      label: 'Total Employees', 
      value: stats.totalEmployees.toLocaleString(), 
      Icon: Users, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      label: 'Open Positions', 
      value: stats.openPositions, 
      Icon: UserPlus, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    { 
      label: 'Pending Resumes', 
      value: stats.pendingResumes.toLocaleString(), 
      Icon: FileText, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    { 
      label: 'Completed Interviews', 
      value: stats.completedInterviews, 
      Icon: CheckCircle2, 
      color: 'text-green-600',
      bgColor: 'bg-green-600/10'
    },
    { 
      label: 'Pending Invitations', 
      value: stats.pendingInvitations, 
      Icon: Calendar, 
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    { 
      label: 'Active Candidates', 
      value: stats.activeCandidates, 
      Icon: TrendingUp, 
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading HR Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <XCircle className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-bold mb-2">Failed to Load Dashboard</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => loadDashboardData()} className="w-full">
                Try Again
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                Go Home
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">HR Command Center</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button onClick={signOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* KPI Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, idx) => {
            const Icon = stat.Icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-all border-l-4 border-l-primary">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Tabs defaultValue="recruitment" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="recruitment">AI Recruitment</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recruitment" className="space-y-6">
            {/* Job Description Upload */}
            <JobDescriptionUpload onUploadComplete={loadDashboardData} />

            {/* Job Roles Section */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Active Job Roles</h2>
                <Button onClick={() => navigate('/recruitment/seed')}>
                  <Database className="h-4 w-4 mr-2" />
                  Generate Test Data
                </Button>
              </div>
              
              <div className="grid gap-4">
                {jobRoles.map((role) => (
                  <motion.div
                    key={role.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold">{role.title}</h3>
                          {role.urgency && (
                            <Badge className={getUrgencyColor(role.urgency)}>
                              {role.urgency.replace(/_/g, ' ')}
                            </Badge>
                          )}
                          {role.vacancies && (
                            <Badge variant="outline">{role.vacancies} positions</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{role.department}</p>
                        <p className="text-sm">{role.description}</p>
                        {role.requirements && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {role.requirements.map((req: string, idx: number) => (
                              <Badge key={idx} variant="secondary">{req}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/recruitment/screening?role=${role.id}`)}
                      >
                        View Applicants
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate('/recruitment/upload')}>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold">Bulk Upload</h3>
                    <p className="text-sm text-muted-foreground">Upload resumes</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate('/recruitment/screening')}>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-500/10">
                    <CheckCircle2 className="h-8 w-8 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-bold">AI Screening</h3>
                    <p className="text-sm text-muted-foreground">{stats.pendingResumes} pending</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate('/jobs')}>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <Calendar className="h-8 w-8 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-bold">Job Listings</h3>
                    <p className="text-sm text-muted-foreground">Public view</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="interviews" className="space-y-6">
            {/* AI Interview Management Widget */}
            <AIInterviewWidget />

            {/* Interview Analysis Reports */}
            <InterviewReportsSection />

            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Interview Actions</h2>
              <div className="grid gap-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/recruitment/interviews')}
                >
                  <Video className="h-5 w-5 mr-3" />
                  View All Interviews ({stats.completedInterviews} completed)
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/recruitment/screening')}
                >
                  <Calendar className="h-5 w-5 mr-3" />
                  Pending Invitations ({stats.pendingInvitations})
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Candidate Pipeline</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-blue-500/10 rounded-lg text-center">
                    <p className="text-2xl font-bold">{stats.pendingResumes}</p>
                    <p className="text-sm text-muted-foreground">Applicants</p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg text-center">
                    <p className="text-2xl font-bold">{stats.activeCandidates}</p>
                    <p className="text-sm text-muted-foreground">Selected</p>
                  </div>
                  <div className="p-4 bg-secondary/20 rounded-lg text-center">
                    <p className="text-2xl font-bold">{stats.completedInterviews}</p>
                    <p className="text-sm text-muted-foreground">Interviewed</p>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate('/recruitment/pipeline')}
                >
                  View Full Pipeline
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Employee Management</h2>
              <div className="grid gap-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/employees')}
                >
                  <Users className="h-5 w-5 mr-3" />
                  View All Employees
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/employees/add')}
                >
                  <UserPlus className="h-5 w-5 mr-3" />
                  Add New Employee
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/departments')}
                >
                  <FileText className="h-5 w-5 mr-3" />
                  Manage Departments
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Compliance & Payroll</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="font-medium">Compliance Status</p>
                      <p className="text-sm text-muted-foreground">Last audit: 2 days ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-500">{stats.complianceScore}%</p>
                    <Progress value={stats.complianceScore} className="w-24 mt-1" />
                  </div>
                </div>

                <div className="grid gap-3">
                  <Button className="w-full justify-start" variant="outline" size="lg">
                    <DollarSign className="h-5 w-5 mr-3" />
                    Process Payroll
                  </Button>
                  <Button className="w-full justify-start" variant="outline" size="lg">
                    <FileText className="h-5 w-5 mr-3" />
                    Compliance Tracker
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">System Analytics</h2>
                <Button onClick={() => navigate('/analytics/advanced')}>
                  View Advanced Analytics
                </Button>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-secondary/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Hiring Velocity</p>
                  <p className="text-3xl font-bold">24 hires/month</p>
                  <Progress value={75} className="mt-2" />
                </div>
                <div className="p-4 bg-secondary/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Attrition Rate</p>
                  <p className="text-3xl font-bold">8.2%</p>
                  <Progress value={18} className="mt-2" />
                </div>
                <div className="p-4 bg-secondary/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Average Time to Hire</p>
                  <p className="text-3xl font-bold">18 days</p>
                  <Progress value={60} className="mt-2" />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Application Settings</h2>
              <DemoModeToggle />
            </Card>
          </TabsContent>
        </Tabs>

        {/* Real-time Activity Feed */}
        <Card className="p-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Activities</h2>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No recent activities. Generate test data to see activity feed.
              </p>
            ) : (
              recentActivities.map((activity, idx) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-4 p-4 border-l-4 border-l-primary bg-secondary/10 rounded-r-lg hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {activity.screening_status === 'selected' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : activity.screening_status === 'rejected' ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      New Resume: {activity.candidate_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Applied for {activity.job_roles?.title || activity.position_applied}
                      {activity.ai_score && ` • Score: ${activity.ai_score}/100`}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Floating Chatbot */}
      <FloatingChatbot />
    </div>
  );
};

export default HRDashboard;
