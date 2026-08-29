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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCarcinome } from "../context/CarcinomeContext";
import type { InfusionSession, PaymentStatus } from "../data/dummy-data";

interface AddEditSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  sessionToEdit?: { session: InfusionSession; index: number } | null;
}

export const AddEditSessionModal: React.FC<AddEditSessionModalProps> = ({
  open,
  onOpenChange,
  patientId,
  sessionToEdit,
}) => {
  const { patients, masterData, addSession, updateSession } = useCarcinome();

  const patient = patients.find((p) => p.id === patientId);
  const suppliers = masterData.filter((m) => m.category === "Supplier" && m.active);

  const [formData, setFormData] = useState<InfusionSession>({
    date: new Date().toISOString().slice(0, 10),
    supplier: "Mr. Anil",
    supplierCost: 3500,
    nurse: "Nurse Kavitha",
    nurseCost: 2500,
    totalAmount: 6000,
    paymentStatus: "Pending",
    billGenerated: false,
    dischargeSummaryPdf: false,
    feedbackTaken: false,
    notes: "",
  });

  useEffect(() => {
    if (sessionToEdit) {
      setFormData(sessionToEdit.session);
    } else {
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        supplier: patient?.supplier || suppliers[0]?.value || "Mr. Anil",
        supplierCost: 3500,
        nurse: patient?.assignedNurse || "Nurse Kavitha",
        nurseCost: 2500,
        totalAmount: 6000,
        paymentStatus: "Pending",
        billGenerated: false,
        dischargeSummaryPdf: false,
        feedbackTaken: false,
        notes: "",
      });
    }
  }, [sessionToEdit, open, patientId]);

  // Auto calculate total cost when supplier or nurse cost changes
  const handleCostChange = (supplierCostVal: number | null, nurseCostVal: number | null) => {
    const sCost = supplierCostVal || 0;
    const nCost = nurseCostVal || 0;
    setFormData((prev) => ({
      ...prev,
      supplierCost: supplierCostVal,
      nurseCost: nurseCostVal,
      totalAmount: sCost + nCost > 0 ? sCost + nCost : prev.totalAmount,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;

    if (sessionToEdit) {
      updateSession(patientId, sessionToEdit.index, formData);
    } else {
      addSession(patientId, formData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{sessionToEdit ? "Edit Infusion Session" : "Add Infusion Session"}</DialogTitle>
          <DialogDescription>
            {patient ? `Record session details for ${patient.name} (${patient.id})` : "Enter session history"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Infusion Session Date *</Label>
            <Input
              type="date"
              required
              value={formData.date || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Pharma Supplier</Label>
              <Select
                value={formData.supplier || ""}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, supplier: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Supplier" />
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
              <Label className="text-xs font-semibold">Supplier Cost (₹)</Label>
              <Input
                type="number"
                placeholder="3500"
                value={formData.supplierCost ?? ""}
                onChange={(e) =>
                  handleCostChange(
                    e.target.value ? parseInt(e.target.value) : null,
                    formData.nurseCost
                  )
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assigned Nurse</Label>
              <Input
                placeholder="Nurse Kavitha"
                value={formData.nurse || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, nurse: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nurse Fee (₹)</Label>
              <Input
                type="number"
                placeholder="2500"
                value={formData.nurseCost ?? ""}
                onChange={(e) =>
                  handleCostChange(
                    formData.supplierCost,
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Total Amount Billed (₹)</Label>
              <Input
                type="number"
                placeholder="6000"
                value={formData.totalAmount ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    totalAmount: e.target.value ? parseInt(e.target.value) : null,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Session Payment Status</Label>
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

          {/* Checkboxes */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="billGenerated"
                checked={formData.billGenerated}
                onCheckedChange={(c) =>
                  setFormData((prev) => ({ ...prev, billGenerated: Boolean(c) }))
                }
              />
              <Label htmlFor="billGenerated" className="text-xs font-normal cursor-pointer">
                Official Bill / Invoice Generated
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dischargePdf"
                checked={formData.dischargeSummaryPdf}
                onCheckedChange={(c) =>
                  setFormData((prev) => ({ ...prev, dischargeSummaryPdf: Boolean(c) }))
                }
              />
              <Label htmlFor="dischargePdf" className="text-xs font-normal cursor-pointer">
                Discharge Summary PDF Attached
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="feedback"
                checked={formData.feedbackTaken}
                onCheckedChange={(c) =>
                  setFormData((prev) => ({ ...prev, feedbackTaken: Boolean(c) }))
                }
              />
              <Label htmlFor="feedback" className="text-xs font-normal cursor-pointer">
                Post-Infusion Patient Feedback Collected
              </Label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Remarks / Session Notes</Label>
            <Textarea
              rows={2}
              placeholder="e.g. Infusion smooth, patient tolerated well..."
              value={formData.notes || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <DialogFooter className="pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              {sessionToEdit ? "Update Session" : "Add Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
