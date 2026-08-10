import React from "react";
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
import { CarcinomeProvider, useCarcinome } from "../context/CarcinomeContext";
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
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "patients", label: "Patients", icon: Users },
  { id: "sessions", label: "Sessions", icon: Calendar },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "payments", label: "Payments", icon: IndianRupee },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "master-data", label: "Master Data", icon: Database },
  { id: "audit", label: "Audit Log", icon: Activity },
];

function CarcinomeDashboardInner() {
  const { activeTab, setActiveTab, selectedPatientId, setSelectedPatientId } = useCarcinome();

  const handleTabClick = (tabId: string) => {
    setSelectedPatientId(null);
    setActiveTab(tabId);
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
            const isActive = !selectedPatientId && activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
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
        {selectedPatientId ? (
          <PatientDetailsView
            patientId={selectedPatientId}
            onClose={() => setSelectedPatientId(null)}
          />
        ) : (
          <>
            {activeTab === "dashboard" && <OverviewDashboardView />}
            {activeTab === "patients" && <PatientsView />}
            {activeTab === "sessions" && <SessionsView />}
            {activeTab === "tasks" && <TasksView />}
            {activeTab === "payments" && <PaymentsView />}
            {activeTab === "reports" && <ReportsView />}
            {activeTab === "master-data" && <MasterDataView />}
            {activeTab === "audit" && <AuditLogView />}
          </>
        )}
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
