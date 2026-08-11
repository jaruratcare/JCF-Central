import React from "react";
import { useCarcinome } from "../context/CarcinomeContext";
import { OverviewDashboardView } from "../views/OverviewDashboardView";
import { PatientsView } from "../views/PatientsView";
import { SessionsView } from "../views/SessionsView";
import { TasksView } from "../views/TasksView";
import { PaymentsView } from "../views/PaymentsView";
import { ReportsView } from "../views/ReportsView";
import { MasterDataView } from "../views/MasterDataView";
import { AuditLogView } from "../views/AuditLogView";
import { PatientDetailsModal } from "../views/PatientDetailsModal";

function CarcinomeDashboardInner() {
  const { activeTab, selectedPatientId, setSelectedPatientId } = useCarcinome();

  return (
    <div className="space-y-6">

      {/* Main View Area */}
      <div>
        {activeTab === "dashboard" && <OverviewDashboardView />}
        {activeTab === "patients" && <PatientsView />}
        {activeTab === "sessions" && <SessionsView />}
        {activeTab === "tasks" && <TasksView />}
        {activeTab === "payments" && <PaymentsView />}
        {activeTab === "reports" && <ReportsView />}
        {activeTab === "master-data" && <MasterDataView />}
        {activeTab === "audit" && <AuditLogView />}
      </div>

      {/* Patient Details Modal */}
      <PatientDetailsModal
        patientId={selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
      />
    </div>
  );
}

export default function CarcinomeDashboardContent() {
  return <CarcinomeDashboardInner />;
}
