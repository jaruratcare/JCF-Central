import React, { useState, useMemo, useCallback } from "react";
import {
  IndianRupee,
  Receipt,
  Users,
  Stethoscope,
  Package,
  Search,
  Plus,
  Trash2,
  ChevronDown,
  Pencil,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCarcinome } from "../context/CarcinomeContext";

// ─── Billing Data Types ────────────────────────────────────────────────────────

interface BillingRound {
  round: number;
  service: string;
  infusionDate: string;
  fixedCharges: number;
  consumable: number;
  nursing: number;
  carcinomeProfit: number;
  totalCharges: number;
  totalReceived: number;
  balance: number;
  paymentStatus: "Paid" | "Pending" | "Partial";
}

interface PatientBill {
  patientId: string;
  patientName: string;
  patientPhone: string;
  notes: string;
  rounds: BillingRound[];
}

interface NursingCharge {
  id: string;
  patientId: string;
  patientName: string;
  round: number;
  nurseName: string;
  chargeType: "Fixed Package" | "Hourly";
  shiftsHrs: number;
  ratePerHr: number;
  fixedAmount: number;
  amountBilledToPatient: number;
  amountPaidToNurse: number;
  billingPeriod: string;
}

interface NursingRate {
  id: string;
  service: string;
  rate: number;
  notes: string;
}

interface ConsumableItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  mrp: number;
  landingPrice: number;
  margin: number;
  marginPercent: number;
}

interface ConsumableUsage {
  id: string;
  patientId: string;
  patientName: string;
  dates: string;
  round: number;
  mrpTotal: number;
  landingTotal: number;
  margin: number;
}

interface NursePayment {
  id: string;
  nurseName: string;
  billingPeriod: string;
  billIdsCovered: string;
  totalAmountDue: number;
  amountPaid: number;
  balance: number;
  paymentStatus: "Paid" | "Pending" | "Partial" | "No Charges";
  paymentDate: string | null;
}

type BillingTab = "summary" | "patient-bills" | "nursing" | "consumables" | "nurse-payments";

function fmtMoney(v: number | null | undefined): string {
  if (v == null) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);
}

let idCounter = Date.now();
function genId(prefix: string) {
  return `${prefix}-${(++idCounter).toString(36)}`;
}

// Custom styled input helper for crisp borders
const FormInput = (props: React.ComponentProps<typeof Input>) => (
  <Input
    {...props}
    className={`border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md px-3 py-2 text-xs shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${props.className || ""}`}
  />
);

// ─── Inline Editable Cell ──────────────────────────────────────────────────────

const EditableCell: React.FC<{
  value: string | number;
  type?: "text" | "number";
  onSave: (val: string) => void;
  className?: string;
}> = ({ value, type = "text", onSave, className = "" }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    setEditing(false);
    if (draft !== String(value)) onSave(draft);
  };

  if (editing) {
    return (
      <Input
        autoFocus
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(String(value)); setEditing(false); }
        }}
        className="h-7 text-xs px-2 border border-blue-500 rounded bg-white dark:bg-slate-900 shadow-sm"
      />
    );
  }

  return (
    <span
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      className={`cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-900/10 hover:outline hover:outline-1 hover:outline-blue-300 px-1.5 py-0.5 rounded transition-all ${className}`}
      title="Click to quick-edit"
    >
      {type === "number" ? fmtMoney(Number(value)) : value || "—"}
    </span>
  );
};

// ─── Summary Tab ───────────────────────────────────────────────────────────────

