import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingState from "@/components/LoadingState";
import PrivateRoute from "@/components/PrivateRoute";
import RealtimeProvider from "@/components/RealtimeProvider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Drones = lazy(() => import("./pages/Drones"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Content = lazy(() => import("./pages/Content"));
const Settings = lazy(() => import("./pages/Settings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <LoadingState 
    message="Loading page..." 
    variant="overlay" 
    type="general" 
  />
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RealtimeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/drones" element={<PrivateRoute roles={["admin","manager","worker"]}><Drones /></PrivateRoute>} />
                <Route path="/analytics" element={<PrivateRoute roles={["admin","manager"]}><Analytics /></PrivateRoute>} />
                <Route path="/content" element={<PrivateRoute roles={["admin","manager"]}><Content /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute roles={["admin"]}><Settings /></PrivateRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </RealtimeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
