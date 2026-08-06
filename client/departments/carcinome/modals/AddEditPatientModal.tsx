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
          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Patient Name *</Label>
              <Input
                required
                placeholder="e.g. Ramesh Patel"
                value={formData.name || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Contact Phone Number *</Label>
              <Input
                required
                placeholder="98200 12345"
                value={formData.phone || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          {/* Row 2: Relative Contact & Intern */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Relative / Contact Person Name</Label>
              <Input
                placeholder="e.g. Son / Spouse name"
                value={formData.contactName || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assigned Intern (Owner)</Label>
              <Select
                value={formData.allottedIntern || ""}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, allottedIntern: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Intern" />
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
          </div>

          {/* Row 3: Doctor & Diagnosis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assigned Oncologist / Doctor</Label>
              <Select
                value={formData.assignedDoctor || ""}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, assignedDoctor: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Doctor" />
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
              <Label className="text-xs font-semibold">Diagnosis</Label>
              <Input
                placeholder="e.g. Carcinoma Breast / Lung"
                value={formData.diagnosis || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, diagnosis: e.target.value }))}
              />
            </div>
          </div>

          {/* Row 4: Age, Gender & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Age</Label>
              <Input
                type="number"
                placeholder="55"
                value={formData.age ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, age: e.target.value ? parseInt(e.target.value) : null }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Gender</Label>
              <Select
                value={formData.gender || "Male"}
                onValueChange={(val: "Male" | "Female" | "Other") => setFormData((prev) => ({ ...prev, gender: val }))}
              >
                <SelectTrigger>
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
              <Label className="text-xs font-semibold">Location / Address</Label>
              <Input
                placeholder="e.g. Khar West, Mumbai"
                value={formData.location || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>
          </div>

          {/* Row 5: Supplier & Nurse */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Pharma Supplier</Label>
              <Select
                value={formData.supplier || ""}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, supplier: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Supplier" />
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
              <Label className="text-xs font-semibold">Assigned Nurse</Label>
              <Input
                placeholder="e.g. Nurse Kavitha"
                value={formData.assignedNurse || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, assignedNurse: e.target.value }))}
              />
            </div>
          </div>

          {/* Row 6: Regimen / Medicine */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Medicine / Chemotherapy Regimen</Label>
            <Input
              placeholder="e.g. Paclitaxel + Carboplatin, Aprecap 125, Pantoprazole"
              value={formData.medicine || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, medicine: e.target.value }))}
            />
          </div>

          {/* Row 7: Onboarding Stage & Payment Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Workflow Stage / Onboarding Status</Label>
              <Select
                value={formData.onboardingStatus || "Active"}
                onValueChange={(val: OnboardingStatus) =>
                  setFormData((prev) => ({ ...prev, onboardingStatus: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Treatment completed">Treatment Completed</SelectItem>
                  <SelectItem value="No longer with the organisation">
                    No longer with organisation
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Overall Payment Status</Label>
              <Select
                value={formData.paymentStatus || "Pending"}
                onValueChange={(val: PaymentStatus) =>
                  setFormData((prev) => ({ ...prev, paymentStatus: val }))
                }
              >
                <SelectTrigger>
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

          {/* Row 8: Next Session Date & Schedule Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Next Confirmed Session Date</Label>
              <Input
                type="date"
                value={formData.nextInfusionDate || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nextInfusionDate: e.target.value || null }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Infusion Schedule Notes</Label>
              <Textarea
                rows={2}
                placeholder="Rotational weekly infusion details..."
                value={formData.infusionScheduleNotes || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, infusionScheduleNotes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
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
