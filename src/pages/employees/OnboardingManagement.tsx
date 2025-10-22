import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Users, CheckCircle, Clock, AlertCircle, FileText, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import OnboardingManagementWidget from '@/components/hr/OnboardingManagementWidget';

const OnboardingManagement = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch all workflows with details
  const { data: workflows, isLoading } = useQuery({
    queryKey: ['all-onboarding-workflows', activeTab],
    queryFn: async () => {
      let query = supabase
        .from('onboarding_workflows')
        .select(`
          *,
          employees (
            id,
            full_name,
            email,
            position,
            hire_date,
            department_id
          ),
          onboarding_tasks (
            id,
            title,
            status,
            task_type,
            priority,
            due_date,
            completed_at
          )
        `);

      // Filter based on active tab
      if (activeTab === 'in_progress') {
        query = query.eq('status', 'in_progress');
      } else if (activeTab === 'completed') {
        query = query.eq('status', 'completed');
      } else if (activeTab === 'not_started') {
        query = query.eq('status', 'not_started');
      }

      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'not_started': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard/hr')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Onboarding Management</h1>
              <p className="text-muted-foreground">Track and manage employee onboarding workflows</p>
            </div>
          </div>
        </div>

        {/* Overview Widget */}
        <div className="mb-8">
          <OnboardingManagementWidget />
        </div>

        {/* Detailed Workflows */}
        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview">All</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="not_started">Not Started</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading workflows...</p>
                </div>
              ) : workflows && workflows.length > 0 ? (
                <div className="space-y-6">
                  {workflows.map((workflow: any, index: number) => (
                    <motion.div
                      key={workflow.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold">{workflow.employees?.full_name}</h3>
                              <Badge variant={
                                workflow.status === 'completed' ? 'default' :
                                workflow.status === 'in_progress' ? 'secondary' :
                                'outline'
                              }>
                                {workflow.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {workflow.employees?.position}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Hired: {new Date(workflow.employees?.hire_date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                {workflow.employees?.email}
                              </span>
                            </div>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(workflow.status)}`} />
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Overall Progress</span>
                            <span className="font-bold">{workflow.progress_percentage}%</span>
                          </div>
                          <Progress value={workflow.progress_percentage} className="h-3" />
                        </div>

                        {/* Tasks Summary */}
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          {['pending', 'in_progress', 'completed', 'skipped'].map(status => {
                            const count = workflow.onboarding_tasks.filter((t: any) => t.status === status).length;
                            return (
                              <div key={status} className="text-center p-3 rounded-lg bg-secondary/20">
                                <p className="text-2xl font-bold">{count}</p>
                                <p className="text-xs text-muted-foreground capitalize">{status.replace('_', ' ')}</p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Task List */}
                        <div className="space-y-2">
                          <p className="font-semibold text-sm mb-2">Tasks:</p>
                          {workflow.onboarding_tasks
                            .sort((a: any, b: any) => a.order_index - b.order_index)
                            .slice(0, 5)
                            .map((task: any) => {
                              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
                              return (
                                <div 
                                  key={task.id} 
                                  className={`flex items-center justify-between p-2 rounded ${
                                    task.status === 'completed' ? 'bg-green-500/10' :
                                    task.status === 'in_progress' ? 'bg-blue-500/10' :
                                    isOverdue ? 'bg-red-500/10' :
                                    'bg-muted'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    {task.status === 'completed' ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : task.status === 'in_progress' ? (
                                      <Clock className="h-4 w-4 text-blue-500" />
                                    ) : isOverdue ? (
                                      <AlertCircle className="h-4 w-4 text-red-500" />
                                    ) : (
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="text-sm truncate">{task.title}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                                      {task.priority}
                                    </Badge>
                                    {task.due_date && (
                                      <span className={`text-xs ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                                        {new Date(task.due_date).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          {workflow.onboarding_tasks.length > 5 && (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              + {workflow.onboarding_tasks.length - 5} more tasks
                            </p>
                          )}
                        </div>

                        {/* Timestamps and Actions */}
                        <div className="mt-4 pt-4 border-t flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            <span>Started: {workflow.started_at ? new Date(workflow.started_at).toLocaleDateString() : 'Not started'}</span>
                            {workflow.completed_at && (
                              <span className="ml-4">Completed: {new Date(workflow.completed_at).toLocaleDateString()}</span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/employees/onboarding/${workflow.id}/edit`)}
                          >
                            Edit Tasks
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'overview' 
                      ? 'No onboarding workflows have been created yet'
                      : `No ${activeTab.replace('_', ' ')} workflows`
                    }
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingManagement;