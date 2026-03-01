import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import DashboardRedirect from "./pages/DashboardRedirect";
import EmployeeVerify from "./pages/EmployeeVerify";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import InternalDashboard from "./pages/resources/InternalDashboard";
import GitRepository from "./pages/resources/GitRepository";
import ProductionConsole from "./pages/resources/ProductionConsole";
import HrPortal from "./pages/resources/HrPortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import { TwinklingStars } from "@/components/ui/TwinklingStars";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <TwinklingStars />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/verify" element={
              <ProtectedRoute requireVerification={false}>
                <EmployeeVerify />
              </ProtectedRoute>
            } />
            <Route path="/employee" element={
              <ProtectedRoute requiredRole="employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Resource Dashboards */}
            <Route path="/resource/internal-dashboard" element={
              <ProtectedRoute>
                <InternalDashboard />
              </ProtectedRoute>
            } />
            <Route path="/resource/git-repository" element={
              <ProtectedRoute>
                <GitRepository />
              </ProtectedRoute>
            } />
            <Route path="/resource/prod-console" element={
              <ProtectedRoute requiredRole="admin">
                <ProductionConsole />
              </ProtectedRoute>
            } />
            <Route path="/resource/hr-portal" element={
              <ProtectedRoute requiredRole="admin">
                <HrPortal />
              </ProtectedRoute>
            } />
            {/* Fallback for admin dashboard resource */}
            <Route path="/resource/admin-dashboard" element={<Navigate to="/admin" replace />} />
            <Route path="/resource/employee-dashboard" element={<Navigate to="/employee" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
