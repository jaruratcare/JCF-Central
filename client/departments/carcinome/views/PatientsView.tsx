import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCarcinome } from "../context/CarcinomeContext";
import { AddEditPatientModal } from "../modals/AddEditPatientModal";
import type { Patient } from "../data/dummy-data";

const AutoResizingNoteInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.max(38, el.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        adjustHeight();
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onFocus={(e) => e.stopPropagation()}
      placeholder="Add patient coordination note..."
      rows={1}
      className="w-full min-h-[38px] resize-none overflow-hidden rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/70 focus:bg-white dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all leading-relaxed"
    />
  );
};

export const PatientsView: React.FC = () => {
  const navigate = useNavigate();
  const { patients, masterData, updatePatient } = useCarcinome();

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [doctorFilter, setDoctorFilter] = useState<string>("all");
  const [internFilter, setInternFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);

  const doctors = masterData.filter((m) => m.category === "Doctor" && m.active);
  const interns = masterData.filter((m) => m.category === "Assignee" && m.active);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.diagnosis.toLowerCase().includes(q) ||
        p.assignedDoctor.toLowerCase().includes(q);

      const matchesStage = stageFilter === "all" || p.onboardingStatus === stageFilter;
      const matchesDoctor = doctorFilter === "all" || p.assignedDoctor === doctorFilter;
      const matchesIntern = internFilter === "all" || (p.allottedIntern || "Unassigned") === internFilter;
      const matchesPayment = paymentFilter === "all" || p.paymentStatus === paymentFilter;

      return matchesSearch && matchesStage && matchesDoctor && matchesIntern && matchesPayment;
    });
  }, [patients, search, stageFilter, doctorFilter, internFilter, paymentFilter]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Patients Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage active treatment profiles, leave notes, assign interns & monitor payment statuses.
          </p>
        </div>
        <Button
          onClick={() => {
            setPatientToEdit(null);
            setAddModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs"
        >
          <Plus className="h-4 w-4" /> Add New Patient
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search patient by name, ID, phone or diagnosis..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {/* Stage Filter */}
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Treatment completed">Treatment Completed</SelectItem>
                <SelectItem value="No longer with the organisation">Archived / Left</SelectItem>
              </SelectContent>
            </Select>

            {/* Doctor Filter */}
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="All Doctors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctors</SelectItem>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Intern Filter */}
            <Select value={internFilter} onValueChange={setInternFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="All Interns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Interns</SelectItem>
                {interns.map((i) => (
                  <SelectItem key={i.id} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
                <SelectItem value="Unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Patient ID & Name</th>
                <th className="p-3.5">Assigned Doctor</th>
                <th className="p-3.5">Current Stage</th>
                <th className="p-3.5">Assigned Intern</th>
                <th className="p-3.5">Next Session</th>
                <th className="p-3.5">Payment Status</th>
                <th className="p-3.5 min-w-[260px] w-72">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No matching patients found.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    onClick={() => navigate(`/departments/carcinome/patients/${patient.id}`)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Patient ID & Name */}
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                        {patient.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {patient.id} • {patient.phone}
                      </div>
                    </td>

                    {/* Doctor */}
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      {patient.assignedDoctor}
                    </td>

                    {/* Current Stage */}
                    <td className="p-3.5">
                      <Badge
                        className={
                          patient.onboardingStatus === "Active"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : patient.onboardingStatus === "Treatment completed"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }
                      >
                        {patient.onboardingStatus}
                      </Badge>
                    </td>

                    {/* Assigned To */}
                    <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">
                      {patient.allottedIntern || (
                        <span className="text-amber-600 dark:text-amber-400 font-normal">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Next Session */}
                    <td className="p-3.5">
                      {(() => {
                        const targetDate =
                          patient.nextInfusionDate ||
                          (patient.sessions.length > 0 ? patient.sessions[patient.sessions.length - 1].date : null);
                        if (!targetDate) return <span className="text-slate-400">—</span>;
                        try {
                          const parsed = new Date(targetDate);
                          if (isNaN(parsed.getTime())) {
                            return <span className="font-semibold text-blue-700 dark:text-blue-300">{targetDate}</span>;
                          }
                          return (
                            <span className="font-semibold text-blue-700 dark:text-blue-300">
                              {parsed.toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          );
                        } catch {
                          return <span className="font-semibold text-blue-700 dark:text-blue-300">{targetDate}</span>;
                        }
                      })()}
                    </td>

                    {/* Payment Status */}
                    <td className="p-3.5">
                      <Badge
                        className={
                          patient.paymentStatus === "Paid"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : patient.paymentStatus === "Pending"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                        }
                      >
                        {patient.paymentStatus}
                      </Badge>
                    </td>

                    {/* Note Column */}
                    <td className="p-3.5 min-w-[260px] w-72" onClick={(e) => e.stopPropagation()}>
                      <AutoResizingNoteInput
                        value={patient.coordinationNotes || ""}
                        onChange={(val) => updatePatient(patient.id, { coordinationNotes: val })}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Patient Modal */}
      <AddEditPatientModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        patientToEdit={patientToEdit}
      />
    </div>
  );
};
