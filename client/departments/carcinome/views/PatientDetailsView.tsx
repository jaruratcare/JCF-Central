import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  User,
  Calendar,
  IndianRupee,
  FileText,
  MessageSquare,
  Activity,
  Plus,
  Trash2,
  Edit,
  Archive,
  FileUp,
  Stethoscope,
  Phone,
  Send,
} from "lucide-react";
import { useCarcinome } from "../context/CarcinomeContext";
import { AddEditSessionModal } from "../modals/AddEditSessionModal";
import { AddEditPatientModal } from "../modals/AddEditPatientModal";
import type { InfusionSession, OnboardingStatus, PaymentStatus } from "../data/dummy-data";

interface PatientDetailsViewProps {
  patientId: string | null;
  onClose: () => void;
}

export const PatientDetailsView: React.FC<PatientDetailsViewProps> = ({ patientId, onClose }) => {
  const {
    patients,
    masterData,
    notes,
    documents,
    auditLogs,
    updatePatient,
    deletePatient,
    archivePatient,
    deleteSession,
    updatePaymentStatus,
    addNote,
    addDocument,
  } = useCarcinome();

  const [activeTab, setActiveTab] = useState("overview");
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<{ session: InfusionSession; index: number } | null>(null);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [docNameInput, setDocNameInput] = useState("");

  const patient = patients.find((p) => p.id === patientId);

  if (!patientId || !patient) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-500">Patient profile not found.</p>
        <Button onClick={onClose} variant="outline" className="gap-2 text-xs">
          <ArrowLeft className="h-4 w-4" /> Return to Directory
        </Button>
      </div>
    );
  }

  const doctors = masterData.filter((m) => m.category === "Doctor" && m.active);
  const suppliers = masterData.filter((m) => m.category === "Supplier" && m.active);
  const interns = masterData.filter((m) => m.category === "Assignee" && m.active);

  const patientNotes = notes.filter((n) => n.patientId === patient.id);
  const patientDocs = documents.filter((d) => d.patientId === patient.id);
  const patientLogs = auditLogs.filter((l) => l.targetId === patient.id || l.details.includes(patient.name));

  const totalBilled = patient.sessions.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalPaid = patient.sessions
    .filter((s) => s.paymentStatus === "Paid")
    .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalPending = totalBilled - totalPaid;

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete patient ${patient.name}?`)) {
      deletePatient(patient.id);
      onClose();
    }
  };

  const handleArchive = () => {
    archivePatient(patient.id);
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addNote(patient.id, newNoteText);
    setNewNoteText("");
  };

  const handleDocUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNameInput.trim()) return;
    addDocument(patient.id, {
      name: docNameInput.endsWith(".pdf") ? docNameInput : `${docNameInput}.pdf`,
      fileType: "pdf",
      size: "1.2 MB",
    });
    setDocNameInput("");
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={onClose}
          className="w-fit gap-2 text-xs font-medium border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Patients Directory
        </Button>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setPatientModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs shadow-sm"
          >
            <Edit className="h-3.5 w-3.5" /> Edit Patient Details
          </Button>
          <Button
            variant="outline"
            onClick={handleArchive}
            className="text-slate-700 dark:text-slate-300 gap-1.5 text-xs"
            title="Archive Patient"
          >
            <Archive className="h-3.5 w-3.5" /> Archive
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white gap-1.5 text-xs shadow-sm"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Patient
          </Button>
        </div>
      </div>

      {/* Main Patient Header Card */}
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl p-6 border border-slate-300 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono text-xs px-2 py-0.5">
                {patient.id}
              </Badge>
              <Badge
                className={
                  patient.onboardingStatus === "Active"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                }
              >
                {patient.onboardingStatus}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{patient.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> {patient.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> {patient.assignedDoctor}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> Intern: {patient.allottedIntern || "Unassigned"}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs min-w-[210px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Financial Ledger Summary</span>
            <div className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
              Paid: ₹{totalPaid.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Pending: ₹{totalPending.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* Main Full-Page Tabs */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <TabsList className="bg-transparent h-12 p-0 space-x-2">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 text-xs gap-1.5"
              >
                <User className="h-3.5 w-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger
                value="sessions"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 text-xs gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5" /> Sessions ({patient.sessions.length})
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 text-xs gap-1.5"
              >
                <IndianRupee className="h-3.5 w-3.5" /> Payments
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 text-xs gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" /> Documents ({patientDocs.length})
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 text-xs gap-1.5"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Notes ({patientNotes.length})
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 text-xs gap-1.5"
              >
                <Activity className="h-3.5 w-3.5" /> Audit Log ({patientLogs.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="p-6 space-y-6">
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700 dark:text-slate-300">
                    Assigned Doctor
                  </Label>
                  <Select
                    value={patient.assignedDoctor}
                    onValueChange={(val) => updatePatient(patient.id, { assignedDoctor: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((d) => (
                        <SelectItem key={d.id} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700 dark:text-slate-300">
                    Assigned Intern (Owner)
                  </Label>
                  <Select
                    value={patient.allottedIntern || ""}
                    onValueChange={(val) => updatePatient(patient.id, { allottedIntern: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {interns.map((i) => (
                        <SelectItem key={i.id} value={i.value}>
                          {i.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700 dark:text-slate-300">
                    Diagnosis
                  </Label>
                  <Input
                    value={patient.diagnosis}
                    onChange={(e) => updatePatient(patient.id, { diagnosis: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700 dark:text-slate-300">
                    Chemotherapy Regimen / Medicine
                  </Label>
                  <Input
                    value={patient.medicine}
                    onChange={(e) => updatePatient(patient.id, { medicine: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700 dark:text-slate-300">
                    Pharma Supplier
                  </Label>
                  <Select
                    value={patient.supplier}
                    onValueChange={(val) => updatePatient(patient.id, { supplier: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700 dark:text-slate-300">
                    Assigned Nurse
                  </Label>
                  <Input
                    value={patient.assignedNurse}
                    onChange={(e) => updatePatient(patient.id, { assignedNurse: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700 dark:text-slate-300">
                    Onboarding / Stage Status
                  </Label>
                  <Select
                    value={patient.onboardingStatus}
                    onValueChange={(val: OnboardingStatus) =>
                      updatePatient(patient.id, { onboardingStatus: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Treatment completed">Treatment completed</SelectItem>
                      <SelectItem value="No longer with the organisation">
                        No longer with organisation
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700 dark:text-slate-300">
                    Location / Residential Address
                  </Label>
                  <Input
                    value={patient.location}
                    onChange={(e) => updatePatient(patient.id, { location: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label className="font-semibold text-slate-700 dark:text-slate-300">
                  Infusion Schedule & Coordination Notes
                </Label>
                <Textarea
                  rows={3}
                  value={patient.infusionScheduleNotes || ""}
                  onChange={(e) =>
                    updatePatient(patient.id, { infusionScheduleNotes: e.target.value })
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: SESSIONS */}
          <TabsContent value="sessions" className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Infusion Session History</h3>
                <p className="text-xs text-slate-500">
                  Full log of chemotherapy infusion sessions, nurse visits & costs
                </p>
              </div>
              <Button
                onClick={() => {
                  setSessionToEdit(null);
                  setSessionModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white size-sm text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add New Session
              </Button>
            </div>

            {patient.sessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-lg">
                No infusion sessions recorded yet for this patient.
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Supplier & Cost</th>
                      <th className="p-3">Nurse & Fee</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Payment Status</th>
                      <th className="p-3">Bill / Discharge PDF</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {patient.sessions.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="p-3 font-medium">Session {idx + 1}</td>
                        <td className="p-3 font-medium">{s.date}</td>
                        <td className="p-3">
                          {s.supplier || "—"} {s.supplierCost ? `(₹${s.supplierCost})` : ""}
                        </td>
                        <td className="p-3">
                          {s.nurse || "—"} {s.nurseCost ? `(₹${s.nurseCost})` : ""}
                        </td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                          {s.totalAmount ? `₹${s.totalAmount.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="p-3">
                          <Badge
                            className={
                              s.paymentStatus === "Paid"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }
                          >
                            {s.paymentStatus || "Pending"}
                          </Badge>
                        </td>
                        <td className="p-3 space-x-1">
                          {s.billGenerated && (
                            <Badge variant="outline" className="text-blue-600 border-blue-300 text-[10px]">
                              Bill Gen
                            </Badge>
                          )}
                          {s.dischargeSummaryPdf && (
                            <Badge variant="outline" className="text-purple-600 border-purple-300 text-[10px]">
                              PDF Ready
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-blue-600"
                            onClick={() => {
                              setSessionToEdit({ session: s, index: idx });
                              setSessionModalOpen(true);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-600"
                            onClick={() => deleteSession(patient.id, idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: PAYMENTS */}
          <TabsContent value="payments" className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                <div className="text-xs text-slate-500">Total Billed</div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  ₹{totalBilled.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg">
                <div className="text-xs text-emerald-700 dark:text-emerald-400">Total Collected</div>
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                  ₹{totalPaid.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg">
                <div className="text-xs text-amber-700 dark:text-amber-400">Balance Pending</div>
                <div className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                  ₹{totalPending.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Payment Status Control
                </h4>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Overall Patient Status:</Label>
                  <Select
                    value={patient.paymentStatus}
                    onValueChange={(val: PaymentStatus) => updatePaymentStatus(patient.id, val)}
                  >
                    <SelectTrigger className="w-40 h-8 text-xs">
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
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
                {patient.sessions.map((s, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        Session #{idx + 1} — {s.date}
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        Amount: ₹{s.totalAmount ? s.totalAmount.toLocaleString("en-IN") : "0"} • Supplier: {s.supplier || "N/A"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={s.paymentStatus || "Pending"}
                        onValueChange={(val: PaymentStatus) =>
                          updatePaymentStatus(patient.id, val, idx)
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
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: DOCUMENTS */}
          <TabsContent value="documents" className="p-6 space-y-6">
            <form onSubmit={handleDocUploadSubmit} className="flex gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <Input
                placeholder="Upload document title (e.g. Discharge_Summary_Scan.pdf)"
                value={docNameInput}
                onChange={(e) => setDocNameInput(e.target.value)}
                className="text-xs"
              />
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 whitespace-nowrap">
                <FileUp className="h-3.5 w-3.5" /> Upload File
              </Button>
            </form>

            <div className="space-y-2">
              {patientDocs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-lg">
                  No documents attached yet.
                </div>
              ) : (
                patientDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {doc.name}
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          Uploaded by {doc.uploadedBy} on {doc.uploadedAt} • {doc.size}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-white dark:bg-slate-800 text-slate-700">
                      {doc.fileType.toUpperCase()}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* TAB 5: NOTES */}
          <TabsContent value="notes" className="p-6 space-y-6">
            <form onSubmit={handleAddNoteSubmit} className="space-y-2">
              <Textarea
                rows={2}
                placeholder="Write operational follow-up note..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="text-xs"
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5">
                  <Send className="h-3.5 w-3.5" /> Post Operational Note
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {patientNotes.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-lg">
                  No operational notes recorded yet.
                </div>
              ) : (
                patientNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {note.author} ({note.role})
                      </span>
                      <span>{note.createdAt}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* TAB 6: ACTIVITY */}
          <TabsContent value="activity" className="p-6 space-y-4">
            <div className="space-y-3">
              {patientLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-lg">
                  No audit log events for this patient yet.
                </div>
              ) : (
                patientLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 border-l-2 border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {log.actor} ({log.role})
                      </span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Add / Edit Session Modal */}
      <AddEditSessionModal
        open={sessionModalOpen}
        onOpenChange={setSessionModalOpen}
        patientId={patient.id}
        sessionToEdit={sessionToEdit}
      />

      {/* Add / Edit Patient Modal */}
      <AddEditPatientModal
        open={patientModalOpen}
        onOpenChange={setPatientModalOpen}
        patientToEdit={patient}
      />
    </div>
  );
};
