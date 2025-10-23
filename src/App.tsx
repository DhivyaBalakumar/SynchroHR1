import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoModeProvider } from "@/contexts/DemoModeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ErrorBoundaryWrapper from "@/components/ErrorBoundary";
import { NavigationHandler } from "@/components/NavigationHandler";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import EmployeeDashboard from "./pages/dashboard/EmployeeDashboard";
import ManagerDashboard from "./pages/dashboard/ManagerDashboard";
import HRDashboard from "./pages/dashboard/HRDashboard";
import InternDashboard from "./pages/dashboard/InternDashboard";
import SeniorManagerDashboard from "./pages/dashboard/SeniorManagerDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import BulkUpload from "./pages/recruitment/BulkUpload";
import ResumeScreening from "./pages/recruitment/ResumeScreening";
import EnhancedScreening from "./pages/recruitment/EnhancedScreening";
import SeedData from "./pages/recruitment/SeedData";
import JobListings from "./pages/public/JobListings";
import JobApplication from "./pages/public/JobApplication";
import EmployeeList from "./pages/employees/EmployeeList";
import AddEmployee from "./pages/employees/AddEmployee";
import DepartmentManagement from "./pages/employees/DepartmentManagement";
import OnboardingManagement from "./pages/employees/OnboardingManagement";
import OnboardingEditor from "./pages/employees/OnboardingEditor";
import CandidateLogin from "./pages/interview/CandidateLogin";
import InterviewPortal from "./pages/interview/InterviewPortal";
import InterviewTokenHandler from "./pages/interview/InterviewTokenHandler";
import InterviewManagement from "./pages/recruitment/InterviewManagement";
import PipelineView from "./pages/recruitment/PipelineView";
import AdvancedAnalytics from "./pages/analytics/AdvancedAnalytics";
import AIInterviewDemo from "./pages/demo/AIInterviewDemo";
import CareerCoachPage from "./pages/career/CareerCoachPage";
import PerformanceWallPage from "./pages/manager/PerformanceWallPage";
import PulseSurveysPage from "./pages/manager/PulseSurveysPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && 'status' in error && typeof error.status === 'number') {
          return error.status >= 500 && failureCount < 3;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundaryWrapper>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <DemoModeProvider>
            <AuthProvider>
              <NavigationHandler />
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />

              {/* Public Routes */}
              <Route path="/jobs" element={<JobListings />} />
              <Route path="/jobs/:jobId/apply" element={<JobApplication />} />

              {/* Dashboard Routes */}
              <Route
                path="/dashboard/employee"
                element={
                  <ProtectedRoute requiredRole={['employee']}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/manager"
                element={
                  <ProtectedRoute requiredRole={['manager']}>
                    <ManagerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/hr"
                element={
                  <ProtectedRoute requiredRole={['hr']}>
                    <HRDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/intern"
                element={
                  <ProtectedRoute requiredRole={['intern']}>
                    <InternDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/senior_manager"
                element={
                  <ProtectedRoute requiredRole={['senior_manager']}>
                    <SeniorManagerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin"
                element={
                  <ProtectedRoute requiredRole={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Recruitment Routes */}
              <Route
                path="/recruitment/upload"
                element={
                  <ProtectedRoute requiredRole={['hr']}>
                    <BulkUpload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruitment/screening"
                element={
                  <ProtectedRoute requiredRole={['hr']}>
                    <EnhancedScreening />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruitment/seed"
                element={
                  <ProtectedRoute requiredRole={['hr']}>
                    <SeedData />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruitment/interviews"
                element={
                  <ProtectedRoute requiredRole={['hr']}>
                    <InterviewManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruitment/pipeline"
                element={
                  <ProtectedRoute requiredRole={['hr']}>
                    <PipelineView />
                  </ProtectedRoute>
                }
              />

              {/* Analytics Routes */}
              <Route
                path="/analytics/advanced"
                element={
                  <ProtectedRoute requiredRole={['hr', 'senior_manager']}>
                    <AdvancedAnalytics />
                  </ProtectedRoute>
                }
              />

              {/* Career Coach Route */}
              <Route
                path="/career/coach"
                element={
                  <ProtectedRoute requiredRole={['employee', 'intern', 'manager', 'hr', 'senior_manager']}>
                    <CareerCoachPage />
                  </ProtectedRoute>
                }
              />

              {/* Performance Wall Route */}
              <Route
                path="/manager/performance-wall"
                element={
                  <ProtectedRoute requiredRole={['manager', 'senior_manager']}>
                    <PerformanceWallPage />
                  </ProtectedRoute>
                }
              />

              {/* Pulse Surveys Route */}
              <Route
                path="/manager/pulse-surveys"
                element={
                  <ProtectedRoute requiredRole={['hr', 'manager', 'senior_manager']}>
                    <PulseSurveysPage />
                  </ProtectedRoute>
                }
              />

              {/* Employee Management Routes */}
              <Route
                path="/employees"
                element={
                  <ProtectedRoute requiredRole={['hr']}>
                    <EmployeeList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees/add"
                element={
                  <ProtectedRoute requiredRole={['hr']}>
                    <AddEmployee />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/departments"
                element={
                  <ProtectedRoute requiredRole={['hr']}>
                    <DepartmentManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees/onboarding"
                element={
                  <ProtectedRoute requiredRole={['hr', 'admin']}>
                    <OnboardingManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees/onboarding/:workflowId/edit"
                element={
                  <ProtectedRoute requiredRole={['hr', 'admin']}>
                    <OnboardingEditor />
                  </ProtectedRoute>
                }
              />

              {/* Interview Routes - Public for candidates with token */}
              <Route path="/interview/login" element={<CandidateLogin />} />
              <Route path="/interview/:token" element={<InterviewTokenHandler />} />
              <Route path="/interview/portal" element={<InterviewPortal />} />
              
              {/* Demo Route - Public to showcase AI interview platform */}
              <Route path="/demo/ai-interview" element={<AIInterviewDemo />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </DemoModeProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundaryWrapper>
);

export default App;
