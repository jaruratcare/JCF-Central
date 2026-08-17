import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Search, Columns, CheckCircle2, Clock, SlidersHorizontal, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCarcinome } from "../context/CarcinomeContext";
import { getActiveColumns } from "../data/table-columns";
import type { PaymentStatus } from "../data/dummy-data";

export const SessionsView: React.FC = () => {
  const navigate = useNavigate();
  const { patients, updatePaymentStatus, deleteSession, tableColumns, updateTableColumns, setActiveTab } = useCarcinome();

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sessionColumns = tableColumns.sessions || [];
  const activeColumns = useMemo(() => getActiveColumns(sessionColumns), [sessionColumns]);

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

  const toggleColumnVisibility = (id: string) => {
    const updated = sessionColumns.map((col) =>
      col.id === id ? { ...col, visible: !col.visible } : col
    );
    updateTableColumns("sessions", updated);
  };

  const renderCellContent = (s: any, colId: string) => {
    switch (colId) {
      case "date":
        return <span className="font-semibold text-slate-900 dark:text-slate-100">{s.date}</span>;

      case "patientInfo":
        return (
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {s.patientName}{" "}
            <span className="text-[11px] text-slate-400 font-mono">({s.patientId})</span>
          </span>
        );

      case "nurse":
        return (
          <span className="text-slate-700 dark:text-slate-300">
            {s.nurse || "—"} {s.nurseCost ? `(₹${s.nurseCost})` : ""}
          </span>
        );

      case "supplier":
        return (
          <span className="text-slate-700 dark:text-slate-300">
            {s.supplier || "—"} {s.supplierCost ? `(₹${s.supplierCost})` : ""}
          </span>
        );

      case "amount":
        return (
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {s.totalAmount ? `₹${s.totalAmount.toLocaleString("en-IN")}` : "—"}
          </span>
        );

      case "paymentStatus":
        return (
          <div onClick={(e) => e.stopPropagation()}>
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
          </div>
        );

      case "pdf":
        return (
          <div className="space-x-1">
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
            {!s.billGenerated && !s.dischargeSummaryPdf && <span className="text-slate-400">—</span>}
          </div>
        );

      case "doctor":
        return <span className="text-slate-700 dark:text-slate-300">{s.doctor || "—"}</span>;

      case "cycle":
        return (
          <Badge variant="secondary" className="font-mono text-xs">
            Cycle #{s.sessionIndex + 1}
          </Badge>
        );

      case "notes":
        return <span className="text-slate-600 dark:text-slate-400">{s.notes || "—"}</span>;

      case "actions":
        return (
          <div className="text-right" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => deleteSession(s.patientId, s.sessionIndex)}
              title="Delete session"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );

      default:
        return <span className="text-slate-500">—</span>;
    }
  };

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
        <div className="flex items-center gap-2">
          {/* Columns Quick Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-200 dark:border-slate-800">
                <Columns className="h-3.5 w-3.5" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 text-xs">
              <DropdownMenuLabel className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Visible Columns ({activeColumns.length})
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sessionColumns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.visible}
                  onCheckedChange={() => toggleColumnVisibility(col.id)}
                  className="text-xs"
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setActiveTab("masterdata")}
                className="text-blue-600 dark:text-blue-400 font-medium text-xs gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Rearrange in Master Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                {activeColumns.map((col) => (
                  <th
                    key={col.id}
                    className="p-3.5"
                    style={{ minWidth: col.minWidth || "auto" }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedSessions.length === 0 ? (
                <tr>
                  <td colSpan={activeColumns.length || 1} className="py-12 text-center text-slate-500">
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
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors cursor-pointer"
                  >
                    {activeColumns.map((col) => (
                      <td key={col.id} className="p-3.5">
                        {renderCellContent(s, col.id)}
                      </td>
                    ))}
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
