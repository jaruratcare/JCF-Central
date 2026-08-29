import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { IndianRupee, Search, Columns, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export const PaymentsView: React.FC = () => {
  const navigate = useNavigate();
  const { patients, updatePaymentStatus, tableColumns, updateTableColumns, setActiveTab } = useCarcinome();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const paymentColumns = tableColumns.payments || [];
  const activeColumns = useMemo(() => getActiveColumns(paymentColumns), [paymentColumns]);

  const paymentRecords = useMemo(() => {
    return patients.flatMap((p) => {
      // If patient has sessions, map each session
      if (p.sessions.length > 0) {
        return p.sessions.map((s, idx) => ({
          id: `${p.id}-S${idx + 1}`,
          patientId: p.id,
          patientName: p.name,
          phone: p.phone,
          doctor: p.assignedDoctor,
          intern: p.allottedIntern,
          date: s.date,
          amount: s.totalAmount || 0,
          paymentStatus: s.paymentStatus || p.paymentStatus,
          billGenerated: s.billGenerated,
          supplier: s.supplier,
          sessionIndex: idx,
        }));
      } else {
        return [
          {
            id: `${p.id}-MAIN`,
            patientId: p.id,
            patientName: p.name,
            phone: p.phone,
            doctor: p.assignedDoctor,
            intern: p.allottedIntern,
            date: p.lastInfusionDate || "—",
            amount: p.costOfInfusion || 0,
            paymentStatus: p.paymentStatus,
            billGenerated: false,
            supplier: p.supplier,
            sessionIndex: undefined,
          },
        ];
      }
    });
  }, [patients]);

  const filteredRecords = useMemo(() => {
    return paymentRecords.filter((rec) => {
      const q = search.toLowerCase();
      const matchesSearch =
        rec.patientName.toLowerCase().includes(q) ||
        rec.patientId.toLowerCase().includes(q) ||
        rec.doctor.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "all" || rec.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [paymentRecords, search, statusFilter]);

  const totalBilledSum = paymentRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalPaidSum = paymentRecords
    .filter((r) => r.paymentStatus === "Paid")
    .reduce((sum, r) => sum + r.amount, 0);
  const totalPendingSum = paymentRecords
    .filter((r) => r.paymentStatus === "Pending")
    .reduce((sum, r) => sum + r.amount, 0);
  const totalInsuranceSum = paymentRecords
    .filter((r) => r.paymentStatus === "Insurance Processing")
    .reduce((sum, r) => sum + r.amount, 0);

  const toggleColumnVisibility = (id: string) => {
    const updated = paymentColumns.map((col) =>
      col.id === id ? { ...col, visible: !col.visible } : col
    );
    updateTableColumns("payments", updated);
  };

  const renderCellContent = (rec: any, colId: string) => {
    switch (colId) {
      case "refId":
        return <span className="font-mono text-[11px] text-slate-500">{rec.id}</span>;

      case "patientInfo":
        return (
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {rec.patientName}{" "}
            <span className="text-[11px] text-slate-400 font-normal">({rec.patientId})</span>
          </span>
        );

      case "doctor":
        return <span className="text-slate-700 dark:text-slate-300">{rec.doctor}</span>;

      case "date":
        return <span className="text-slate-700 dark:text-slate-300">{rec.date}</span>;

      case "amount":
        return (
          <span className="font-bold text-slate-900 dark:text-slate-100">
            ₹{rec.amount.toLocaleString("en-IN")}
          </span>
        );

      case "paymentStatus":
        return (
          <Badge
            className={
              rec.paymentStatus === "Paid"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : rec.paymentStatus === "Pending"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
            }
          >
            {rec.paymentStatus}
          </Badge>
        );

      case "quickUpdate":
        return (
          <div onClick={(e) => e.stopPropagation()} className="text-right">
            <Select
              value={rec.paymentStatus}
              onValueChange={(val: PaymentStatus) =>
                updatePaymentStatus(rec.patientId, val, rec.sessionIndex)
              }
            >
              <SelectTrigger className="w-36 h-7 text-xs ml-auto">
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

      case "intern":
        return <span className="text-slate-700 dark:text-slate-300">{rec.intern || "Unassigned"}</span>;

      case "supplier":
        return <span className="text-slate-700 dark:text-slate-300">{rec.supplier || "—"}</span>;

      case "phone":
        return <span className="font-mono text-slate-600 dark:text-slate-400">{rec.phone || "—"}</span>;

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
            Financial Ledger & Payments
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track patient billing, infusion fees, insurance claims, and outstanding receivables.
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
              {paymentColumns.map((col) => (
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

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500">Total Billed Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              ₹{totalBilledSum.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Collected / Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              ₹{totalPaidSum.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Pending Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              ₹{totalPendingSum.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-900/50 bg-purple-50/20 dark:bg-purple-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-purple-700 dark:text-purple-400">
              Insurance Claims Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              ₹{totalInsuranceSum.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search payments by patient name, ID or doctor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                <SelectItem value="Insurance Processing">Insurance Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                {activeColumns.map((col) => (
                  <th
                    key={col.id}
                    className={`p-3.5 ${col.align === "right" ? "text-right" : ""}`}
                    style={{ minWidth: col.minWidth || "auto" }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={activeColumns.length || 1} className="py-12 text-center text-slate-500">
                    No payment records matching search.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    onClick={() => {
                      navigate(`/departments/carcinome/patients/${rec.patientId}`);
                    }}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors cursor-pointer"
                  >
                    {activeColumns.map((col) => (
                      <td key={col.id} className={`p-3.5 ${col.align === "right" ? "text-right" : ""}`}>
                        {renderCellContent(rec, col.id)}
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
