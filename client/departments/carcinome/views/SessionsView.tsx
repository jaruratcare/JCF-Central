import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Search, Filter, Plus, IndianRupee, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCarcinome } from "../context/CarcinomeContext";
import type { PaymentStatus } from "../data/dummy-data";

export const SessionsView: React.FC = () => {
  const navigate = useNavigate();
  const { patients, updatePaymentStatus } = useCarcinome();

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const allSessions = useMemo(() => {
    return patients.flatMap((p) =>
      p.sessions.map((s, idx) => ({
        ...s,
        sessionIndex: idx,
        patientId: p.id,
        patientName: p.name,
        doctor: p.assignedDoctor,
      }))
    );
  }, [patients]);

  const filteredSessions = useMemo(() => {
    return allSessions.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        s.patientName.toLowerCase().includes(q) ||
        s.patientId.toLowerCase().includes(q) ||
        (s.nurse && s.nurse.toLowerCase().includes(q)) ||
        (s.supplier && s.supplier.toLowerCase().includes(q));

      const matchesPayment = paymentFilter === "all" || s.paymentStatus === paymentFilter;

      return matchesSearch && matchesPayment;
    });
  }, [allSessions, search, paymentFilter]);

  const sortedSessions = useMemo(() => {
    const sorted = [...filteredSessions];

    const compareText = (a: string | undefined, b: string | undefined) => {
      return String(a || "").localeCompare(String(b || ""), "en-IN", {
        sensitivity: "base",
      });
    };

    sorted.sort((first, second) => {
      let result = 0;
      switch (sortBy) {
        case "patient":
          result = compareText(first.patientName, second.patientName);
          break;
        case "nurse":
          result = compareText(first.nurse, second.nurse);
          break;
        case "supplier":
          result = compareText(first.supplier, second.supplier);
          break;
        case "amount":
          result = (first.totalAmount || 0) - (second.totalAmount || 0);
          break;
        case "payment":
          result = compareText(first.paymentStatus, second.paymentStatus);
          break;
        case "date":
        default:
          result = new Date(first.date).getTime() - new Date(second.date).getTime();
      }
      return sortDirection === "asc" ? result : -result;
    });

    return sorted;
  }, [filteredSessions, sortBy, sortDirection]);

  const totalSessionsCount = allSessions.length;
  const completedPaidCount = allSessions.filter((s) => s.paymentStatus === "Paid").length;
  const pendingCount = allSessions.filter((s) => s.paymentStatus === "Pending").length;
  const insuranceCount = allSessions.filter((s) => s.paymentStatus === "Insurance Processing").length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Infusion Sessions Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete operational log of chemotherapy infusions, nursing visits, and billing status.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Total Infusions Logged</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {totalSessionsCount}
              </div>
            </div>
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-lg">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400">Paid & Settled</div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                {completedPaidCount}
              </div>
            </div>
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-amber-700 dark:text-amber-400">Pending Collection</div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                {pendingCount}
              </div>
            </div>
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 text-[11px]">
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                Pending follow-ups: {pendingCount}
              </Badge>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                Paid settled: {completedPaidCount}
              </Badge>
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                Insurance in review: {insuranceCount}
              </Badge>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Sorted by {sortBy === "date" ? "date" : sortBy} • {sortDirection === "desc" ? "newest first" : "oldest first"}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search session by patient name, nurse or supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="text-xs">
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

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="patient">Patient</SelectItem>
                <SelectItem value="nurse">Nurse</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="payment">Payment Status</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortDirection} onValueChange={(val) => setSortDirection(val as "asc" | "desc") }>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest / Highest</SelectItem>
                <SelectItem value="asc">Oldest / Lowest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Session Date</th>
                <th className="p-3.5">Patient Name</th>
                <th className="p-3.5">Assigned Nurse</th>
                <th className="p-3.5">Pharma Supplier</th>
                <th className="p-3.5">Billed Amount</th>
                <th className="p-3.5">Payment Status</th>
                <th className="p-3.5">Bill / Discharge PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No matching infusion sessions found.
                  </td>
                </tr>
              ) : (
                sortedSessions.map((s, idx) => (
                  <tr
                    key={idx}
                    onClick={() => {
                      navigate(`/departments/carcinome/patients/${s.patientId}`);
                    }}
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors cursor-pointer"
                  >
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">
                      {s.date}
                    </td>
                    <td className="p-3.5 font-medium text-blue-600 dark:text-blue-400">
                      {s.patientName}{" "}
                      <span className="text-[11px] text-slate-400 font-mono">({s.patientId})</span>
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      {s.nurse || "—"} {s.nurseCost ? `(₹${s.nurseCost})` : ""}
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      {s.supplier || "—"} {s.supplierCost ? `(₹${s.supplierCost})` : ""}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">
                      {s.totalAmount ? `₹${s.totalAmount.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={s.paymentStatus || "Pending"}
                        onValueChange={(val: PaymentStatus) =>
                          updatePaymentStatus(s.patientId, val, s.sessionIndex)
                        }
                      >
                        <SelectTrigger className="w-36 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                          <SelectItem value="Insurance Processing">Insurance Processing</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3.5 space-x-1">
                      {s.billGenerated && (
                        <Badge variant="outline" className="text-blue-600 border-blue-300 text-[10px]">
                          Bill Gen
                        </Badge>
                      )}
                      {s.dischargeSummaryPdf && (
                        <Badge variant="outline" className="text-purple-600 border-purple-300 text-[10px]">
                          PDF Attached
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
