import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Calendar, IndianRupee } from "lucide-react";
import { useCarcinome } from "../context/CarcinomeContext";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any) => string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-xl text-xs">
        <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1.5">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            const formattedVal = formatter ? formatter(entry.value) : entry.value;
            return (
              <div key={`item-${index}`} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-slate-600 dark:text-slate-400 font-medium">{entry.name}:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formattedVal}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export const ReportsView: React.FC = () => {
  const { patients } = useCarcinome();

  // Monthly Infusions & Financials Breakdown
  const monthlyData = [
    { month: "May '26", sessions: 4, revenue: 22000, collected: 17000, pending: 5000 },
    { month: "Jun '26", sessions: 8, revenue: 48000, collected: 36000, pending: 12000 },
    { month: "Jul '26", sessions: 11, revenue: 64000, collected: 41000, pending: 23000 },
    { month: "Aug '26", sessions: 6, revenue: 38000, collected: 20000, pending: 18000 },
  ];

  // Intern Workload
  const internCounts: Record<string, number> = {};
  patients.forEach((p) => {
    const name = p.allottedIntern || "Unassigned";
    internCounts[name] = (internCounts[name] || 0) + 1;
  });
  const internChartData = Object.entries(internCounts).map(([name, patientsCount]) => ({
    name,
    patientsCount,
  }));

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Carcinome Operations & Performance Analytics
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Operational reporting on infusion volume, revenue collection efficiency, and intern workload.
        </p>
      </div>

      {/* Grid 1: Infusion Volume & Financial Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Infusion Sessions Bar Chart */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" /> Monthly Infusion Volume
            </CardTitle>
            <CardDescription>Number of home chemotherapy & care sessions completed</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: "rgba(59, 130, 246, 0.08)" }} content={<CustomTooltip />} />
                <Bar dataKey="sessions" fill="#2563eb" radius={[4, 4, 0, 0]} name="Sessions Volume" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Collections vs Pending */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-emerald-600" /> Revenue & Collections (₹)
            </CardTitle>
            <CardDescription>Collected fee vs pending receivables by month</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
                  content={<CustomTooltip formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`} />}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="collected" fill="#10b981" stackId="a" name="Collected Revenue" />
                <Bar dataKey="pending" fill="#f59e0b" stackId="a" name="Pending Receivables" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Grid 2: Intern Workload */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" /> Intern Patient Workload
          </CardTitle>
          <CardDescription>Patient coordination count assigned per intern</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={internChartData}
              margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ fill: "rgba(99, 102, 241, 0.08)" }} content={<CustomTooltip />} />
              <Bar dataKey="patientsCount" fill="#6366f1" radius={[0, 4, 4, 0]} name="Assigned Patients" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
