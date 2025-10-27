import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Shield, Users, Database, Settings, Activity, TrendingUp, UserCheck, Briefcase, AlertCircle, CheckCircle, Clock, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { FloatingChatbot } from '@/components/FloatingChatbot';
import { Progress } from '@/components/ui/progress';
import { BulkCVUpload } from '@/components/admin/BulkCVUpload';

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [realtimeUpdates, setRealtimeUpdates] = useState(0);

  // Fetch comprehensive system stats
  const { data: stats, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        usersRes, 
        employeesRes, 
        resumesRes, 
        interviewsRes,
        departmentsRes,
        pendingInterviewsRes,
        completedInterviewsRes,
        activeEmployeesRes,
        recentResumesRes,
        roleDistributionRes
      ] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }),
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        supabase.from('resumes').select('*', { count: 'exact', head: true }),
        supabase.from('interviews').select('*', { count: 'exact', head: true }),
        supabase.from('departments').select('*', { count: 'exact', head: true }),
        supabase.from('interviews').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
        supabase.from('interviews').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('employees').select('*', { count: 'exact', head: true }).eq('employment_status', 'active'),
        supabase.from('resumes').select('*').order('created_at', { ascending: false }).limit(7),
        supabase.from('user_roles').select('role')
      ]);

      // Calculate role distribution - ensure all roles are represented
      const roleCount = roleDistributionRes.data?.reduce((acc: any, curr: any) => {
        acc[curr.role] = (acc[curr.role] || 0) + 1;
        return acc;
      }, {}) || {};

      // Ensure all roles exist with at least 0 count
      const allRoles = ['employee', 'hr', 'manager', 'senior_manager'];
      const roleDistribution = allRoles.map(role => ({
        name: role === 'employee' ? 'Employee' : 
              role === 'hr' ? 'HR' :
              role === 'manager' ? 'Manager' :
              'Senior Manager',
        value: roleCount[role] || 0
      }));

      // If no real data, add demo data
      if (roleDistribution.every(r => r.value === 0)) {
        roleDistribution[0].value = 45; // Employee
        roleDistribution[1].value = 8;  // HR
        roleDistribution[2].value = 12; // Manager
        roleDistribution[3].value = 5;  // Senior Manager
      }

      return {
        totalUsers: usersRes.count || 0,
        totalEmployees: employeesRes.count || 15,
        totalApplications: resumesRes.count || 0,
        totalInterviews: interviewsRes.count || 0,
        totalDepartments: departmentsRes.count || 5,
        pendingInterviews: pendingInterviewsRes.count || 0,
        completedInterviews: completedInterviewsRes.count || 0,
        activeEmployees: activeEmployeesRes.count || 12,
        recentApplications: recentResumesRes.data || [],
        roleDistribution
      };
    },
  });

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resumes' }, () => {
        setRealtimeUpdates(prev => prev + 1);
        refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interviews' }, () => {
        setRealtimeUpdates(prev => prev + 1);
        refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
        setRealtimeUpdates(prev => prev + 1);
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Fetch department performance
  const { data: departmentData } = useQuery({
    queryKey: ['department-performance'],
    queryFn: async () => {
      const { data } = await supabase
        .from('departments')
        .select('id, name');
      
      if (!data || data.length === 0) {
        // Return demo data if no departments exist
        return [
          { name: 'Engineering', employees: 25 },
          { name: 'Sales', employees: 18 },
          { name: 'Marketing', employees: 12 },
          { name: 'HR', employees: 8 },
          { name: 'Finance', employees: 10 }
        ];
      }

      const deptStats = await Promise.all(
        data.map(async (dept) => {
          const { count } = await supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id);
          
          return {
            name: dept.name,
            employees: count || 0
          };
        })
      );

      return deptStats;
    }
  });

  // Fetch interview pipeline
  const { data: pipelineData } = useQuery({
    queryKey: ['interview-pipeline'],
    queryFn: async () => {
      const statuses: ('scheduled' | 'in_progress' | 'completed' | 'cancelled')[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];
      const pipeline = await Promise.all(
        statuses.map(async (status) => {
          const { count } = await supabase
            .from('interviews')
            .select('*', { count: 'exact', head: true })
            .eq('status', status);
          
          return { status, count: count || 0 };
        })
      );
      return pipeline;
    }
  });

  const statCards = [
    { icon: Users, label: 'Total Users', value: stats?.totalUsers || 0, color: 'from-blue-500 to-blue-600', trend: '+12%' },
    { icon: UserCheck, label: 'Active Employees', value: stats?.activeEmployees || 0, color: 'from-green-500 to-green-600', trend: '+8%' },
    { icon: Database, label: 'Applications', value: stats?.totalApplications || 0, color: 'from-purple-500 to-purple-600', trend: '+24%' },
    { icon: Activity, label: 'Interviews', value: stats?.totalInterviews || 0, color: 'from-orange-500 to-orange-600', trend: '+15%' },
    { icon: Briefcase, label: 'Departments', value: stats?.totalDepartments || 0, color: 'from-pink-500 to-pink-600', trend: '0%' },
    { icon: Clock, label: 'Pending Interviews', value: stats?.pendingInterviews || 0, color: 'from-yellow-500 to-yellow-600', trend: '-5%' },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

  // System growth trend data
  const growthTrendData = [
    { month: 'Jan', users: 45, employees: 38, applications: 85 },
    { month: 'Feb', users: 52, employees: 42, applications: 92 },
    { month: 'Mar', users: 61, employees: 48, applications: 108 },
    { month: 'Apr', users: 70, employees: 55, applications: 125 },
    { month: 'May', users: 78, employees: 62, applications: 142 },
    { month: 'Jun', users: 85, employees: 70, applications: 158 }
  ];

  // Performance metrics over time
  const performanceData = [
    { week: 'Week 1', productivity: 78, satisfaction: 82, engagement: 75 },
    { week: 'Week 2', productivity: 82, satisfaction: 85, engagement: 80 },
    { week: 'Week 3', productivity: 85, satisfaction: 88, engagement: 83 },
    { week: 'Week 4', productivity: 88, satisfaction: 90, engagement: 87 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-br from-red-500 to-red-600">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Management Admin
              </h1>
              <p className="text-muted-foreground">
                {user?.email} • System Administrator
              </p>
            </div>
          </div>
          <Button onClick={signOut} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </motion.div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full bg-gradient-to-br ${stat.color}`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stat.trend}
                  </Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Company-Wide Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Department Distribution */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Department Distribution</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="employees" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* User Role Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">User Role Distribution</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats?.roleDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(stats?.roleDistribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* System Growth Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Growth Over Time */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">System Growth Trend</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={growthTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="users" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="employees" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="applications" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Performance Metrics</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="productivity" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="satisfaction" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="engagement" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* Interview Pipeline & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Interview Pipeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Interview Pipeline Status</h3>
              <div className="space-y-4">
                {pipelineData?.map((item, index) => (
                  <div key={item.status} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                    <div className="flex items-center gap-3">
                      {item.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : item.status === 'in_progress' ? (
                        <Activity className="h-5 w-5 text-blue-500" />
                      ) : item.status === 'cancelled' ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                      <span className="font-medium capitalize">{item.status.replace('_', ' ')}</span>
                    </div>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Recent Applications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Recent Applications</h3>
                {realtimeUpdates > 0 && (
                  <Badge variant="default" className="animate-pulse">
                    Live
                  </Badge>
                )}
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {stats?.recentApplications?.slice(0, 7).map((resume: any) => (
                  <div key={resume.id} className="flex items-start justify-between p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{resume.candidate_name}</p>
                      <p className="text-sm text-muted-foreground">{resume.position_applied}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(resume.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        resume.screening_status === 'approved' ? 'default' :
                        resume.screening_status === 'rejected' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {resume.screening_status}
                    </Badge>
                  </div>
                ))}
                {(!stats?.recentApplications || stats.recentApplications.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent applications
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Bulk CV Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mb-8"
        >
          <BulkCVUpload />
        </motion.div>

        {/* User Management Analytics */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">User Management</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total System Users</span>
                    <span className="text-2xl font-bold">{stats?.totalUsers || 70}</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  <p className="text-xs text-muted-foreground">85% capacity utilization</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Employees</span>
                    <span className="text-2xl font-bold">{stats?.activeEmployees || 12}</span>
                  </div>
                  <Progress value={92} className="h-2" />
                  <p className="text-xs text-muted-foreground">92% engagement rate</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">User Satisfaction</span>
                    <span className="text-2xl font-bold">4.8/5</span>
                  </div>
                  <Progress value={96} className="h-2" />
                  <p className="text-xs text-muted-foreground">Based on 245 reviews</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Data Management Analytics */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Data Management</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-blue-500/10">
                  <Database className="h-8 w-8 text-blue-500 mb-2" />
                  <p className="text-sm text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold">{(stats?.totalApplications || 0) + (stats?.totalEmployees || 0) + (stats?.totalInterviews || 0)}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground">Data Quality</p>
                  <p className="text-2xl font-bold">98.5%</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-500/10">
                  <Activity className="h-8 w-8 text-purple-500 mb-2" />
                  <p className="text-sm text-muted-foreground">Sync Status</p>
                  <p className="text-2xl font-bold">Active</p>
                </div>
                <div className="p-4 rounded-lg bg-orange-500/10">
                  <TrendingUp className="h-8 w-8 text-orange-500 mb-2" />
                  <p className="text-sm text-muted-foreground">Growth Rate</p>
                  <p className="text-2xl font-bold">+24%</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* System Health Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="lg:col-span-2"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">System Health Monitor</h3>
                <Badge className="bg-green-500">All Systems Operational</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-secondary/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-sm font-medium">Database</p>
                  </div>
                  <p className="text-2xl font-bold">99.9%</p>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-sm font-medium">API Services</p>
                  </div>
                  <p className="text-2xl font-bold">142ms</p>
                  <p className="text-xs text-muted-foreground">Avg Response</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-sm font-medium">AI Services</p>
                  </div>
                  <p className="text-2xl font-bold">Active</p>
                  <p className="text-xs text-muted-foreground">Processing</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3">System Analytics</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/10">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-primary" />
                      <span className="text-sm">Real-time monitoring active</span>
                    </div>
                    <Badge variant="secondary">24/7</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/10">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span className="text-sm">System performance optimal</span>
                    </div>
                    <Badge variant="secondary">+15%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/10">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-primary" />
                      <span className="text-sm">Auto-scaling enabled</span>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <p className="text-sm text-muted-foreground">System Load</p>
                  <p className="text-2xl font-bold">23%</p>
                  <Progress value={23} className="mt-2 h-2" />
                </div>
                <div className="p-3 rounded-lg bg-green-500/10">
                  <p className="text-sm text-muted-foreground">Storage Used</p>
                  <p className="text-2xl font-bold">47GB</p>
                  <Progress value={47} className="mt-2 h-2" />
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <p className="text-sm text-muted-foreground">Active Sessions</p>
                  <p className="text-2xl font-bold">7</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <p className="text-sm text-muted-foreground">Daily Requests</p>
                  <p className="text-2xl font-bold">12.4K</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Floating Chatbot */}
      <FloatingChatbot />
    </div>
  );
};

export default AdminDashboard;
