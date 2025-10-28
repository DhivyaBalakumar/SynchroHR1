import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { RoleCard } from "@/components/RoleCard";
import { FeatureCard } from "@/components/FeatureCard";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDemoMode } from "@/contexts/DemoModeContext";
import {
  Users,
  UserCog,
  Shield,
  GraduationCap,
  BarChart3,
  Zap,
  Brain,
  TrendingUp,
  Target,
  Heart,
  Bot,
  Award,
  Database,
  Crown,
  Building2,
} from "lucide-react";

import employeeImage from "@/assets/employee-role.png";
import managerImage from "@/assets/manager-role.png";
import hrImage from "@/assets/hr-role.png";
import internImage from "@/assets/intern-role.png";
import analyticsImage from "@/assets/analytics-feature.png";
import automationImage from "@/assets/automation-feature.png";
import careerCoachImage from "@/assets/career-coach.png";

const Index = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  const roles = [
    {
      id: "admin",
      title: "Management Admin",
      description: "Complete system control with full access to all features, user management, and platform configuration.",
      Icon: Building2,
      image: hrImage,
      features: [
        "Full system access and control",
        "User and role management",
        "Platform configuration settings",
        "System-wide analytics and monitoring"
      ],
    },
    {
      id: "hr",
      title: "HR",
      description: "Comprehensive control center for organizational management, compliance, and strategic insights.",
      Icon: Shield,
      image: hrImage,
      features: [
        "Full system administration",
        "Compliance and risk tracking",
        "Organization-wide analytics",
        "Policy and workflow management"
      ],
    },
    {
      id: "manager",
      title: "Manager",
      description: "Lead your team with powerful analytics, approval workflows, and performance management tools.",
      Icon: UserCog,
      image: managerImage,
      features: [
        "Team analytics and insights",
        "Approval workflows and requests",
        "Performance wall and rankings",
        "Pulse surveys and feedback"
      ],
    },
    {
      id: "senior_manager",
      title: "Senior Manager",
      description: "Strategic leadership with cross-department insights, advanced analytics, and executive decision-making tools.",
      Icon: TrendingUp,
      image: managerImage,
      features: [
        "Multi-department oversight and analytics",
        "Strategic planning and forecasting",
        "Executive reports and KPIs",
        "Budget and resource allocation"
      ],
    },
    {
      id: "employee",
      title: "Employee",
      description: "Access your personal workspace, view payslips, manage attendance, and track your career growth.",
      Icon: Users,
      image: employeeImage,
      features: [
        "Personal dashboard and analytics",
        "Leave requests and attendance tracking",
        "Payslip and benefits access",
        "Career development tools"
      ],
    },
    {
      id: "intern",
      title: "Intern",
      description: "Unique onboarding experience with mentorship, goal tracking, and career development resources.",
      Icon: GraduationCap,
      image: internImage,
      features: [
        "Interactive onboarding checklist",
        "Mentor connection and guidance",
        "Learning path and skill tracking",
        "Feedback and growth badges"
      ],
    },
  ];

  const features = [
    {
      title: "Advanced Analytics",
      description: "Real-time dashboards with drill-down capabilities, customizable KPIs, and predictive insights powered by AI.",
      Icon: BarChart3,
      image: analyticsImage,
      requiredRoles: ["hr", "manager", "senior_manager"],
      dashboardRoute: "/analytics/advanced",
      usageSteps: [
        "Click on any chart or metric to drill down into detailed data",
        "Hover over data points to see contextual tooltips and breakdowns",
        "Use filters and date ranges to customize your view",
        "Export reports with one click or schedule automated reports",
        "Set up alerts for key metrics and threshold breaches"
      ],
    },
    {
      title: "Intelligent Automation",
      description: "Automate repetitive HR tasks, approval workflows, and notifications with smart triggers and conditions.",
      Icon: Zap,
      image: automationImage,
      requiredRoles: ["hr"],
      dashboardRoute: "/recruitment/screening",
      usageSteps: [
        "Browse pre-built automation templates or create custom workflows",
        "Drag and drop workflow steps to design your automation",
        "Set triggers based on events, time, or conditions",
        "Test your automation in sandbox mode before activation",
        "Monitor automation performance with real-time logs"
      ],
    },
    {
      title: "AI Career Coach",
      description: "Personalized career guidance with skill recommendations, learning paths, and growth opportunities.",
      Icon: Brain,
      image: careerCoachImage,
      requiredRoles: ["employee", "intern", "manager", "hr", "senior_manager"],
      dashboardRoute: null,
      usageSteps: [
        "Click the floating AI coach widget from any dashboard",
        "Ask questions or request career advice in natural language",
        "View your personalized skill map and career path visualization",
        "Get AI-powered recommendations for courses and certifications",
        "Track your progress with animated achievement badges"
      ],
    },
    {
      title: "Performance Wall",
      description: "Interactive team ranking and performance visualization for managers with drag-and-drop feedback.",
      Icon: Target,
      image: managerImage,
      requiredRoles: ["manager", "senior_manager"],
      dashboardRoute: "/dashboard/manager",
      usageSteps: [
        "View your team members as interactive cards",
        "Drag and drop cards to reorder team rankings",
        "Click on any team member to see detailed performance metrics",
        "Send instant feedback or appreciation with one click",
        "Schedule 1-on-1s directly from the performance wall"
      ],
    },
    {
      title: "Pulse Surveys",
      description: "Launch real-time team sentiment surveys with instant results and trend analysis.",
      Icon: Heart,
      image: analyticsImage,
      requiredRoles: ["hr", "manager", "senior_manager"],
      dashboardRoute: "/dashboard/manager",
      usageSteps: [
        "Create a new survey with custom questions or templates",
        "Send to specific teams, departments, or the entire organization",
        "Watch responses come in real-time with live charts",
        "Analyze sentiment trends and identify areas for improvement",
        "Compare results across time periods and teams"
      ],
    },
    {
      title: "Intern Experience",
      description: "Comprehensive onboarding journey with mentorship matching, goal tracking, and growth celebration.",
      Icon: Award,
      image: internImage,
      requiredRoles: ["intern"],
      dashboardRoute: "/dashboard/intern",
      usageSteps: [
        "Complete your interactive onboarding checklist step by step",
        "Connect with your assigned mentor for guidance and support",
        "Set personal and professional goals with milestone tracking",
        "Request feedback from team members with emoji reactions",
        "Earn badges and celebrate achievements in your growth timeline"
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient Mesh Background */}
      <div 
        className="fixed inset-0 -z-10 opacity-30"
        style={{ background: 'var(--gradient-mesh)' }}
      />

      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <Logo />
            <div className="flex items-center gap-2 md:gap-4">
              {/* Demo Mode Toggle */}
              <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-border bg-card">
                <Database className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                <Label htmlFor="demo-mode-header" className="text-xs md:text-sm font-medium cursor-pointer">
                  {isDemoMode ? 'Demo' : 'Prod'}
                </Label>
                <Switch
                  id="demo-mode-header"
                  checked={isDemoMode}
                  onCheckedChange={toggleDemoMode}
                  className="scale-75 md:scale-90"
                />
              </div>
              
              <Link to="/jobs">
                <Button variant="ghost" size="sm" className="hidden lg:inline-flex">
                  Browse Jobs
                </Button>
              </Link>
              <Link to="/demo/ai-interview">
                <Button variant="ghost" size="sm" className="hidden lg:inline-flex">
                  AI Interview Demo
                </Button>
              </Link>
              <Link to="/auth?mode=login">
                <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs md:text-sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button size="sm" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-xs md:text-sm px-3 md:px-4">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-10 md:py-20">
        <div className="text-center max-w-4xl mx-auto space-y-4 md:space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold px-2"
          >
            <span className="bg-gradient-to-r from-primary via-primary to-primary bg-clip-text text-transparent">
              Intelligent HR
            </span>
            <br />
            Management Platform
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4"
          >
            Empower your workforce with AI-powered analytics, seamless automation, 
            and tools designed for employees, managers, HR teams, and interns.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-3 md:gap-4 pt-2 md:pt-4 px-4"
          >
            <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              <span>Real-time Analytics</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
              <Zap className="h-3 w-3 md:h-4 md:w-4 text-secondary" />
              <span>Smart Automation</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
              <Bot className="h-3 w-3 md:h-4 md:w-4 text-accent" />
              <span>AI-Powered Insights</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Role Selection Section */}
      <section className="container mx-auto px-4 py-8 md:py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-12 px-2"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4">Choose Your Role</h2>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
            Select your login type to see personalized features
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {roles.map((role, idx) => (
            <RoleCard
              key={role.id}
              id={role.id}
              {...role}
              isSelected={selectedRole === role.id}
              onClick={() => setSelectedRole(role.id)}
              delay={idx * 0.1}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-8 md:py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-12 px-2"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4">Powerful Features</h2>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
            Interactive tools designed to streamline HR operations and empower every team member
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto">
          {features.map((feature, idx) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              delay={idx * 0.1}
            />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-10 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center space-y-4 md:space-y-8 p-6 md:p-12 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold">
            Ready to Transform Your HR?
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground px-4">
            Experience the future of AI-powered HR management with intelligent automation
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 pt-2">
            <Link to="/auth?mode=signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-base md:text-lg px-6 md:px-8">
                Get Started Free
              </Button>
            </Link>
            <Link to="/demo/ai-interview" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8">
                View AI Interview Demo
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo />
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">Contact</a>
              <a href="#" className="hover:text-primary transition-colors">Support</a>
            </div>
          </div>
          <div className="text-center mt-4 text-sm text-muted-foreground">
            © 2025 SynchroHR. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Floating Chatbot */}
      <FloatingChatbot />
    </div>
  );
};

export default Index;
