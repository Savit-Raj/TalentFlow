import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Layout from "./components/layout/Layout";
import Index from "./pages/index";
import JobsPage from "./pages/JobsPage";
import JobDetail from "./components/jobs/JobDetail";
import CandidatesPage from "./pages/CandidatesPage";
import AssessmentsPage from "./pages/AssessmentsPage";
import NotFound from "./pages/NotFound";
import CandidateProfile from "./components/candidates/CandidateProfile";
import LoginPage from "./pages/LoginPage";

import AuthProvider from "./contexts/AuthContext";
import { useAuth } from "./hooks/use-auth";
import { initializeDatabase } from "./lib/seedData";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // Initialize database on app start
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log(' Initializing database...');
        await initializeDatabase();
        console.log(' TalentFlow initialized successfully');
      } catch (error) {
        console.error(' Failed to initialize TalentFlow:', error);
      }
    };

    if (isAuthenticated && !isLoading) {
      initialize();
    }
  }, [isAuthenticated, isLoading]);



  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Index />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/:jobNumber" element={<JobDetail />} />
        <Route path="candidates" element={<CandidatesPage />} />
        <Route path="candidates/:email" element={<CandidateProfile />} />
        <Route path="assessments" element={<AssessmentsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
