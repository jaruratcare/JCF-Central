import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Stethoscope, Activity, Calendar } from "lucide-react";
import { useCarcinome } from "../context/CarcinomeContext";
import type { Patient, OnboardingStatus, PaymentStatus, DischargeSummaryStatus, InfusionStatus } from "../data/dummy-data";

interface AddEditPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientToEdit?: Patient | null;
}

export const AddEditPatientModal: React.FC<AddEditPatientModalProps> = ({
  open,
  onOpenChange,
  patientToEdit,
}) => {
  const { masterData, addPatient, updatePatient } = useCarcinome();

  const doctors = masterData.filter((m) => m.category === "Doctor" && m.active);
  const suppliers = masterData.filter((m) => m.category === "Supplier" && m.active);
  const interns = masterData.filter((m) => m.category === "Assignee" && m.active);
  const diagnoses = masterData.filter((m) => m.category === "Diagnosis" && m.active);
  const locations = masterData.filter((m) => m.category === "Location" && m.active);

  const [formData, setFormData] = useState<Partial<Patient>>({
    name: "",
    phone: "",
    contactName: "",
    allottedIntern: "Komal",
    onboardingStatus: "Active",
    services: "At home chemotherapy infusion",
    location: "Mumbai",
    age: 45,
    gender: "Female",
    assignedDoctor: "Dr. Darshit Shah",
    diagnosis: "Carcinoma Stomach",
    medicine: "",
    supplier: "Mr. Anil",
    supplierContact: "97689 27006",
    assignedNurse: "Nurse Kavitha",
    nurseContact: "81047 16591",
    infusionScheduleNotes: "",
    upcomingInfusionStatus: "",
    confirmedDate: null,
    costOfInfusion: null,
    infusionStatus: "Not Started",
    lastInfusionDate: null,
    dischargeSummaryStatus: "Not Started",
    paymentStatus: "Pending",
    nextInfusionDate: null,
    coordinationNotes: "",
  });

  useEffect(() => {
    if (patientToEdit) {
      setFormData(patientToEdit);
    } else {
      setFormData({
        name: "",
        phone: "",
        contactName: "",
        allottedIntern: interns[0]?.value || "Komal",
        onboardingStatus: "Active",
        services: "At home chemotherapy infusion",
        location: locations[0]?.value || "Mumbai",
        age: 45,
        gender: "Female",
        assignedDoctor: doctors[0]?.value || "Dr. Darshit Shah",
        diagnosis: diagnoses[0]?.value || "Carcinoma Stomach",
        medicine: "",
        supplier: suppliers[0]?.value || "Mr. Anil",
        supplierContact: "97689 27006",
        assignedNurse: "Nurse Kavitha",
        nurseContact: "81047 16591",
        infusionScheduleNotes: "",
        upcomingInfusionStatus: "",
        confirmedDate: null,
        costOfInfusion: null,
        infusionStatus: "Not Started",
        lastInfusionDate: null,
        dischargeSummaryStatus: "Not Started",
        paymentStatus: "Pending",
        nextInfusionDate: null,
        coordinationNotes: "",
      });
    }
  }, [patientToEdit, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (patientToEdit) {
      updatePatient(patientToEdit.id, formData);
    } else {
      addPatient(formData as Omit<Patient, "id" | "sessions">);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{patientToEdit ? "Edit Patient Record" : "Add New Carcinome Patient"}</DialogTitle>
          <DialogDescription>
            {patientToEdit
              ? `Update profile details for Patient ${patientToEdit.id}`
              : "Register a new patient profile into the coordination system."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">

          {/* ── Section: Patient Identity ─────────────────────────────── */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-200 dark:border-blue-900/60 bg-blue-100/60 dark:bg-blue-950/40">
              <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 tracking-wide uppercase">Patient Identity</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Patient Name *</Label>
                  <Input
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={formData.name || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 focus-visible:ring-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Contact Phone Number *</Label>
                  <Input
                    required
                    placeholder="98200 12345"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 focus-visible:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Age</Label>
                  <Input
                    type="number"
                    placeholder="55"
                    value={formData.age ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, age: e.target.value ? parseInt(e.target.value) : null }))
                    }
                    className="border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 focus-visible:ring-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Gender</Label>
                  <Select
                    value={formData.gender || "Male"}
                    onValueChange={(val: "Male" | "Female" | "Other") => setFormData((prev) => ({ ...prev, gender: val }))}
                  >
                    <SelectTrigger className="border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location / Address</Label>
                  <Input
                    placeholder="e.g. Khar West, Mumbai"
                    value={formData.location || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    className="border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 focus-visible:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Relative / Contact Person Name</Label>
                <Input
                  placeholder="e.g. Son / Spouse name"
                  value={formData.contactName || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactName: e.target.value }))}
                  className="border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 focus-visible:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ── Section: Care Team ────────────────────────────────────── */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-200 dark:border-blue-900/60 bg-blue-100/60 dark:bg-blue-950/40">
              <Stethoscope className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 tracking-wide uppercase">Care Team</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Oncologist / Doctor</Label>
                <Select
                  value={formData.assignedDoctor || ""}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, assignedDoctor: val }))}
                >
                  <SelectTrigger className="border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 focus:ring-blue-500">
                    <SelectValue placeholder="Select Doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Intern (Owner)</Label>
                <Select
                  value={formData.allottedIntern || ""}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, allottedIntern: val }))}
                >
                  <SelectTrigger className="border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 focus:ring-blue-500">
                    <SelectValue placeholder="Select Intern" />
                  </SelectTrigger>
                  <SelectContent>
                    {interns.map((i) => (
                      <SelectItem key={i.id} value={i.value}>{i.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pharma Supplier</Label>
                <Select
                  value={formData.supplier || ""}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, supplier: val }))}
                >
                  <SelectTrigger className="border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 focus:ring-blue-500">
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Nurse</Label>
                <Input
                  placeholder="e.g. Nurse Kavitha"
                  value={formData.assignedNurse || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, assignedNurse: e.target.value }))}
                  className="border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 focus-visible:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ── Section: Treatment & Status ───────────────────────────── */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-200 dark:border-blue-900/60 bg-blue-100/60 dark:bg-blue-950/40">
              <Activity className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 tracking-wide uppercase">Treatment &amp; Status</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Diagnosis</Label>
                <Input
                  placeholder="e.g. Carcinoma Breast / Lung"
                  value={formData.diagnosis || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, diagnosis: e.target.value }))}
                  className="border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Medicine / Chemotherapy Regimen</Label>
                <Input
                  placeholder="e.g. Paclitaxel + Carboplatin, Aprecap 125, Pantoprazole"
                  value={formData.medicine || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, medicine: e.target.value }))}
                  className="border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 focus-visible:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Workflow Stage / Onboarding Status</Label>
                  <Select
                    value={formData.onboardingStatus || "Active"}
                    onValueChange={(val: OnboardingStatus) =>
                      setFormData((prev) => ({ ...prev, onboardingStatus: val }))
                    }
                  >
                    <SelectTrigger className="border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Treatment completed">Treatment Completed</SelectItem>
                      <SelectItem value="No longer with the organisation">No longer with organisation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Overall Payment Status</Label>
                  <Select
                    value={formData.paymentStatus || "Pending"}
                    onValueChange={(val: PaymentStatus) =>
                      setFormData((prev) => ({ ...prev, paymentStatus: val }))
                    }
                  >
                    <SelectTrigger className="border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 focus:ring-blue-500">
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
            </div>
          </div>

          {/* ── Section: Scheduling ───────────────────────────────────── */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-200 dark:border-blue-900/60 bg-blue-100/60 dark:bg-blue-950/40">
              <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 tracking-wide uppercase">Scheduling</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Next Confirmed Session Date</Label>
                <Input
                  type="date"
                  value={formData.nextInfusionDate || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nextInfusionDate: e.target.value || null }))
                  }
                  className="border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Infusion Schedule Notes</Label>
                <Textarea
                  rows={2}
                  placeholder="Rotational weekly infusion details..."
                  value={formData.infusionScheduleNotes || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, infusionScheduleNotes: e.target.value }))}
                  className="border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 focus-visible:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              {patientToEdit ? "Save Changes" : "Create Patient Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
