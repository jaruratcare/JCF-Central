import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/authContext";
import { ThemeProvider } from "./theme/themeContext";
import { ProtectedRoute } from "./routing/ProtectedRoute";
import { DepartmentGuard } from "./routing/DepartmentGuard";

import Login from "./pages/Login";
import Settings from "./pages/Settings";
import DepartmentRedirect from "./pages/DepartmentRedirect";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

import CEOOfficeDashboard from "./departments/ceo-office/dashboard/Dashboard";
import HRDashboard from "./departments/hr/dashboard/Dashboard";
import PsyConnectDashboard from "./departments/psy-connect/dashboard/Dashboard";
import TechDashboard from "./departments/tech/dashboard/Dashboard";
import PRDashboard from "./departments/pr/dashboard/Dashboard";
import CarcinomaDashboard from "./departments/carcinoma/dashboard/Dashboard";
import MedicalPartnershipDashboard from "./departments/medical-partnership/dashboard/Dashboard";
import CGMPDashboard from "./departments/cgmp/dashboard/Dashboard";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/auth/department-redirect" element={
                <ProtectedRoute>
                  <DepartmentRedirect />
                </ProtectedRoute>
              } />
              <Route path="/unauthorized" element={<Unauthorized />} />

              <Route path="/departments/ceo-office" element={
                <ProtectedRoute>
                  <DepartmentGuard allowedDepartment="ceo-office">
                    <CEOOfficeDashboard />
                  </DepartmentGuard>
                </ProtectedRoute>
              } />

              <Route path="/departments/hr" element={
                <ProtectedRoute>
                  <DepartmentGuard allowedDepartment="hr">
                    <HRDashboard />
                  </DepartmentGuard>
                </ProtectedRoute>
              } />

              <Route path="/departments/psy-connect" element={
                <ProtectedRoute>
                  <DepartmentGuard allowedDepartment="psy-connect">
                    <PsyConnectDashboard />
                  </DepartmentGuard>
                </ProtectedRoute>
              } />

              <Route path="/departments/tech" element={
                <ProtectedRoute>
                  <DepartmentGuard allowedDepartment="tech">
                    <TechDashboard />
                  </DepartmentGuard>
                </ProtectedRoute>
              } />

              <Route path="/departments/pr" element={
                <ProtectedRoute>
                  <DepartmentGuard allowedDepartment="pr">
                    <PRDashboard />
                  </DepartmentGuard>
                </ProtectedRoute>
              } />

              <Route path="/departments/carcinoma" element={
                <ProtectedRoute>
                  <DepartmentGuard allowedDepartment="carcinoma">
                    <CarcinomaDashboard />
                  </DepartmentGuard>
                </ProtectedRoute>
              } />

              <Route path="/departments/medical-partnership" element={
                <ProtectedRoute>
                  <DepartmentGuard allowedDepartment="medical-partnership">
                    <MedicalPartnershipDashboard />
                  </DepartmentGuard>
                </ProtectedRoute>
              } />

              <Route path="/departments/cgmp" element={
                <ProtectedRoute>
                  <DepartmentGuard allowedDepartment="cgmp">
                    <CGMPDashboard />
                  </DepartmentGuard>
                </ProtectedRoute>
              } />

              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
