import React from "react";
import { Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import { CarcinomeProvider } from "../context/CarcinomeContext";
import { OverviewDashboardView } from "../views/OverviewDashboardView";
import { PatientsView } from "../views/PatientsView";
import { SessionsView } from "../views/SessionsView";
import { TasksView } from "../views/TasksView";
import { PaymentsView } from "../views/PaymentsView";
import { BillingView } from "../views/BillingView";
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
      {/* Main View Area */}
      <div>
        <Routes>
          <Route path="/" element={<Navigate to="/departments/carcinome/dashboard" replace />} />
          <Route path="/dashboard" element={<OverviewDashboardView />} />
          <Route path="/patients" element={<PatientsView />} />
          <Route path="/patients/:patientId" element={<PatientDetailsRouteWrapper />} />
          <Route path="/sessions" element={<SessionsView />} />
          <Route path="/tasks" element={<TasksView />} />
          <Route path="/billing" element={<BillingView />} />
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
