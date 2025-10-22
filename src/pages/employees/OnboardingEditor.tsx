import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const OnboardingEditor = () => {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    task_type: 'document',
    priority: 'medium',
    due_date: '',
  });

  // Fetch workflow with tasks
  const { data: workflow, isLoading } = useQuery({
    queryKey: ['onboarding-workflow-edit', workflowId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_workflows')
        .select(`
          *,
          employees (
            id,
            full_name,
            email,
            position,
            hire_date
          ),
          onboarding_tasks (*)
        `)
        .eq('id', workflowId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: any }) => {
      const { error } = await supabase
        .from('onboarding_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-workflow-edit', workflowId] });
      toast.success('Task updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update task: ' + error.message);
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('onboarding_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-workflow-edit', workflowId] });
      toast.success('Task deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete task: ' + error.message);
    },
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (task: any) => {
      const maxOrder = workflow?.onboarding_tasks?.length || 0;
      const { error } = await supabase
        .from('onboarding_tasks')
        .insert({
          workflow_id: workflowId,
          ...task,
          order_index: maxOrder + 1,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-workflow-edit', workflowId] });
      toast.success('Task added successfully');
      setNewTask({
        title: '',
        description: '',
        task_type: 'document',
        priority: 'medium',
        due_date: '',
      });
    },
    onError: (error: any) => {
      toast.error('Failed to add task: ' + error.message);
    },
  });

  const handleAddTask = () => {
    if (!newTask.title) {
      toast.error('Task title is required');
      return;
    }
    addTaskMutation.mutate(newTask);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading workflow...</p>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Workflow not found</p>
          <Button onClick={() => navigate('/employees/onboarding')}>
            Back to Onboarding Management
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/employees/onboarding')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Onboarding Management
          </Button>
          <h1 className="text-3xl font-bold mb-2">Edit Onboarding Workflow</h1>
          <p className="text-muted-foreground">
            {workflow.employees.full_name} - {workflow.employees.position}
          </p>
        </div>

        {/* Tasks List */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">Tasks</h2>
          {workflow.onboarding_tasks
            ?.sort((a: any, b: any) => a.order_index - b.order_index)
            .map((task: any, index: number) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Task Title</Label>
                      <Input
                        value={task.title}
                        onChange={(e) =>
                          updateTaskMutation.mutate({
                            taskId: task.id,
                            updates: { title: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={task.due_date || ''}
                        onChange={(e) =>
                          updateTaskMutation.mutate({
                            taskId: task.id,
                            updates: { due_date: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Task Type</Label>
                      <Select
                        value={task.task_type}
                        onValueChange={(value) =>
                          updateTaskMutation.mutate({
                            taskId: task.id,
                            updates: { task_type: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="document">Document</SelectItem>
                          <SelectItem value="training">Training</SelectItem>
                          <SelectItem value="system_access">System Access</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="equipment">Equipment</SelectItem>
                          <SelectItem value="orientation">Orientation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <Select
                        value={task.priority}
                        onValueChange={(value) =>
                          updateTaskMutation.mutate({
                            taskId: task.id,
                            updates: { priority: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={task.description || ''}
                        onChange={(e) =>
                          updateTaskMutation.mutate({
                            taskId: task.id,
                            updates: { description: e.target.value },
                          })
                        }
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Task
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
        </div>

        {/* Add New Task */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Plus className="h-6 w-6" />
            Add New Task
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Task Title *</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Task Type</Label>
              <Select
                value={newTask.task_type}
                onValueChange={(value) => setNewTask({ ...newTask, task_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="system_access">System Access</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="orientation">Orientation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={newTask.priority}
                onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleAddTask} disabled={addTaskMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {addTaskMutation.isPending ? 'Adding...' : 'Add Task'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingEditor;
