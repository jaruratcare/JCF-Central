import React, { useState } from "react";
import { Database, Plus, CheckCircle2, XCircle, Tag, Stethoscope, Truck, Users, Activity, MapPin, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCarcinome } from "../context/CarcinomeContext";
import type { MasterDataItem } from "../data/dummy-data";

const CATEGORIES: { key: MasterDataItem["category"]; label: string; icon: any }[] = [
  { key: "Doctor", label: "Doctors & Oncologists", icon: Stethoscope },
  { key: "Supplier", label: "Pharma Suppliers", icon: Truck },
  { key: "Assignee", label: "Operations Assignees (Interns)", icon: Users },
  { key: "SessionType", label: "Infusion Session Types", icon: Activity },
  { key: "PatientStatus", label: "Patient Workflow Stages", icon: Tag },
  { key: "PaymentStatus", label: "Payment Statuses", icon: CreditCard },
  { key: "PaymentMode", label: "Payment Modes", icon: CreditCard },
  { key: "Diagnosis", label: "Diagnoses & Cancers", icon: Database },
  { key: "Location", label: "Locations & Hubs", icon: MapPin },
];

export const MasterDataView: React.FC = () => {
  const { masterData, addMasterItem, toggleMasterItem } = useCarcinome();

  const [activeCategory, setActiveCategory] = useState<MasterDataItem["category"]>("Doctor");
  const [modalOpen, setModalOpen] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const currentItems = masterData.filter((m) => m.category === activeCategory);

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    addMasterItem({
      category: activeCategory,
      value: newValue.trim() || newLabel.trim(),
      label: newLabel.trim(),
      description: newDesc.trim() || undefined,
    });

    setNewValue("");
    setNewLabel("");
    setNewDesc("");
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Master Data Configuration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure dropdown menus and lookup choices across doctors, suppliers, interns, diagnoses & statuses.
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add Master Option
        </Button>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Category Navigation Sidebar */}
        <Card className="md:col-span-1 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const count = masterData.filter((m) => m.category === cat.key).length;
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    {cat.label}
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                    {count}
                  </Badge>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Master Options Table */}
        <Card className="md:col-span-3 border-slate-200 dark:border-slate-800 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="text-base font-semibold">
                {CATEGORIES.find((c) => c.key === activeCategory)?.label}
              </CardTitle>
              <CardDescription className="text-xs">
                Active choices available in patient forms & dropdowns
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  <tr>
                    <th className="p-3.5">Option Label</th>
                    <th className="p-3.5">Stored Value</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Toggle Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No master data options configured under this category.
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">
                          {item.label}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">{item.value}</td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400">
                          {item.description || "—"}
                        </td>
                        <td className="p-3.5">
                          <Badge
                            className={
                              item.active
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }
                          >
                            {item.active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleMasterItem(item.id)}
                            className="h-7 text-xs"
                          >
                            {item.active ? "Deactivate" : "Activate"}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Master Option Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Master Option</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddItemSubmit} className="space-y-4 text-xs py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category</Label>
              <Select
                value={activeCategory}
                onValueChange={(val: MasterDataItem["category"]) => setActiveCategory(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Display Label *</Label>
              <Input
                required
                placeholder="e.g. Dr. Rajesh Kumar"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Stored System Value (Optional)</Label>
              <Input
                placeholder="Defaults to display label if blank"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description / Notes</Label>
              <Input
                placeholder="Optional info..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Add Option
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
