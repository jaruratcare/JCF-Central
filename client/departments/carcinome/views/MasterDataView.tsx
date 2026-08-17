import React, { useState } from "react";
import {
  Database,
  Plus,
  Tag,
  Stethoscope,
  Truck,
  Users,
  Activity,
  MapPin,
  CreditCard,
  Columns,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  Check,
} from "lucide-react";
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
import {
  type TableColumnsState,
  type ColumnConfig,
  ALL_AVAILABLE_PATIENT_FIELDS,
  ALL_AVAILABLE_SESSION_FIELDS,
  ALL_AVAILABLE_PAYMENT_FIELDS,
} from "../data/table-columns";

type ExtendedCategory = MasterDataItem["category"] | "TableColumns";

const CATEGORIES: { key: ExtendedCategory; label: string; icon: any }[] = [
  { key: "TableColumns", label: "Table Columns & Layout", icon: Columns },
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

export const TableColumnsManager: React.FC = () => {
  const { tableColumns, updateTableColumns, resetTableColumns } = useCarcinome();
  const [selectedTabKey, setSelectedTabKey] = useState<keyof TableColumnsState>("patients");

  const [addColumnModalOpen, setAddColumnModalOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");

  const currentColumns = [...(tableColumns[selectedTabKey] || [])].sort((a, b) => a.order - b.order);

  // Available dashboard fields for active tab
  const availableFieldsList =
    selectedTabKey === "patients"
      ? ALL_AVAILABLE_PATIENT_FIELDS
      : selectedTabKey === "sessions"
      ? ALL_AVAILABLE_SESSION_FIELDS
      : ALL_AVAILABLE_PAYMENT_FIELDS;

  const handleToggleVisible = (id: string) => {
    const newColumns = currentColumns.map((col) =>
      col.id === id ? { ...col, visible: !col.visible } : col
    );
    updateTableColumns(selectedTabKey, newColumns);
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= currentColumns.length) return;

    const reordered = [...currentColumns];
    const [movedItem] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, movedItem);

    const finalColumns = reordered.map((col, idx) => ({ ...col, order: idx }));
    updateTableColumns(selectedTabKey, finalColumns);
  };

  const handleLabelChange = (id: string, newLabel: string) => {
    const newColumns = currentColumns.map((col) =>
      col.id === id ? { ...col, label: newLabel } : col
    );
    updateTableColumns(selectedTabKey, newColumns);
  };

  const handleAddColumnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFieldId) return;

    const targetFieldDef = availableFieldsList.find((f) => f.id === selectedFieldId);
    if (!targetFieldDef) return;

    const existingColIndex = currentColumns.findIndex((c) => c.id === selectedFieldId);

    if (existingColIndex >= 0) {
      // Unhide and set visible
      const updated = currentColumns.map((col, idx) =>
        idx === existingColIndex ? { ...col, visible: true } : col
      );
      updateTableColumns(selectedTabKey, updated);
    } else {
      // Append new field
      const newCol: ColumnConfig = {
        ...targetFieldDef,
        visible: true,
        order: currentColumns.length,
      };
      updateTableColumns(selectedTabKey, [...currentColumns, newCol]);
    }

    setSelectedFieldId("");
    setAddColumnModalOpen(false);
  };

  const activeVisibleColumns = currentColumns.filter((c) => c.visible);

  return (
    <div className="space-y-6">
      {/* Top Tab Selection & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { key: "patients", label: "Patients Directory Table" },
            { key: "sessions", label: "Infusion Sessions Ledger" },
            { key: "payments", label: "Financial Payments Table" },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={selectedTabKey === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTabKey(tab.key as keyof TableColumnsState)}
              className={`text-xs whitespace-nowrap ${
                selectedTabKey === tab.key
                  ? "bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAddColumnModalOpen(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Choose Existing Field
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => resetTableColumns(selectedTabKey)}
            className="text-xs gap-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Default Layout
          </Button>
        </div>
      </div>

      {/* Header Live Preview */}
      <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <CardHeader className="py-3 px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
              Live Table Header Preview ({activeVisibleColumns.length} Visible Columns)
            </CardTitle>
            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900">
              Reflected instantly across tabs
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            {activeVisibleColumns.map((col, idx) => (
              <div
                key={col.id}
                className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 shrink-0 shadow-sm"
              >
                <span className="text-[10px] text-slate-400 font-mono">#{idx + 1}</span>
                <span>{col.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Columns Arrangement List */}
      <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-sm font-semibold">
            Column Visibility & Sequence Configuration
          </CardTitle>
          <CardDescription className="text-xs">
            Toggle visibility to hide/show columns, use arrow controls to re-arrange position sequence, or edit custom column headers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 w-16 text-center">Order</th>
                  <th className="p-3.5 min-w-[200px]">Column Title</th>
                  <th className="p-3.5 min-w-[120px]">Field ID</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5 text-center w-28">Visibility</th>
                  <th className="p-3.5 text-right min-w-[140px]">Rearrange Position</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentColumns.map((col, idx) => (
                  <tr
                    key={col.id}
                    className={`transition-colors ${
                      col.visible
                        ? "bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        : "bg-slate-50/70 dark:bg-slate-950/40 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* Order Badge */}
                    <td className="p-3.5 text-center font-mono text-xs font-bold text-slate-500">
                      {idx + 1}
                    </td>

                    {/* Column Editable Title */}
                    <td className="p-3.5">
                      <Input
                        value={col.label}
                        onChange={(e) => handleLabelChange(col.id, e.target.value)}
                        className="h-8 text-xs font-medium max-w-[220px]"
                      />
                    </td>

                    {/* System ID */}
                    <td className="p-3.5 font-mono text-[11px] text-slate-400">
                      {col.id}
                    </td>

                    {/* Description */}
                    <td className="p-3.5 text-slate-500 dark:text-slate-400">
                      {col.description || "Dashboard data field"}
                    </td>

                    {/* Visibility Toggle */}
                    <td className="p-3.5 text-center">
                      <Button
                        variant={col.visible ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleVisible(col.id)}
                        className={`h-7 px-2.5 text-xs gap-1.5 ${
                          col.visible
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "text-slate-400 border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {col.visible ? (
                          <>
                            <Eye className="h-3.5 w-3.5" /> Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3.5 w-3.5" /> Hidden
                          </>
                        )}
                      </Button>
                    </td>

                    {/* Move Up / Move Down Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, -1)}
                          className="h-7 w-7"
                          title="Move column left / up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={idx === currentColumns.length - 1}
                          onClick={() => handleMove(idx, 1)}
                          className="h-7 w-7"
                          title="Move column right / down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Column Dialog - Choose Existing Dashboard Field */}
      <Dialog open={addColumnModalOpen} onOpenChange={setAddColumnModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Existing Dashboard Field</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddColumnSubmit} className="space-y-4 text-xs py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Dashboard Field to Display</Label>
              <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an existing data field..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableFieldsList.map((f) => {
                    const isVisibleInTable = currentColumns.some(
                      (c) => c.id === f.id && c.visible
                    );
                    return (
                      <SelectItem key={f.id} value={f.id}>
                        <div className="flex items-center justify-between gap-2">
                          <span>{f.label}</span>
                          {isVisibleInTable && (
                            <Badge variant="outline" className="text-[9px] bg-slate-100 text-slate-600">
                              Already Visible
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedFieldId && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/50 text-xs space-y-1">
                <div className="font-semibold text-blue-900 dark:text-blue-300">
                  Field Details
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  {availableFieldsList.find((f) => f.id === selectedFieldId)?.description}
                </div>
              </div>
            )}

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setAddColumnModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedFieldId}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Field to Table
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const MasterDataView: React.FC = () => {
  const { masterData, addMasterItem, toggleMasterItem } = useCarcinome();

  const [activeCategory, setActiveCategory] = useState<ExtendedCategory>("TableColumns");
  const [modalOpen, setModalOpen] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const currentItems = masterData.filter((m) => m.category === activeCategory);

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    if (activeCategory !== "TableColumns") {
      addMasterItem({
        category: activeCategory as MasterDataItem["category"],
        value: newValue.trim() || newLabel.trim(),
        label: newLabel.trim(),
        description: newDesc.trim() || undefined,
      });
    }

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
            Master Data & System Configuration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage table column layouts, dropdown options, oncologists, suppliers, interns & statuses.
          </p>
        </div>
        {activeCategory !== "TableColumns" && (
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Master Option
          </Button>
        )}
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Category Navigation Sidebar */}
        <Card className="md:col-span-1 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Configuration Sections
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const count =
                cat.key === "TableColumns"
                  ? 3
                  : masterData.filter((m) => m.category === cat.key).length;
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/20"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-blue-600" : ""}`} />
                    <span className="truncate">{cat.label}</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 shrink-0">
                    {count}
                  </Badge>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="md:col-span-3">
          {activeCategory === "TableColumns" ? (
            <TableColumnsManager />
          ) : (
            <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
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
          )}
        </div>
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
                value={activeCategory as string}
                onValueChange={(val) => setActiveCategory(val as ExtendedCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c.key !== "TableColumns").map((c) => (
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
                Save Master Option
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