const BillingSummaryTab: React.FC<{
  bills: PatientBill[];
  nursingCharges: NursingCharge[];
  consumableUsages: ConsumableUsage[];
  nursePayments: NursePayment[];
}> = ({ bills, nursingCharges, consumableUsages, nursePayments }) => {
  const totalBilled = bills.reduce((s, b) => s + b.rounds.reduce((rs, r) => rs + r.totalCharges, 0), 0);
  const totalReceived = bills.reduce((s, b) => s + b.rounds.reduce((rs, r) => rs + r.totalReceived, 0), 0);
  const totalBalance = totalBilled - totalReceived;
  const totalNursingBilled = nursingCharges.reduce((s, nc) => s + nc.amountBilledToPatient, 0);
  const totalNursingPaid = nursingCharges.reduce((s, nc) => s + nc.amountPaidToNurse, 0);
  const nursingMargin = totalNursingBilled - totalNursingPaid;
  const totalConsumableMRP = consumableUsages.reduce((s, cu) => s + cu.mrpTotal, 0);
  const totalConsumableLanding = consumableUsages.reduce((s, cu) => s + cu.landingTotal, 0);
  const consumableMargin = totalConsumableMRP - totalConsumableLanding;
  const totalCarcinomeProfit = bills.reduce(
    (s, b) => s + b.rounds.reduce((rs, r) => rs + r.carcinomeProfit, 0), 0
  ) + nursingMargin + consumableMargin;
  const totalOwedToNurses = nursePayments.reduce((s, np) => s + np.totalAmountDue, 0);
  const totalPaidToNurses = nursePayments.reduce((s, np) => s + np.amountPaid, 0);
  const nursePendingBalance = totalOwedToNurses - totalPaidToNurses;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Patients & Billing</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Total Patients</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{bills.length}</div>
                </div>
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg"><Users className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Total Billed</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{fmtMoney(totalBilled)}</div>
                </div>
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg"><Receipt className="h-5 w-5 text-slate-600 dark:text-slate-400" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-400">Total Received</div>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{fmtMoney(totalReceived)}</div>
                </div>
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg"><IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200/70 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-amber-700 dark:text-amber-400">Total Balance Due</div>
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{fmtMoney(totalBalance)}</div>
                </div>
                <div className="p-2.5 bg-amber-100 dark:bg-amber-950/40 rounded-lg"><IndianRupee className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Profit & Margin Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-blue-200/60 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-950/10">
            <CardContent className="p-4">
              <div className="text-xs text-blue-700 dark:text-blue-400">Total Carcinome Profit</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{fmtMoney(totalCarcinomeProfit)}</div>
              <div className="text-[11px] text-blue-500 dark:text-blue-400/70 mt-1">Fixed + Nursing + Consumable margins</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="text-xs text-slate-500">Nursing Margin</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{fmtMoney(nursingMargin)}</div>
              <div className="text-[11px] text-slate-400 mt-1">Billed {fmtMoney(totalNursingBilled)} – Paid {fmtMoney(totalNursingPaid)}</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="text-xs text-slate-500">Consumable Margin</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{fmtMoney(consumableMargin)}</div>
              <div className="text-[11px] text-slate-400 mt-1">MRP {fmtMoney(totalConsumableMRP)} – Landing {fmtMoney(totalConsumableLanding)}</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="text-xs text-slate-500">Nurse Payments Pending</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{fmtMoney(nursePendingBalance)}</div>
              <div className="text-[11px] text-slate-400 mt-1">Owed {fmtMoney(totalOwedToNurses)} – Paid {fmtMoney(totalPaidToNurses)}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── Patient Bills Tab (Auto-syncs with patients database) ───────────────────

const PatientBillsTab: React.FC<{ bills: PatientBill[] }> = ({ bills }) => {
  const [search, setSearch] = useState("");
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bills.filter((b) => b.patientName.toLowerCase().includes(q) || b.patientId.toLowerCase().includes(q));
  }, [bills, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <FormInput
            placeholder="Search by patient name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-[11px] text-slate-400 italic">Auto-syncs with live patient sessions</p>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No patient bills found.</div>
        ) : (
          filtered.map((bill) => {
            const isExpanded = expandedPatient === bill.patientId;
            const totalBilled = bill.rounds.reduce((s, r) => s + r.totalCharges, 0);
            const totalReceived = bill.rounds.reduce((s, r) => s + r.totalReceived, 0);
            const totalBalance = totalBilled - totalReceived;

            return (
              <Card key={bill.patientId} className="border-slate-200 dark:border-slate-800 overflow-hidden">
                <button
                  onClick={() => setExpandedPatient(isExpanded ? null : bill.patientId)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center text-xs">
                      {bill.patientName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {bill.patientName} <span className="text-[11px] text-slate-400 font-normal">({bill.patientId})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{bill.rounds.length} round{bill.rounds.length !== 1 ? "s" : ""} • {bill.patientPhone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-slate-500">Total / Received / Balance</div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {fmtMoney(totalBilled)} <span className="text-emerald-600">/ {fmtMoney(totalReceived)}</span>{" "}
                        <span className={totalBalance > 0 ? "text-amber-600" : "text-slate-400"}>/ {fmtMoney(totalBalance)}</span>
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                          <tr>
                            <th className="p-3">Round</th><th className="p-3">Date</th><th className="p-3">Fixed (₹)</th>
                            <th className="p-3">Consumable (₹)</th><th className="p-3">Nursing (₹)</th><th className="p-3">Total (₹)</th>
                            <th className="p-3">Received (₹)</th><th className="p-3">Balance (₹)</th><th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {bill.rounds.map((round, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors">
                              <td className="p-3 font-mono font-semibold text-slate-700 dark:text-slate-300">R{round.round}</td>
                              <td className="p-3 text-slate-700 dark:text-slate-300">{round.infusionDate || "—"}</td>
                              <td className="p-3 text-slate-700 dark:text-slate-300">{fmtMoney(round.fixedCharges)}</td>
                              <td className="p-3 text-slate-700 dark:text-slate-300">{fmtMoney(round.consumable)}</td>
                              <td className="p-3 text-slate-700 dark:text-slate-300">{fmtMoney(round.nursing)}</td>
                              <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{fmtMoney(round.totalCharges)}</td>
                              <td className="p-3 text-emerald-700 dark:text-emerald-400">{fmtMoney(round.totalReceived)}</td>
                              <td className={`p-3 font-semibold ${round.balance > 0 ? "text-amber-700 dark:text-amber-400" : "text-slate-400"}`}>{fmtMoney(round.balance)}</td>
                              <td className="p-3">
                                <Badge className={
                                  round.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : round.paymentStatus === "Partial" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                }>{round.paymentStatus}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─── Nursing Tab (Rate Card & Charges Log with explicit Add & Edit Modals) ────

const NursingTab: React.FC<{
  nursingCharges: NursingCharge[];
  nursingRates: NursingRate[];
  patients: any[];
  onUpdateRate: (id: string, updates: Partial<NursingRate>) => void;
  onAddRate: (rate: Omit<NursingRate, "id">) => void;
  onDeleteRate: (id: string) => void;
  onAddCharge: (charge: Omit<NursingCharge, "id">) => void;
  onUpdateCharge: (id: string, updates: Partial<NursingCharge>) => void;
  onDeleteCharge: (id: string) => void;
}> = ({ nursingCharges, nursingRates, patients, onUpdateRate, onAddRate, onDeleteRate, onAddCharge, onUpdateCharge, onDeleteCharge }) => {
  const [search, setSearch] = useState("");

  // Rate Modals State
  const [addRateOpen, setAddRateOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<NursingRate | null>(null);
  const [rateForm, setRateForm] = useState({ service: "", rate: 0, notes: "" });

  // Charge Modals State
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<NursingCharge | null>(null);
  const [chargeForm, setChargeForm] = useState<Omit<NursingCharge, "id">>({
    patientId: "", patientName: "", round: 1, nurseName: "", chargeType: "Hourly",
    shiftsHrs: 1, ratePerHr: 0, fixedAmount: 0, amountBilledToPatient: 0, amountPaidToNurse: 0, billingPeriod: "",
  });

  const filteredCharges = useMemo(() => {
    const q = search.toLowerCase();
    return nursingCharges.filter((nc) =>
      nc.patientName.toLowerCase().includes(q) || nc.patientId.toLowerCase().includes(q) || nc.nurseName.toLowerCase().includes(q)
    );
  }, [nursingCharges, search]);

  // Rate Handlers
  const handleOpenAddRate = () => {
    setRateForm({ service: "", rate: 0, notes: "" });
    setAddRateOpen(true);
  };

  const handleOpenEditRate = (rate: NursingRate) => {
    setEditingRate(rate);
    setRateForm({ service: rate.service, rate: rate.rate, notes: rate.notes });
  };

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateForm.service.trim()) return;

    if (editingRate) {
      onUpdateRate(editingRate.id, rateForm);
      setEditingRate(null);
    } else {
      onAddRate(rateForm);
      setAddRateOpen(false);
    }
  };

  // Charge Handlers
  const handleOpenAddCharge = () => {
    setChargeForm({
      patientId: "", patientName: "", round: 1, nurseName: "", chargeType: "Hourly",
      shiftsHrs: 1, ratePerHr: 0, fixedAmount: 0, amountBilledToPatient: 0, amountPaidToNurse: 0, billingPeriod: "",
    });
    setAddChargeOpen(true);
  };

  const handleOpenEditCharge = (charge: NursingCharge) => {
    setEditingCharge(charge);
    setChargeForm({
      patientId: charge.patientId,
      patientName: charge.patientName,
      round: charge.round,
      nurseName: charge.nurseName,
      chargeType: charge.chargeType,
      shiftsHrs: charge.shiftsHrs,
      ratePerHr: charge.ratePerHr,
      fixedAmount: charge.fixedAmount,
      amountBilledToPatient: charge.amountBilledToPatient,
      amountPaidToNurse: charge.amountPaidToNurse,
      billingPeriod: charge.billingPeriod,
    });
  };

  const handleSaveCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeForm.patientId || !chargeForm.nurseName) return;

    const billed = chargeForm.chargeType === "Fixed Package"
      ? chargeForm.fixedAmount
      : chargeForm.shiftsHrs * chargeForm.ratePerHr;

    const payload = { ...chargeForm, amountBilledToPatient: billed };

    if (editingCharge) {
      onUpdateCharge(editingCharge.id, payload);
      setEditingCharge(null);
    } else {
      onAddCharge(payload);
      setAddChargeOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Rate Card */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />Nursing Rate Card
            </CardTitle>
            <CardDescription>View, edit existing rates, or add new pricing standard options</CardDescription>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm" onClick={handleOpenAddRate}>
            <Plus className="h-3.5 w-3.5" /> Add Rate
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider">
                <tr><th className="p-2.5">Service</th><th className="p-2.5">Rate (₹)</th><th className="p-2.5">Notes</th><th className="p-2.5 w-20 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {nursingRates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-2.5">
                      <EditableCell value={rate.service} onSave={(v) => onUpdateRate(rate.id, { service: v })} className="font-medium text-slate-900 dark:text-slate-100" />
                    </td>
                    <td className="p-2.5">
                      <EditableCell value={rate.rate} type="number" onSave={(v) => onUpdateRate(rate.id, { rate: Number(v) || 0 })} className="font-semibold text-slate-900 dark:text-slate-100" />
                    </td>
                    <td className="p-2.5">
                      <EditableCell value={rate.notes} onSave={(v) => onUpdateRate(rate.id, { notes: v })} className="text-slate-500" />
                    </td>
                    <td className="p-2.5 text-right space-x-1">
                      <button onClick={() => handleOpenEditRate(rate)} title="Edit Rate" className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/10 text-slate-400 hover:text-blue-600 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => onDeleteRate(rate.id)} title="Delete Rate" className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Rate Dialog */}
      <Dialog open={addRateOpen || editingRate !== null} onOpenChange={(open) => { if (!open) { setAddRateOpen(false); setEditingRate(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{editingRate ? "Edit Nursing Rate" : "Add Nursing Rate"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveRate} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Service Name</Label>
              <FormInput value={rateForm.service} onChange={(e) => setRateForm((p) => ({ ...p, service: e.target.value }))} placeholder="e.g. 24-hr Nursing Package" />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Rate (₹)</Label>
              <FormInput type="number" value={rateForm.rate || ""} onChange={(e) => setRateForm((p) => ({ ...p, rate: Number(e.target.value) || 0 }))} placeholder="3500" />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Notes / Description</Label>
              <FormInput value={rateForm.notes} onChange={(e) => setRateForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Flat per day, assumption..." />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => { setAddRateOpen(false); setEditingRate(null); }}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">{editingRate ? "Save Changes" : "Add Rate"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Nursing Charges Log */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Nursing Charges Log</CardTitle>
            <CardDescription>Click cells to quick-edit, or use the Edit icon to update full charge entries</CardDescription>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm" onClick={handleOpenAddCharge}>
            <Plus className="h-3.5 w-3.5" /> Add Charge Log
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <FormInput placeholder="Search by patient, nurse..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">Patient ID</th><th className="p-2.5">Patient</th><th className="p-2.5">Round</th>
                  <th className="p-2.5">Nurse</th><th className="p-2.5">Type</th><th className="p-2.5">Shifts/Hrs</th>
                  <th className="p-2.5">Rate/Hr</th><th className="p-2.5">Billed (₹)</th><th className="p-2.5">Paid to Nurse (₹)</th>
                  <th className="p-2.5">Period</th><th className="p-2.5 w-20 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCharges.length === 0 ? (
                  <tr><td colSpan={11} className="py-8 text-center text-slate-500">No nursing charges found.</td></tr>
                ) : (
                  filteredCharges.map((nc) => (
                    <tr key={nc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-2.5 font-mono text-slate-500">{nc.patientId}</td>
                      <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">{nc.patientName}</td>
                      <td className="p-2.5"><EditableCell value={nc.round} type="number" onSave={(v) => onUpdateCharge(nc.id, { round: Number(v) || 1 })} className="text-slate-700 dark:text-slate-300" /></td>
                      <td className="p-2.5"><EditableCell value={nc.nurseName} onSave={(v) => onUpdateCharge(nc.id, { nurseName: v })} className="text-slate-700 dark:text-slate-300" /></td>
                      <td className="p-2.5">
                        <Badge className={nc.chargeType === "Fixed Package" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"}>
                          {nc.chargeType}
                        </Badge>
                      </td>
                      <td className="p-2.5"><EditableCell value={nc.shiftsHrs} type="number" onSave={(v) => onUpdateCharge(nc.id, { shiftsHrs: Number(v) || 0 })} className="text-slate-700 dark:text-slate-300" /></td>
                      <td className="p-2.5"><EditableCell value={nc.ratePerHr} type="number" onSave={(v) => onUpdateCharge(nc.id, { ratePerHr: Number(v) || 0 })} className="text-slate-700 dark:text-slate-300" /></td>
                      <td className="p-2.5"><EditableCell value={nc.amountBilledToPatient} type="number" onSave={(v) => onUpdateCharge(nc.id, { amountBilledToPatient: Number(v) || 0 })} className="font-semibold text-slate-900 dark:text-slate-100" /></td>
                      <td className="p-2.5"><EditableCell value={nc.amountPaidToNurse} type="number" onSave={(v) => onUpdateCharge(nc.id, { amountPaidToNurse: Number(v) || 0 })} className="text-slate-700 dark:text-slate-300" /></td>
                      <td className="p-2.5"><EditableCell value={nc.billingPeriod} onSave={(v) => onUpdateCharge(nc.id, { billingPeriod: v })} className="text-slate-500" /></td>
                      <td className="p-2.5 text-right space-x-1">
                        <button onClick={() => handleOpenEditCharge(nc)} title="Edit Charge" className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/10 text-slate-400 hover:text-blue-600 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => onDeleteCharge(nc.id)} title="Delete Charge" className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Charge Dialog */}
      <Dialog open={addChargeOpen || editingCharge !== null} onOpenChange={(open) => { if (!open) { setAddChargeOpen(false); setEditingCharge(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{editingCharge ? "Edit Nursing Charge" : "Add Nursing Charge Log"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCharge} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Patient</Label>
                <Select
                  value={chargeForm.patientId}
                  onValueChange={(v) => {
                    const p = patients.find((pt: any) => pt.id === v);
                    setChargeForm((prev) => ({ ...prev, patientId: v, patientName: p?.name || "" }));
                  }}
                >
                  <SelectTrigger className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs rounded-md shadow-sm h-9">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Round</Label>
                <FormInput type="number" value={chargeForm.round} onChange={(e) => setChargeForm((p) => ({ ...p, round: Number(e.target.value) || 1 }))} />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Nurse Name</Label>
                <FormInput value={chargeForm.nurseName} onChange={(e) => setChargeForm((p) => ({ ...p, nurseName: e.target.value }))} placeholder="Nurse Kavitha" />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Charge Type</Label>
                <Select
                  value={chargeForm.chargeType}
                  onValueChange={(v: "Fixed Package" | "Hourly") => setChargeForm((p) => ({ ...p, chargeType: v }))}
                >
                  <SelectTrigger className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs rounded-md shadow-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hourly">Hourly</SelectItem>
                    <SelectItem value="Fixed Package">Fixed Package</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {chargeForm.chargeType === "Hourly" ? (
                <>
                  <div>
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Shifts / Hours</Label>
                    <FormInput type="number" value={chargeForm.shiftsHrs || ""} onChange={(e) => setChargeForm((p) => ({ ...p, shiftsHrs: Number(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Rate / Hr (₹)</Label>
                    <FormInput type="number" value={chargeForm.ratePerHr || ""} onChange={(e) => setChargeForm((p) => ({ ...p, ratePerHr: Number(e.target.value) || 0 }))} />
                  </div>
                </>
              ) : (
                <div>
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Fixed Package Amount (₹)</Label>
                  <FormInput type="number" value={chargeForm.fixedAmount || ""} onChange={(e) => setChargeForm((p) => ({ ...p, fixedAmount: Number(e.target.value) || 0 }))} />
                </div>
              )}
              <div>
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Amount Paid to Nurse (₹)</Label>
                <FormInput type="number" value={chargeForm.amountPaidToNurse || ""} onChange={(e) => setChargeForm((p) => ({ ...p, amountPaidToNurse: Number(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Billing Period</Label>
                <FormInput value={chargeForm.billingPeriod} onChange={(e) => setChargeForm((p) => ({ ...p, billingPeriod: e.target.value }))} placeholder="e.g. Jul-2026" />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => { setAddChargeOpen(false); setEditingCharge(null); }}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">{editingCharge ? "Save Changes" : "Add Charge Log"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Consumables Tab (Master & Usage with explicit Add & Edit Modals) ────────

const ConsumablesTab: React.FC<{
  consumables: ConsumableItem[];
  usages: ConsumableUsage[];
  patients: any[];
  onUpdateItem: (id: string, updates: Partial<ConsumableItem>) => void;
  onAddItem: (item: Omit<ConsumableItem, "id" | "margin" | "marginPercent">) => void;
  onDeleteItem: (id: string) => void;
  onAddUsage: (usage: Omit<ConsumableUsage, "id" | "margin">) => void;
  onUpdateUsage: (id: string, updates: Partial<ConsumableUsage>) => void;
  onDeleteUsage: (id: string) => void;
}> = ({ consumables, usages, patients, onUpdateItem, onAddItem, onDeleteItem, onAddUsage, onUpdateUsage, onDeleteUsage }) => {
  const [search, setSearch] = useState("");

  // Master Item Modals State
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ConsumableItem | null>(null);
  const [itemForm, setItemForm] = useState({ itemCode: "", itemName: "", category: "Consumable", mrp: 0, landingPrice: 0 });

  // Usage Log Modals State
  const [addUsageOpen, setAddUsageOpen] = useState(false);
  const [editingUsage, setEditingUsage] = useState<ConsumableUsage | null>(null);
  const [usageForm, setUsageForm] = useState<Omit<ConsumableUsage, "id" | "margin">>({
    patientId: "", patientName: "", dates: "", round: 1, mrpTotal: 0, landingTotal: 0,
  });

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return consumables.filter((c) => c.itemName.toLowerCase().includes(q) || c.itemCode.toLowerCase().includes(q));
  }, [consumables, search]);

  // Master Handlers
  const handleOpenAddItem = () => {
    setItemForm({ itemCode: "", itemName: "", category: "Consumable", mrp: 0, landingPrice: 0 });
    setAddItemOpen(true);
  };

  const handleOpenEditItem = (item: ConsumableItem) => {
    setEditingItem(item);
    setItemForm({
      itemCode: item.itemCode,
      itemName: item.itemName,
      category: item.category,
      mrp: item.mrp,
      landingPrice: item.landingPrice,
    });
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.itemName.trim()) return;

    const margin = itemForm.mrp - itemForm.landingPrice;
    const marginPercent = itemForm.mrp ? (margin / itemForm.mrp) * 100 : 0;
    const payload = { ...itemForm, margin, marginPercent };

    if (editingItem) {
      onUpdateItem(editingItem.id, payload);
      setEditingItem(null);
    } else {
      onAddItem(itemForm);
      setAddItemOpen(false);
    }
  };

  // Usage Handlers
  const handleOpenAddUsage = () => {
    setUsageForm({ patientId: "", patientName: "", dates: "", round: 1, mrpTotal: 0, landingTotal: 0 });
    setAddUsageOpen(true);
  };

  const handleOpenEditUsage = (usage: ConsumableUsage) => {
    setEditingUsage(usage);
    setUsageForm({
      patientId: usage.patientId,
      patientName: usage.patientName,
      dates: usage.dates,
      round: usage.round,
      mrpTotal: usage.mrpTotal,
      landingTotal: usage.landingTotal,
    });
  };

  const handleSaveUsage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usageForm.patientId) return;

    const margin = usageForm.mrpTotal - usageForm.landingTotal;
    const payload = { ...usageForm, margin };

    if (editingUsage) {
      onUpdateUsage(editingUsage.id, payload);
      setEditingUsage(null);
    } else {
      onAddUsage(usageForm);
      setAddUsageOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Master Price List */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />Consumables Master (Price List)
            </CardTitle>
            <CardDescription>Manage consumables inventory prices, MRP, landing costs, and margins</CardDescription>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm" onClick={handleOpenAddItem}>
            <Plus className="h-3.5 w-3.5" /> Add Consumable Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <FormInput placeholder="Search by item name or code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">Code</th><th className="p-2.5">Item Name</th><th className="p-2.5">Category</th>
                  <th className="p-2.5">MRP (₹)</th><th className="p-2.5">Landing (₹)</th><th className="p-2.5">Margin (₹)</th>
                  <th className="p-2.5">Margin %</th><th className="p-2.5 w-20 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-2.5"><EditableCell value={item.itemCode} onSave={(v) => onUpdateItem(item.id, { itemCode: v })} className="font-mono text-slate-500" /></td>
                    <td className="p-2.5"><EditableCell value={item.itemName} onSave={(v) => onUpdateItem(item.id, { itemName: v })} className="font-medium text-slate-900 dark:text-slate-100" /></td>
                    <td className="p-2.5"><EditableCell value={item.category} onSave={(v) => onUpdateItem(item.id, { category: v })} className="text-slate-500" /></td>
                    <td className="p-2.5"><EditableCell value={item.mrp} type="number" onSave={(v) => { const mrp = Number(v) || 0; onUpdateItem(item.id, { mrp, margin: mrp - item.landingPrice, marginPercent: mrp ? ((mrp - item.landingPrice) / mrp) * 100 : 0 }); }} className="font-semibold text-slate-900 dark:text-slate-100" /></td>
                    <td className="p-2.5"><EditableCell value={item.landingPrice} type="number" onSave={(v) => { const lp = Number(v) || 0; onUpdateItem(item.id, { landingPrice: lp, margin: item.mrp - lp, marginPercent: item.mrp ? ((item.mrp - lp) / item.mrp) * 100 : 0 }); }} className="text-slate-700 dark:text-slate-300" /></td>
                    <td className="p-2.5 text-emerald-700 dark:text-emerald-400 font-semibold">{fmtMoney(item.margin)}</td>
                    <td className="p-2.5 text-emerald-700 dark:text-emerald-400">{item.marginPercent.toFixed(1)}%</td>
                    <td className="p-2.5 text-right space-x-1">
                      <button onClick={() => handleOpenEditItem(item)} title="Edit Consumable" className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/10 text-slate-400 hover:text-blue-600 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => onDeleteItem(item.id)} title="Delete Consumable" className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Item Dialog */}
      <Dialog open={addItemOpen || editingItem !== null} onOpenChange={(open) => { if (!open) { setAddItemOpen(false); setEditingItem(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{editingItem ? "Edit Consumable Item" : "Add Consumable Item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Item Code</Label>
              <FormInput value={itemForm.itemCode} onChange={(e) => setItemForm((p) => ({ ...p, itemCode: e.target.value }))} placeholder="e.g. CON-004" />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Item Name</Label>
              <FormInput value={itemForm.itemName} onChange={(e) => setItemForm((p) => ({ ...p, itemName: e.target.value }))} placeholder="e.g. Sterile Gauze Pack" />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Category</Label>
              <FormInput value={itemForm.category} onChange={(e) => setItemForm((p) => ({ ...p, category: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">MRP (₹)</Label>
                <FormInput type="number" value={itemForm.mrp || ""} onChange={(e) => setItemForm((p) => ({ ...p, mrp: Number(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Landing Price (₹)</Label>
                <FormInput type="number" value={itemForm.landingPrice || ""} onChange={(e) => setItemForm((p) => ({ ...p, landingPrice: Number(e.target.value) || 0 }))} />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => { setAddItemOpen(false); setEditingItem(null); }}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">{editingItem ? "Save Changes" : "Add Item"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Consumable Usage Log */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Consumable Usage Log</CardTitle>
            <CardDescription>Per-patient per-round consumable totals and landing costs</CardDescription>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm" onClick={handleOpenAddUsage}>
            <Plus className="h-3.5 w-3.5" /> Add Usage Log
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">Patient ID</th><th className="p-2.5">Patient</th><th className="p-2.5">Round</th>
                  <th className="p-2.5">MRP Total (₹)</th><th className="p-2.5">Landing Total (₹)</th><th className="p-2.5">Margin (₹)</th>
                  <th className="p-2.5 w-20 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {usages.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-500">No usage records yet.</td></tr>
                ) : (
                  usages.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-2.5 font-mono text-slate-500">{u.patientId}</td>
                      <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">{u.patientName}</td>
                      <td className="p-2.5"><EditableCell value={u.round} type="number" onSave={(v) => onUpdateUsage(u.id, { round: Number(v) || 1 })} className="text-slate-700 dark:text-slate-300" /></td>
                      <td className="p-2.5"><EditableCell value={u.mrpTotal} type="number" onSave={(v) => { const mrp = Number(v) || 0; onUpdateUsage(u.id, { mrpTotal: mrp, margin: mrp - u.landingTotal }); }} className="font-semibold text-slate-900 dark:text-slate-100" /></td>
                      <td className="p-2.5"><EditableCell value={u.landingTotal} type="number" onSave={(v) => { const lp = Number(v) || 0; onUpdateUsage(u.id, { landingTotal: lp, margin: u.mrpTotal - lp }); }} className="text-slate-700 dark:text-slate-300" /></td>
                      <td className="p-2.5 text-emerald-700 dark:text-emerald-400 font-semibold">{fmtMoney(u.margin)}</td>
                      <td className="p-2.5 text-right space-x-1">
                        <button onClick={() => handleOpenEditUsage(u)} title="Edit Usage Log" className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/10 text-slate-400 hover:text-blue-600 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => onDeleteUsage(u.id)} title="Delete Usage Log" className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Usage Dialog */}
      <Dialog open={addUsageOpen || editingUsage !== null} onOpenChange={(open) => { if (!open) { setAddUsageOpen(false); setEditingUsage(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{editingUsage ? "Edit Consumable Usage" : "Add Consumable Usage"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveUsage} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Patient</Label>
              <Select
                value={usageForm.patientId}
                onValueChange={(v) => {
                  const p = patients.find((pt: any) => pt.id === v);
                  setUsageForm((prev) => ({ ...prev, patientId: v, patientName: p?.name || "" }));
                }}
              >
                <SelectTrigger className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs rounded-md shadow-sm h-9">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Round</Label>
                <FormInput type="number" value={usageForm.round} onChange={(e) => setUsageForm((p) => ({ ...p, round: Number(e.target.value) || 1 }))} />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Dates</Label>
                <FormInput type="date" value={usageForm.dates} onChange={(e) => setUsageForm((p) => ({ ...p, dates: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">MRP Total (₹)</Label>
                <FormInput type="number" value={usageForm.mrpTotal || ""} onChange={(e) => setUsageForm((p) => ({ ...p, mrpTotal: Number(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Landing Total (₹)</Label>
                <FormInput type="number" value={usageForm.landingTotal || ""} onChange={(e) => setUsageForm((p) => ({ ...p, landingTotal: Number(e.target.value) || 0 }))} />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => { setAddUsageOpen(false); setEditingUsage(null); }}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">{editingUsage ? "Save Changes" : "Add Usage Log"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Nurse Payments Tab (with explicit Add & Edit Modals) ────────────────────

const NursePaymentsTab: React.FC<{
  nursePayments: NursePayment[];
  onUpdatePayment: (id: string, updates: Partial<NursePayment>) => void;
  onAddPayment: (payment: Omit<NursePayment, "id" | "balance" | "paymentStatus">) => void;
  onDeletePayment: (id: string) => void;
}> = ({ nursePayments, onUpdatePayment, onAddPayment, onDeletePayment }) => {
  const [addOpen, setAddOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<NursePayment | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    nurseName: "", billingPeriod: "", billIdsCovered: "", totalAmountDue: 0, amountPaid: 0, paymentDate: "",
  });

  const handleOpenAdd = () => {
    setPaymentForm({ nurseName: "", billingPeriod: "", billIdsCovered: "", totalAmountDue: 0, amountPaid: 0, paymentDate: "" });
    setAddOpen(true);
  };

  const handleOpenEdit = (payment: NursePayment) => {
    setEditingPayment(payment);
    setPaymentForm({
      nurseName: payment.nurseName,
      billingPeriod: payment.billingPeriod,
      billIdsCovered: payment.billIdsCovered,
      totalAmountDue: payment.totalAmountDue,
      amountPaid: payment.amountPaid,
      paymentDate: payment.paymentDate || "",
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.nurseName.trim()) return;

    const balance = paymentForm.totalAmountDue - paymentForm.amountPaid;
    const paymentStatus: NursePayment["paymentStatus"] = balance <= 0 ? "Paid" : paymentForm.amountPaid > 0 ? "Partial" : "Pending";
    const payload = { ...paymentForm, balance, paymentStatus, paymentDate: paymentForm.paymentDate || null };

    if (editingPayment) {
      onUpdatePayment(editingPayment.id, payload);
      setEditingPayment(null);
    } else {
      onAddPayment(payload);
      setAddOpen(false);
    }
  };

  return (
    <>
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />Nurse Payments
            </CardTitle>
            <CardDescription>Track total amounts due and payments made to nurses per billing period</CardDescription>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm" onClick={handleOpenAdd}>
            <Plus className="h-3.5 w-3.5" /> Add Payment Record
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Nurse Name</th><th className="p-3">Period</th><th className="p-3">Bill IDs</th>
                  <th className="p-3">Total Due (₹)</th><th className="p-3">Paid (₹)</th><th className="p-3">Balance (₹)</th>
                  <th className="p-3">Status</th><th className="p-3">Payment Date</th><th className="p-3 w-20 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {nursePayments.length === 0 ? (
                  <tr><td colSpan={9} className="py-8 text-center text-slate-500">No nurse payment records yet.</td></tr>
                ) : (
                  nursePayments.map((np) => (
                    <tr key={np.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-3"><EditableCell value={np.nurseName} onSave={(v) => onUpdatePayment(np.id, { nurseName: v })} className="font-semibold text-slate-900 dark:text-slate-100" /></td>
                      <td className="p-3"><EditableCell value={np.billingPeriod} onSave={(v) => onUpdatePayment(np.id, { billingPeriod: v })} className="text-slate-700 dark:text-slate-300" /></td>
                      <td className="p-3"><EditableCell value={np.billIdsCovered} onSave={(v) => onUpdatePayment(np.id, { billIdsCovered: v })} className="text-slate-500 font-mono text-[11px]" /></td>
                      <td className="p-3"><EditableCell value={np.totalAmountDue} type="number" onSave={(v) => {
                        const due = Number(v) || 0; const bal = due - np.amountPaid;
                        onUpdatePayment(np.id, { totalAmountDue: due, balance: bal, paymentStatus: bal <= 0 ? "Paid" : np.amountPaid > 0 ? "Partial" : "Pending" });
                      }} className="font-semibold text-slate-900 dark:text-slate-100" /></td>
                      <td className="p-3"><EditableCell value={np.amountPaid} type="number" onSave={(v) => {
                        const paid = Number(v) || 0; const bal = np.totalAmountDue - paid;
                        onUpdatePayment(np.id, { amountPaid: paid, balance: bal, paymentStatus: bal <= 0 ? "Paid" : paid > 0 ? "Partial" : "Pending" });
                      }} className="text-emerald-700 dark:text-emerald-400" /></td>
                      <td className={`p-3 font-semibold ${np.balance > 0 ? "text-amber-700 dark:text-amber-400" : "text-slate-400"}`}>{fmtMoney(np.balance)}</td>
                      <td className="p-3">
                        <Badge className={
                          np.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : np.paymentStatus === "Partial" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : np.paymentStatus === "No Charges" ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        }>{np.paymentStatus}</Badge>
                      </td>
                      <td className="p-3"><EditableCell value={np.paymentDate || ""} onSave={(v) => onUpdatePayment(np.id, { paymentDate: v || null })} className="text-slate-500" /></td>
                      <td className="p-3 text-right space-x-1">
                        <button onClick={() => handleOpenEdit(np)} title="Edit Payment Record" className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/10 text-slate-400 hover:text-blue-600 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => onDeletePayment(np.id)} title="Delete Payment Record" className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Payment Dialog */}
      <Dialog open={addOpen || editingPayment !== null} onOpenChange={(open) => { if (!open) { setAddOpen(false); setEditingPayment(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{editingPayment ? "Edit Nurse Payment Record" : "Add Nurse Payment Record"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Nurse Name</Label>
              <FormInput value={paymentForm.nurseName} onChange={(e) => setPaymentForm((p) => ({ ...p, nurseName: e.target.value }))} placeholder="Nurse Kavitha" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Billing Period</Label>
                <FormInput value={paymentForm.billingPeriod} onChange={(e) => setPaymentForm((p) => ({ ...p, billingPeriod: e.target.value }))} placeholder="e.g. Aug-2026" />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Bill IDs Covered</Label>
                <FormInput value={paymentForm.billIdsCovered} onChange={(e) => setPaymentForm((p) => ({ ...p, billIdsCovered: e.target.value }))} placeholder="e.g. CC2026001, CC2026002" />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Total Due (₹)</Label>
                <FormInput type="number" value={paymentForm.totalAmountDue || ""} onChange={(e) => setPaymentForm((p) => ({ ...p, totalAmountDue: Number(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Amount Paid (₹)</Label>
                <FormInput type="number" value={paymentForm.amountPaid || ""} onChange={(e) => setPaymentForm((p) => ({ ...p, amountPaid: Number(e.target.value) || 0 }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Payment Date</Label>
              <FormInput type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm((p) => ({ ...p, paymentDate: e.target.value }))} />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => { setAddOpen(false); setEditingPayment(null); }}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">{editingPayment ? "Save Changes" : "Add Payment"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ─── Main Billing View ─────────────────────────────────────────────────────────

const BILLING_TABS: { id: BillingTab; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "patient-bills", label: "Patient Bills" },
  { id: "nursing", label: "Nursing" },
  { id: "consumables", label: "Consumables" },
  { id: "nurse-payments", label: "Nurse Payments" },
];

export const BillingView: React.FC = () => {
  const { patients } = useCarcinome();
  const [activeTab, setActiveTab] = useState<BillingTab>("summary");

  // ── Patient Bills (derived from patient context — auto-syncs) ─────────────
  const bills = useMemo<PatientBill[]>(() => {
    return patients.map((p) => ({
      patientId: p.id,
      patientName: p.name,
      patientPhone: p.phone,
      notes: p.coordinationNotes || "",
      rounds: p.sessions.map((s: any, idx: number) => {
        const fixedCharges = 0;
        const consumable = s.supplierCost || 0;
        const nursing = s.nurseCost || 0;
        const totalCharges = (s.totalAmount || 0) || (fixedCharges + consumable + nursing);
        const totalReceived = s.paymentStatus === "Paid" ? totalCharges : 0;
        const balance = totalCharges - totalReceived;
        return {
          round: idx + 1, service: "Chemotherapy Infusion", infusionDate: s.date || "",
          fixedCharges, consumable, nursing, carcinomeProfit: fixedCharges,
          totalCharges, totalReceived, balance,
          paymentStatus: s.paymentStatus === "Paid" ? "Paid" as const : balance > 0 ? "Pending" as const : "Paid" as const,
        };
      }),
    }));
  }, [patients]);

  // ── Nursing Rates (local editable state) ──────────────────────────────────
  const [nursingRates, setNursingRates] = useState<NursingRate[]>([
    { id: genId("NR"), service: "24-hr Nursing (Fixed Package)", rate: 3500, notes: "Flat per day" },
    { id: genId("NR"), service: "12-hr Nursing (Fixed Package)", rate: 2000, notes: "Flat per shift" },
    { id: genId("NR"), service: "Per-Visit Nursing", rate: 800, notes: "Single visit" },
    { id: genId("NR"), service: "Per-Hour Nursing", rate: 200, notes: "Hourly" },
  ]);

  // ── Nursing Charges (seeded from sessions + manually addable/editable) ────
  const sessionDerivedCharges = useMemo<NursingCharge[]>(() => {
    const charges: NursingCharge[] = [];
    patients.forEach((p) => {
      p.sessions.forEach((s, idx) => {
        if (s.nurse && s.nurseCost) {
          charges.push({
            id: `NC-${p.id}-R${idx + 1}`,
            patientId: p.id, patientName: p.name, round: idx + 1, nurseName: s.nurse,
            chargeType: "Hourly", shiftsHrs: 3, ratePerHr: Math.round((s.nurseCost || 0) / 3),
            fixedAmount: 0, amountBilledToPatient: s.nurseCost || 0,
            amountPaidToNurse: Math.round((s.nurseCost || 0) * 0.8),
            billingPeriod: s.date ? new Date(s.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—",
          });
        }
      });
    });
    return charges;
  }, [patients]);

  const [manualNursingCharges, setManualNursingCharges] = useState<NursingCharge[]>([]);
  const [editedNursingCharges, setEditedNursingCharges] = useState<Record<string, Partial<NursingCharge>>>({});

  const allNursingCharges = useMemo(() => {
    const merged = sessionDerivedCharges.map((nc) => editedNursingCharges[nc.id] ? { ...nc, ...editedNursingCharges[nc.id] } : nc);
    return [...merged, ...manualNursingCharges];
  }, [sessionDerivedCharges, manualNursingCharges, editedNursingCharges]);

  // ── Consumables Master (local editable state) ─────────────────────────────
  const [consumables, setConsumables] = useState<ConsumableItem[]>([
    { id: genId("CON"), itemCode: "CON-001", itemName: "IV Cannula 18G", category: "Consumable", mrp: 150, landingPrice: 90, margin: 60, marginPercent: 40 },
    { id: genId("CON"), itemCode: "CON-002", itemName: "Chemo Infusion Set", category: "Consumable", mrp: 850, landingPrice: 520, margin: 330, marginPercent: 38.8 },
    { id: genId("CON"), itemCode: "CON-003", itemName: "Central Line Dressing Kit", category: "Consumable", mrp: 620, landingPrice: 400, margin: 220, marginPercent: 35.5 },
  ]);

  // ── Consumable Usage (seeded from sessions + manually addable/editable) ───
  const sessionDerivedUsages = useMemo<ConsumableUsage[]>(() => {
    const usages: ConsumableUsage[] = [];
    patients.forEach((p) => {
      p.sessions.forEach((s, idx) => {
        if (s.supplierCost) {
          const mrp = Math.round(s.supplierCost * 1.35);
          usages.push({
            id: `CU-${p.id}-R${idx + 1}`, patientId: p.id, patientName: p.name,
            dates: s.date || "", round: idx + 1, mrpTotal: mrp, landingTotal: s.supplierCost, margin: mrp - s.supplierCost,
          });
        }
      });
    });
    return usages;
  }, [patients]);

  const [manualUsages, setManualUsages] = useState<ConsumableUsage[]>([]);
  const [editedUsages, setEditedUsages] = useState<Record<string, Partial<ConsumableUsage>>>({});

  const allConsumableUsages = useMemo(() => {
    const merged = sessionDerivedUsages.map((u) => editedUsages[u.id] ? { ...u, ...editedUsages[u.id] } : u);
    return [...merged, ...manualUsages];
  }, [sessionDerivedUsages, manualUsages, editedUsages]);

  // ── Nurse Payments (local editable state) ─────────────────────────────────
  const [nursePayments, setNursePayments] = useState<NursePayment[]>(() => {
    const byNurse: Record<string, { due: number; patients: string[] }> = {};
    patients.forEach((p) => {
      p.sessions.forEach((s) => {
        if (s.nurse && s.nurseCost) {
          if (!byNurse[s.nurse]) byNurse[s.nurse] = { due: 0, patients: [] };
          byNurse[s.nurse].due += Math.round((s.nurseCost || 0) * 0.8);
          if (!byNurse[s.nurse].patients.includes(p.id)) byNurse[s.nurse].patients.push(p.id);
        }
      });
    });
    return Object.entries(byNurse).map(([name, data]) => ({
      id: genId("NP"), nurseName: name, billingPeriod: "Jul-2026",
      billIdsCovered: data.patients.join(", "), totalAmountDue: data.due,
      amountPaid: 0, balance: data.due, paymentStatus: "Pending" as const, paymentDate: null,
    }));
  });

  // ── CRUD Handlers ─────────────────────────────────────────────────────────

  // Nursing rates
  const handleUpdateRate = useCallback((id: string, updates: Partial<NursingRate>) => {
    setNursingRates((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r));
  }, []);
  const handleAddRate = useCallback((rate: Omit<NursingRate, "id">) => {
    setNursingRates((prev) => [...prev, { ...rate, id: genId("NR") }]);
  }, []);
  const handleDeleteRate = useCallback((id: string) => {
    setNursingRates((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Nursing charges
  const handleAddCharge = useCallback((charge: Omit<NursingCharge, "id">) => {
    setManualNursingCharges((prev) => [...prev, { ...charge, id: genId("NC") }]);
  }, []);
  const handleUpdateCharge = useCallback((id: string, updates: Partial<NursingCharge>) => {
    setManualNursingCharges((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx >= 0) return prev.map((c) => c.id === id ? { ...c, ...updates } : c);
      return prev;
    });
    setEditedNursingCharges((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...updates } }));
  }, []);
  const handleDeleteCharge = useCallback((id: string) => {
    setManualNursingCharges((prev) => prev.filter((c) => c.id !== id));
    setEditedNursingCharges((prev) => { const next = { ...prev }; delete next[id]; return next; });
  }, []);

  // Consumables master
  const handleUpdateItem = useCallback((id: string, updates: Partial<ConsumableItem>) => {
    setConsumables((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c));
  }, []);
  const handleAddItem = useCallback((item: Omit<ConsumableItem, "id" | "margin" | "marginPercent">) => {
    const margin = item.mrp - item.landingPrice;
    const marginPercent = item.mrp ? (margin / item.mrp) * 100 : 0;
    setConsumables((prev) => [...prev, { ...item, id: genId("CON"), margin, marginPercent }]);
  }, []);
  const handleDeleteItem = useCallback((id: string) => {
    setConsumables((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Consumable usage
  const handleAddUsage = useCallback((usage: Omit<ConsumableUsage, "id" | "margin">) => {
    const margin = usage.mrpTotal - usage.landingTotal;
    setManualUsages((prev) => [...prev, { ...usage, id: genId("CU"), margin }]);
  }, []);
  const handleUpdateUsage = useCallback((id: string, updates: Partial<ConsumableUsage>) => {
    setManualUsages((prev) => {
      const idx = prev.findIndex((u) => u.id === id);
      if (idx >= 0) return prev.map((u) => u.id === id ? { ...u, ...updates } : u);
      return prev;
    });
    setEditedUsages((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...updates } }));
  }, []);
  const handleDeleteUsage = useCallback((id: string) => {
    setManualUsages((prev) => prev.filter((u) => u.id !== id));
    setEditedUsages((prev) => { const next = { ...prev }; delete next[id]; return next; });
  }, []);

  // Nurse payments
  const handleUpdatePayment = useCallback((id: string, updates: Partial<NursePayment>) => {
    setNursePayments((prev) => prev.map((np) => np.id === id ? { ...np, ...updates } : np));
  }, []);
  const handleAddPayment = useCallback((payment: Omit<NursePayment, "id" | "balance" | "paymentStatus">) => {
    const balance = payment.totalAmountDue - payment.amountPaid;
    const paymentStatus: NursePayment["paymentStatus"] = balance <= 0 ? "Paid" : payment.amountPaid > 0 ? "Partial" : "Pending";
    setNursePayments((prev) => [...prev, { ...payment, id: genId("NP"), balance, paymentStatus }]);
  }, []);
  const handleDeletePayment = useCallback((id: string) => {
    setNursePayments((prev) => prev.filter((np) => np.id !== id));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Billing Tracker</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Round-by-round patient billing, nursing charges, consumable margins, and nurse payment tracking. Click any cell or use the Edit icon to update records.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
        {BILLING_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-700 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "summary" && (
        <BillingSummaryTab bills={bills} nursingCharges={allNursingCharges} consumableUsages={allConsumableUsages} nursePayments={nursePayments} />
      )}
      {activeTab === "patient-bills" && <PatientBillsTab bills={bills} />}
      {activeTab === "nursing" && (
        <NursingTab
          nursingCharges={allNursingCharges} nursingRates={nursingRates} patients={patients}
          onUpdateRate={handleUpdateRate} onAddRate={handleAddRate} onDeleteRate={handleDeleteRate}
          onAddCharge={handleAddCharge} onUpdateCharge={handleUpdateCharge} onDeleteCharge={handleDeleteCharge}
        />
      )}
      {activeTab === "consumables" && (
        <ConsumablesTab
          consumables={consumables} usages={allConsumableUsages} patients={patients}
          onUpdateItem={handleUpdateItem} onAddItem={handleAddItem} onDeleteItem={handleDeleteItem}
          onAddUsage={handleAddUsage} onUpdateUsage={handleUpdateUsage} onDeleteUsage={handleDeleteUsage}
        />
      )}
      {activeTab === "nurse-payments" && (
        <NursePaymentsTab
          nursePayments={nursePayments}
          onUpdatePayment={handleUpdatePayment} onAddPayment={handleAddPayment} onDeletePayment={handleDeletePayment}
        />
      )}
    </div>
  );
};
