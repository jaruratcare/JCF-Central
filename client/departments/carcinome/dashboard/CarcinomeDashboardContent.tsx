import React from "react";
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  IndianRupee,
  BarChart3,
  Database,
  Activity,
  HeartPulse,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CarcinomeProvider } from "../context/CarcinomeContext";
import { OverviewDashboardView } from "../views/OverviewDashboardView";
import { PatientsView } from "../views/PatientsView";
import { SessionsView } from "../views/SessionsView";
import { TasksView } from "../views/TasksView";
import { PaymentsView } from "../views/PaymentsView";
import { ReportsView } from "../views/ReportsView";
import { MasterDataView } from "../views/MasterDataView";
import { AuditLogView } from "../views/AuditLogView";
import { PatientDetailsView } from "../views/PatientDetailsView";

const NAVIGATION_ITEMS = [
  { id: "dashboard", path: "/departments/carcinome/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "patients", path: "/departments/carcinome/patients", label: "Patients", icon: Users },
  { id: "sessions", path: "/departments/carcinome/sessions", label: "Sessions", icon: Calendar },
  { id: "tasks", path: "/departments/carcinome/tasks", label: "Tasks", icon: CheckSquare },
  { id: "payments", path: "/departments/carcinome/payments", label: "Payments", icon: IndianRupee },
  { id: "reports", path: "/departments/carcinome/reports", label: "Reports", icon: BarChart3 },
  { id: "master-data", path: "/departments/carcinome/master-data", label: "Master Data", icon: Database },
  { id: "audit", path: "/departments/carcinome/audit", label: "Audit Log", icon: Activity },
];

function PatientDetailsRouteWrapper() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  return (
    <PatientDetailsView
      patientId={patientId || null}
      onClose={() => navigate(-1)}
    />
  );
}

function CarcinomeDashboardInner() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-sm">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Carcinome Patient Coordination
              </h1>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px]">
                Operations Command
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Oncology Patient Operations & Infusion Management System
            </p>
          </div>
        </div>

        {/* 8 Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.path)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main View Area */}
      <div>
        <Routes>
          <Route path="/" element={<Navigate to="/departments/carcinome/dashboard" replace />} />
          <Route path="/dashboard" element={<OverviewDashboardView />} />
          <Route path="/patients" element={<PatientsView />} />
          <Route path="/patients/:patientId" element={<PatientDetailsRouteWrapper />} />
          <Route path="/sessions" element={<SessionsView />} />
          <Route path="/tasks" element={<TasksView />} />
          <Route path="/payments" element={<PaymentsView />} />
          <Route path="/reports" element={<ReportsView />} />
          <Route path="/master-data" element={<MasterDataView />} />
          <Route path="/audit" element={<AuditLogView />} />
          <Route path="*" element={<Navigate to="/departments/carcinome/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function CarcinomeDashboardContent() {
  return (
    <CarcinomeProvider>
      <CarcinomeDashboardInner />
    </CarcinomeProvider>
  );
}
