import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  IndianRupee,
  CheckSquare,
  AlertTriangle,
  Clock,
  Activity,
  UserCheck,
  Plus,
  ArrowUpRight,
  TrendingUp,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCarcinome } from "../context/CarcinomeContext";

function fmtMoney(v: number | null) {
  if (v == null) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);
}

export const OverviewDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { patients, tasks, auditLogs, updateTaskStatus } = useCarcinome();

  const activePatients = patients.filter(
    (p) => p.onboardingStatus === "Active" || p.onboardingStatus === "Treatment completed"
  );

  const pendingPayments = patients.filter((p) => p.paymentStatus !== "Paid");

  const totalPendingAmount = patients
    .flatMap((p) => p.sessions)
    .filter((s) => s.paymentStatus !== "Paid")
    .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  // Helper to check if a date string falls in the current week (Mon-Sun)
  const isCurrentWeek = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return d >= monday && d <= sunday;
  };

  const thisWeekSessions = React.useMemo(() => {
    const list: Array<{
      patientId: string;
      patientName: string;
      doctor: string;
      nurse: string | null;
      date: string;
      status: string;
    }> = [];

    const seenKey = new Set<string>();

    patients.forEach((p) => {
      if (p.nextInfusionDate && isCurrentWeek(p.nextInfusionDate)) {
        const key = `${p.id}-${p.nextInfusionDate}`;
        if (!seenKey.has(key)) {
          seenKey.add(key);
          list.push({
            patientId: p.id,
            patientName: p.name,
            doctor: p.assignedDoctor,
            nurse: p.assignedNurse,
            date: p.nextInfusionDate,
            status: p.infusionStatus,
          });
        }
      }

      p.sessions.forEach((s) => {
        if (s.date && isCurrentWeek(s.date)) {
          const key = `${p.id}-${s.date}`;
          if (!seenKey.has(key)) {
            seenKey.add(key);
            list.push({
              patientId: p.id,
              patientName: p.name,
              doctor: p.assignedDoctor,
              nurse: s.nurse || p.assignedNurse,
              date: s.date,
              status: p.infusionStatus,
            });
          }
        }
      });
    });

    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [patients]);

  const tasksDueToday = tasks.filter((t) => t.status !== "Completed");

  // Alerts calculations
  const missingDischargeSummaries = patients.filter(
    (p) => p.dischargeSummaryStatus === "Not Started" || p.dischargeSummaryStatus === "In Progress"
  );
  const unassignedPatients = patients.filter((p) => !p.allottedIntern);
  const pendingSessionPayments = patients.flatMap((p) =>
    p.sessions
      .filter((s) => s.paymentStatus === "Pending")
      .map((s) => ({ patientName: p.name, patientId: p.id, date: s.date, amount: s.totalAmount }))
  );

  // Intern Workload Calculation
  const internCounts: Record<string, number> = {};
  patients.forEach((p) => {
    const intern = p.allottedIntern || "Unassigned";
    internCounts[intern] = (internCounts[intern] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-slate-900/5 dark:from-blue-950/40 dark:to-slate-900/60 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Operations Command Center
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time status of active patients, infusion schedules, financial tracking & team workload.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate("/departments/carcinome/patients")}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add / Manage Patients
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/departments/carcinome/tasks")}
            className="gap-2 bg-white dark:bg-slate-900"
          >
            <CheckSquare className="h-4 w-4" /> View Tasks ({tasksDueToday.length})
          </Button>
        </div>
      </div>

      {/* Quick KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500">Total Registered</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{patients.length}</div>
          <div className="text-xs text-slate-400 mt-1">All time registry count</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500">Active Patients</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">{activePatients.length}</div>
          <div className="text-xs text-slate-400 mt-1">Currently in treatment or follow-up</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500">Pending Payments</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-300">{pendingPayments.length}</div>
          <div className="text-xs text-slate-400 mt-1">Patients with outstanding balances</div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-sm hover:border-slate-300/80 dark:hover:border-slate-700 transition-all border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Active Patients
            </CardTitle>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {activePatients.length}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{patients.length} Total Registered</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm hover:border-slate-300/80 dark:hover:border-slate-700 transition-all border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Infusions This Week
            </CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
              <Calendar className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {thisWeekSessions.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Scheduled for current week
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm hover:border-slate-300/80 dark:hover:border-slate-700 transition-all border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Pending Payments
            </CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {fmtMoney(totalPendingAmount)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Across {pendingPayments.length} patient accounts
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm hover:border-slate-300/80 dark:hover:border-slate-700 transition-all border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Tasks Needing Attention
            </CardTitle>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <CheckSquare className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {tasksDueToday.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {tasks.filter((t) => t.priority === "High" && t.status !== "Completed").length} High priority
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Schedule & Operational Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Upcoming Schedule & Urgent Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Infusion Schedule */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  This Week's Infusion Sessions
                </CardTitle>
                <CardDescription>Scheduled chemotherapy & treatment rotations for the current week</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 dark:text-blue-400 gap-1"
                onClick={() => navigate("/departments/carcinome/sessions")}
              >
                All Sessions <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              {thisWeekSessions.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  No infusion sessions scheduled for the current week.
                </div>
              ) : (
                <div className="space-y-3">
                  {thisWeekSessions.map((session, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        navigate(`/departments/carcinome/patients/${session.patientId}`);
                      }}
                      className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/20 border border-slate-100 dark:border-slate-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center text-xs">
                          {session.patientName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {session.patientName}{" "}
                            <span className="text-xs text-slate-400 font-normal">({session.patientId})</span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Dr: {session.doctor} • Nurse: {session.nurse || "Unassigned"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border-blue-200">
                          {new Date(session.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Operational Tasks Checklist */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Actionable Operational Tasks
                </CardTitle>
                <CardDescription>Pending items requiring immediate team follow-up</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-indigo-600 dark:text-indigo-400 gap-1"
                onClick={() => navigate("/departments/carcinome/tasks")}
              >
                Task Board <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {tasksDueToday.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={task.status === "Completed"}
                      onChange={(e) =>
                        updateTaskStatus(task.id, e.target.checked ? "Completed" : "Pending")
                      }
                      className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {task.title}
                        </span>
                        <Badge
                          className={
                            task.priority === "High"
                              ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                        <span>Assigned to: <strong className="text-slate-600 dark:text-slate-300">{task.assignee}</strong></span>
                        <span>Due: {task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Operational Alerts & Intern Workload */}
        <div className="space-y-6">
          {/* Operational Alerts Card */}
          <Card className="border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Operational Alerts & Flags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingSessionPayments.length > 0 && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-900/50 text-xs space-y-1">
                  <div className="font-semibold text-amber-800 dark:text-amber-400 flex items-center justify-between">
                    <span>Unpaid Sessions Pending</span>
                    <Badge variant="outline" className="text-amber-700 border-amber-300">
                      {pendingSessionPayments.length} Items
                    </Badge>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Completed infusions awaiting payment collection from patients.
                  </p>
                </div>
              )}

              {missingDischargeSummaries.length > 0 && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-900/50 text-xs space-y-1">
                  <div className="font-semibold text-blue-800 dark:text-blue-400 flex items-center justify-between">
                    <span>Missing Discharge Summaries</span>
                    <Badge variant="outline" className="text-blue-700 border-blue-300">
                      {missingDischargeSummaries.length} Patients
                    </Badge>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Discharge summaries pending uploading or doctor sign-off.
                  </p>
                </div>
              )}

              {unassignedPatients.length > 0 && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-purple-200 dark:border-purple-900/50 text-xs space-y-1">
                  <div className="font-semibold text-purple-800 dark:text-purple-400 flex items-center justify-between">
                    <span>Unassigned Intern Ownership</span>
                    <Badge variant="outline" className="text-purple-700 border-purple-300">
                      {unassignedPatients.length} Patients
                    </Badge>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Patients without an assigned operations intern.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Intern Workload Card */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Intern Team Workload
              </CardTitle>
              <CardDescription>Patient allocation per intern</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(internCounts).map(([intern, count]) => {
                const pct = Math.round((count / patients.length) * 100);
                return (
                  <div key={intern} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-800 dark:text-slate-200">{intern}</span>
                      <span className="text-slate-500">{count} Patients ({pct}%)</span>
                    </div>
                    <Progress value={pct} className="h-2 bg-slate-100 dark:bg-slate-800" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Audit Log Snippets */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                Recent System Activity
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-slate-500 gap-1"
                onClick={() => navigate("/departments/carcinome/audit")}
              >
                Full Log <ArrowUpRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="text-xs space-y-0.5 border-l-2 border-blue-500 pl-2.5 py-0.5">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{log.actor}</span>
                    <span>{log.timestamp.slice(11)}</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">{log.details}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
