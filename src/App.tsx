import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import Layout from "./components/layout/Layout";
import Index from "./pages/index";
import JobsPage from "./pages/JobsPage";
import JobDetail from "./components/jobs/JobDetail";
import CandidatesPage from "./pages/CandidatesPage";
import AssessmentsPage from "./pages/AssessmentsPage";
import NotFound from "./pages/NotFound";
import CandidateProfile from "./components/candidates/CandidateProfile";

import { initializeDatabase } from "./lib/seedData";

const queryClient = new QueryClient();

const App = () => {
  // Initialize database on app start
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('🔄 Initializing database...');
        await initializeDatabase();
        console.log('✅ TalentFlow initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize TalentFlow:', error);
      }
    };

    initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="jobs" element={<JobsPage />} />
              <Route path="jobs/:jobNumber" element={<JobDetail />} />
              <Route path="candidates" element={<CandidatesPage />} />
              <Route path="candidates/:email" element={<CandidateProfile />} />
              <Route path="assessments" element={<AssessmentsPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
