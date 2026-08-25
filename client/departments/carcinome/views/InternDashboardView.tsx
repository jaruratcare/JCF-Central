import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  Calendar,
  Activity,
  IndianRupee,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Stethoscope,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCarcinome } from "../context/CarcinomeContext";
import type { Patient } from "../data/dummy-data";

// ─── Status helpers ────────────────────────────────────────────────────────────

function getStatusColor(status: Patient["onboardingStatus"]) {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
    case "Treatment completed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }
}

function getPaymentColor(status: Patient["paymentStatus"]) {
  switch (status) {
    case "Paid":
      return "text-emerald-700 dark:text-emerald-400";
    case "Pending":
      return "text-amber-700 dark:text-amber-400";
    case "Partially Paid":
      return "text-purple-700 dark:text-purple-400";
    default:
      return "text-slate-600 dark:text-slate-400";
  }
}

function getPaymentIcon(status: Patient["paymentStatus"]) {
  switch (status) {
    case "Paid":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
    case "Pending":
      return <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
    default:
      return <Clock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />;
  }
}

// ─── Patient Card ──────────────────────────────────────────────────────────────

const PatientCard: React.FC<{ patient: Patient }> = ({ patient }) => {
  const navigate = useNavigate();

  const sessionsCompleted = patient.completedSessionsCount ?? patient.sessions.length;
  const sessionsTotal = patient.totalPlannedSessions ?? 6;
  const progressPct = sessionsTotal > 0 ? Math.round((sessionsCompleted / sessionsTotal) * 100) : 0;

  const nextDate = patient.nextInfusionDate ?? patient.confirmedDate;
  const formattedNextDate = nextDate
    ? (() => {
        try {
          const d = new Date(nextDate);
          return isNaN(d.getTime())
            ? nextDate
            : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
        } catch {
          return nextDate;
        }
      })()
    : null;

  return (
    <Card
      onClick={() => navigate(`/departments/carcinome/patients/${patient.id}`)}
      className="cursor-pointer group border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      <CardContent className="p-0">
        {/* Card header stripe */}
        <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors truncate">
              {patient.name}
            </p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              {patient.id} · {patient.phone}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge className={`text-[10px] py-0.5 px-2 ${getStatusColor(patient.onboardingStatus)}`}>
              {patient.onboardingStatus}
            </Badge>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-slate-800 mx-4" />

        {/* Details grid */}
        <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
          <div className="flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 truncate">{patient.assignedDoctor || "—"}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 truncate">{patient.diagnosis || "—"}</span>
          </div>

          {/* Next infusion */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className={formattedNextDate ? "font-semibold text-blue-700 dark:text-blue-400" : "text-slate-400"}>
              {formattedNextDate ? `Next: ${formattedNextDate}` : "No date set"}
            </span>
          </div>

          {/* Payment */}
          <div className="flex items-center gap-1.5">
            {getPaymentIcon(patient.paymentStatus)}
            <span className={`font-medium ${getPaymentColor(patient.paymentStatus)}`}>
              {patient.paymentStatus}
            </span>
          </div>
        </div>

        {/* Session progress bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span>Sessions</span>
            <span className="font-semibold font-mono">
              {sessionsCompleted}/{sessionsTotal}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Stat Badge ────────────────────────────────────────────────────────────────

const StatBadge: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({
  icon, label, value, color,
}) => (
  <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${color}`}>
    <div className="p-1.5 rounded-lg bg-white/60 dark:bg-black/20">{icon}</div>
    <div>
      <p className="text-lg font-bold leading-tight">{value}</p>
      <p className="text-[10px] font-medium opacity-80">{label}</p>
    </div>
  </div>
);

// ─── Main View ─────────────────────────────────────────────────────────────────

export const InternDashboardView: React.FC = () => {
  const { patients, internName } = useCarcinome();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return patients.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.diagnosis.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "all" || p.onboardingStatus === statusFilter;
      const matchesPayment = paymentFilter === "all" || p.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [patients, search, statusFilter, paymentFilter]);

  // Stats
  const activeCount = patients.filter((p) => p.onboardingStatus === "Active").length;
  const pendingPayCount = patients.filter((p) => p.paymentStatus === "Pending" || p.paymentStatus === "Partially Paid").length;
  const nextSessionCount = patients.filter((p) => p.nextInfusionDate || p.confirmedDate).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          My Patients
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {patients.length > 0
            ? `You are managing ${patients.length} patient${patients.length !== 1 ? "s" : ""} assigned to ${internName || "you"}.`
            : `No patients assigned to ${internName || "you"} yet.`}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatBadge
          icon={<Users className="h-4 w-4 text-blue-600" />}
          label="Total Assigned"
          value={patients.length}
          color="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200"
        />
        <StatBadge
          icon={<Activity className="h-4 w-4 text-emerald-600" />}
          label="Active"
          value={activeCount}
          color="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200"
        />
        <StatBadge
          icon={<IndianRupee className="h-4 w-4 text-amber-600" />}
          label="Pending Payment"
          value={pendingPayCount}
          color="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200"
        />
      </div>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="intern-patient-search"
                placeholder="Search patient name, ID, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-xs" id="intern-status-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Treatment completed">Treatment Completed</SelectItem>
                <SelectItem value="No longer with the organisation">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="text-xs" id="intern-payment-filter">
                <SelectValue placeholder="All Payment Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Statuses</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                <SelectItem value="Insurance Processing">Insurance Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patient cards grid */}
      {filtered.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="py-16 text-center text-slate-500">
            {patients.length === 0 ? (
              <div className="space-y-2">
                <Users className="mx-auto h-10 w-10 text-slate-300" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No patients assigned yet</p>
                <p className="text-xs text-slate-400">The pod lead will assign patients to you shortly.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Search className="mx-auto h-10 w-10 text-slate-300" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No matching patients</p>
                <p className="text-xs text-slate-400">Try adjusting your search or filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      )}
    </div>
  );
};
