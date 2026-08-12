import React from "react";
import { Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import { HeartPulse } from "lucide-react";
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
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-slate-50 p-5 shadow-sm dark:border-blue-900/40 dark:from-blue-950/40 dark:via-cyan-950/20 dark:to-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white shadow-sm">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Carcinome Patient Coordination
                </h1>
                <Badge className="bg-blue-100 text-blue-800 text-[10px] dark:bg-blue-950 dark:text-blue-300">
                  Operations Command
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Oncology patient operations, infusion management, and care coordination in one place.
              </p>
            </div>
          </div>
          <div className="rounded-full border border-blue-200 bg-white/70 px-3 py-1 text-[11px] font-medium text-blue-700 shadow-sm dark:border-blue-800 dark:bg-slate-900/70 dark:text-blue-300">
            Sidebar navigation keeps the workflow focused and consistent.
          </div>
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
  return <CarcinomeDashboardInner />;
}
