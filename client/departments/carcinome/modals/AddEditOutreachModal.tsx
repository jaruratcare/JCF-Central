import React, { useState, useEffect, useMemo } from "react";
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
import { type OncologistOutreach } from "../data/outreach-data";

interface AddEditOutreachModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryToEdit?: OncologistOutreach | null;
  onSave: (entry: Omit<OncologistOutreach, "id"> & { id?: string }) => Promise<void>;
}

export const OUTREACH_STAGES = [
  "Initial",
  "1st follow up",
  "2nd follow up",
  "3rd follow up",
  "Subsequent Follow-up",
  "Collaboration Established/to be finalized",
  "Unresponsive",
];

export const OUTREACH_STATUSES = [
  "Positive Response",
  "Shared the Details",
  "Busy/ Did not attend the call",
  "Awaiting Response",
  "Unresponsive",
  "Declined",
  "wrong number",
  "number does not exist",
];

export const AddEditOutreachModal: React.FC<AddEditOutreachModalProps> = ({
  open,
  onOpenChange,
  entryToEdit,
  onSave,
}) => {
  const { masterData, internName } = useCarcinome();

  const [formData, setFormData] = useState({
    doctorName: "",
    hospital: "",
    specialisation: "",
    contactNumber: "",
    email: "",
    outreachStage: "Initial",
    status: "Awaiting Response",
    outreachDoneBy: "",
    lastOutreachDate: new Date().toISOString().split("T")[0],
    notes: "",
    sourceSheet: "General",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Master Data Options
  const stageOptions = useMemo(() => {
    const items = masterData.filter((m) => m.category === "OutreachStage" && m.active).map((m) => m.value);
    return items.length > 0 ? items : OUTREACH_STAGES;
  }, [masterData]);

  const statusOptions = useMemo(() => {
    const items = masterData.filter((m) => m.category === "OutreachStatus" && m.active).map((m) => m.value);
    return items.length > 0 ? items : OUTREACH_STATUSES;
  }, [masterData]);

  const hospitalOptions = useMemo(() => {
    const items = masterData.filter((m) => m.category === "Hospital" && m.active).map((m) => m.value);
    return items.length > 0
      ? items
      : ["Apollo", "Jaslok", "Lilavati", "Kokilaben", "HCG", "SL Raheja - Fortis ", "Asian Institute of Oncology", "Max Nanavati", "Bombay Hospital", "Breach Candy", "POSITIVES"];
  }, [masterData]);

  const specialisationOptions = useMemo(() => {
    const items = masterData.filter((m) => m.category === "Specialisation" && m.active).map((m) => m.value);
    return items.length > 0
      ? items
      : ["Surgical Oncologist", "Medical Oncologist", "Haematology & Bone Marrow Transplant", "Radiation Oncology", "Pediatric Oncology"];
  }, [masterData]);

  const assigneeOptions = useMemo(() => {
    const items = masterData.filter((m) => m.category === "Assignee" && m.active).map((m) => m.value);
    return items.length > 0 ? items : ["Subhiksha", "Lahari", "Shamita", "Kalyani", "Sowjanya", "Meghana", "Tanya"];
  }, [masterData]);

  useEffect(() => {
    if (entryToEdit) {
      setFormData({
        doctorName: entryToEdit.doctorName || "",
        hospital: entryToEdit.hospital || "",
        specialisation: entryToEdit.specialisation || "",
        contactNumber: entryToEdit.contactNumber || "",
        email: entryToEdit.email || "",
        outreachStage: entryToEdit.outreachStage || "Initial",
        status: entryToEdit.status || "Awaiting Response",
        outreachDoneBy: entryToEdit.outreachDoneBy || "",
        lastOutreachDate: entryToEdit.lastOutreachDate || new Date().toISOString().split("T")[0],
        notes: entryToEdit.notes || "",
        sourceSheet: entryToEdit.sourceSheet || "General",
      });
    } else {
      setFormData({
        doctorName: "",
        hospital: "",
        specialisation: "",
        contactNumber: "",
        email: "",
        outreachStage: stageOptions[0] || "Initial",
        status: statusOptions[0] || "Awaiting Response",
        outreachDoneBy: internName || "",
        lastOutreachDate: new Date().toISOString().split("T")[0],
        notes: "",
        sourceSheet: "General",
      });
    }
  }, [entryToEdit, open, stageOptions, statusOptions, internName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctorName.trim() && !formData.hospital.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave(
        entryToEdit
          ? { ...formData, id: entryToEdit.id }
          : formData
      );
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            {entryToEdit ? "Edit Oncologist Outreach Record" : "Add New Oncologist Outreach"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Enter or update doctor contact details, hospital affiliation, outreach status, and notes. Options are powered by Master Data.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Doctor Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Dr. Deepa Parikh"
                value={formData.doctorName}
                onChange={(e) => setFormData((prev) => ({ ...prev, doctorName: e.target.value }))}
                className="h-9 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Hospital / Clinic
              </Label>
              <Input
                placeholder="e.g. Lilavati Hospital & Research Centre"
                value={formData.hospital}
                onChange={(e) => setFormData((prev) => ({ ...prev, hospital: e.target.value, sourceSheet: e.target.value }))}
                className="h-9 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Specialisation
              </Label>
              <Select
                value={formData.specialisation}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, specialisation: val }))}
              >
                <SelectTrigger className="h-9 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm">
                  <SelectValue placeholder="Select Specialisation" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {specialisationOptions.map((sp) => (
                    <SelectItem key={sp} value={sp} className="text-xs">
                      {sp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Contact Number(s)
              </Label>
              <Input
                placeholder="e.g. 9820057742"
                value={formData.contactNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactNumber: e.target.value }))}
                className="h-9 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </Label>
              <Input
                type="email"
                placeholder="doctor@hospital.com"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="h-9 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Outreach Done By (Intern / Team)
              </Label>
              <Select
                value={formData.outreachDoneBy}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, outreachDoneBy: val }))}
              >
                <SelectTrigger className="h-9 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm">
                  <SelectValue placeholder="Select Team Member" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {assigneeOptions.map((asg) => (
                    <SelectItem key={asg} value={asg} className="text-xs">
                      {asg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Stage of Outreach
              </Label>
              <Select
                value={formData.outreachStage}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, outreachStage: val }))}
              >
                <SelectTrigger className="h-9 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm">
                  <SelectValue placeholder="Select Stage" />
                </SelectTrigger>
                <SelectContent>
                  {stageOptions.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, status: val }))}
              >
                <SelectTrigger className="h-9 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {statusOptions.map((st) => (
                    <SelectItem key={st} value={st} className="text-xs">
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Last Outreach Date
              </Label>
              <Input
                type="date"
                value={formData.lastOutreachDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, lastOutreachDate: e.target.value }))}
                className="h-9 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Further Details & Notes
            </Label>
            <Textarea
              placeholder="e.g. Reason for decline, referral agreement, follow-up instruction..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="text-xs min-h-[90px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isSubmitting ? "Saving..." : entryToEdit ? "Save Changes" : "Add Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
