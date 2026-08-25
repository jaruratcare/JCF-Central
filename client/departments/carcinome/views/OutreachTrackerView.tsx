import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  Download,
  Building2,
  UserCheck,
  CheckCircle2,
  Clock,
  XCircle,
  PhoneCall,
  Pencil,
  Trash2,
  Mail,
  Phone,
  FileText,
  Hospital,
  Sparkles,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCarcinome } from "../context/CarcinomeContext";
import { AddEditOutreachModal } from "../modals/AddEditOutreachModal";
import { type OncologistOutreach } from "../data/outreach-data";
import { getActiveColumns, DEFAULT_OUTREACH_COLUMNS } from "../data/table-columns";

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
      placeholder="Add outreach note..."
      rows={1}
      className="w-full min-h-[38px] resize-none overflow-hidden rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/70 focus:bg-white dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all leading-relaxed"
    />
  );
};

export const OutreachTrackerView: React.FC = () => {
  const { outreachEntries, masterData, tableColumns, addOutreachEntry, updateOutreachEntry, deleteOutreachEntry } = useCarcinome();

  const [search, setSearch] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<string>("ALL");
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedDoneBy, setSelectedDoneBy] = useState<string>("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<OncologistOutreach | null>(null);

  const [detailEntry, setDetailEntry] = useState<OncologistOutreach | null>(null);

  // Active table columns configured via Master Data / Table Columns Manager
  const activeColumns = useMemo(() => {
    const cols = tableColumns?.outreach || DEFAULT_OUTREACH_COLUMNS;
    return getActiveColumns(cols);
  }, [tableColumns]);

  // Extract unique hospital tags, stages, statuses, and team members from Master Data + Entries
  const hospitalList = useMemo(() => {
    const set = new Set<string>();
    masterData.filter((m) => m.category === "Hospital" && m.active).forEach((m) => set.add(m.value));
    outreachEntries.forEach((e) => {
      if (e.sourceSheet) set.add(e.sourceSheet);
    });
    return Array.from(set).sort();
  }, [outreachEntries, masterData]);

  const stageList = useMemo(() => {
    const set = new Set<string>();
    masterData.filter((m) => m.category === "OutreachStage" && m.active).forEach((m) => set.add(m.value));
    outreachEntries.forEach((e) => {
      if (e.outreachStage) set.add(e.outreachStage);
    });
    return Array.from(set).sort();
  }, [outreachEntries, masterData]);

  const statusList = useMemo(() => {
    const set = new Set<string>();
    masterData.filter((m) => m.category === "OutreachStatus" && m.active).forEach((m) => set.add(m.value));
    outreachEntries.forEach((e) => {
      if (e.status) set.add(e.status);
    });
    return Array.from(set).sort();
  }, [outreachEntries, masterData]);

  const doneByList = useMemo(() => {
    const set = new Set<string>();
    masterData.filter((m) => m.category === "Assignee" && m.active).forEach((m) => set.add(m.value));
    outreachEntries.forEach((e) => {
      if (e.outreachDoneBy) {
        const names = e.outreachDoneBy.split(/[\n;,]/);
        names.forEach((n) => {
          const trimmed = n.trim();
          if (trimmed && trimmed.length < 20) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort();
  }, [outreachEntries, masterData]);

  // Compute metrics
  const stats = useMemo(() => {
    const total = outreachEntries.length;
    let positive = 0;
    let followUp = 0;
    let awaiting = 0;
    let declined = 0;

    outreachEntries.forEach((e) => {
      const st = (e.status || "").toLowerCase();
      if (st.includes("positive") || st.includes("shared")) positive++;
      else if (st.includes("busy") || st.includes("follow up") || st.includes("followup")) followUp++;
      else if (st.includes("awaiting")) awaiting++;
      else if (st.includes("declined") || st.includes("unresponsive") || st.includes("wrong")) declined++;
      else followUp++;
    });

    return { total, positive, followUp, awaiting, declined };
  }, [outreachEntries]);

  // Filtered outreach entries
  const filteredEntries = useMemo(() => {
    return outreachEntries.filter((item) => {
      // Search text filter
      const q = search.toLowerCase().trim();
      if (q) {
        const matchesName = (item.doctorName || "").toLowerCase().includes(q);
        const matchesHosp = (item.hospital || "").toLowerCase().includes(q);
        const matchesSpec = (item.specialisation || "").toLowerCase().includes(q);
        const matchesPhone = (item.contactNumber || "").toLowerCase().includes(q);
        const matchesNotes = (item.notes || "").toLowerCase().includes(q);
        const matchesSource = (item.sourceSheet || "").toLowerCase().includes(q);
        if (!matchesName && !matchesHosp && !matchesSpec && !matchesPhone && !matchesNotes && !matchesSource) {
          return false;
        }
      }

      // Hospital filter
      if (selectedHospital !== "ALL") {
        if ((item.sourceSheet || "").toLowerCase() !== selectedHospital.toLowerCase() && (item.hospital || "").toLowerCase() !== selectedHospital.toLowerCase()) {
          return false;
        }
      }

      // Stage filter
      if (selectedStage !== "ALL") {
        if ((item.outreachStage || "").toLowerCase() !== selectedStage.toLowerCase()) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== "ALL") {
        if ((item.status || "").toLowerCase() !== selectedStatus.toLowerCase()) {
          return false;
        }
      }

      // Outreach Done By filter
      if (selectedDoneBy !== "ALL") {
        if (!(item.outreachDoneBy || "").toLowerCase().includes(selectedDoneBy.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [outreachEntries, search, selectedHospital, selectedStage, selectedStatus, selectedDoneBy]);

  const handleOpenAdd = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry: OncologistOutreach, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this doctor outreach record?")) {
      await deleteOutreachEntry(id);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Doctor Name",
      "Hospital",
      "Specialisation",
      "Contact Number",
      "Email",
      "Outreach Stage",
      "Status",
      "Outreach Done By",
      "Last Outreach Date",
      "Hospital Tag",
      "Notes",
    ];

    const csvRows = [headers.join(",")];

    filteredEntries.forEach((e) => {
      const row = [
        `"${e.id}"`,
        `"${(e.doctorName || "").replace(/"/g, '""')}"`,
        `"${(e.hospital || "").replace(/"/g, '""')}"`,
        `"${(e.specialisation || "").replace(/"/g, '""')}"`,
        `"${(e.contactNumber || "").replace(/"/g, '""')}"`,
        `"${(e.email || "").replace(/"/g, '""')}"`,
        `"${(e.outreachStage || "").replace(/"/g, '""')}"`,
        `"${(e.status || "").replace(/"/g, '""')}"`,
        `"${(e.outreachDoneBy || "").replace(/"/g, '""')}"`,
        `"${(e.lastOutreachDate || "").replace(/"/g, '""')}"`,
        `"${(e.sourceSheet || "").replace(/"/g, '""')}"`,
        `"${(e.notes || "").replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `oncologist_outreach_tracker_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status?: string) => {
    const st = (status || "").toLowerCase();
    if (st.includes("positive")) {
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium">Positive Response</Badge>;
    }
    if (st.includes("shared")) {
      return <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-medium">Shared Details</Badge>;
    }
    if (st.includes("busy") || st.includes("no answer")) {
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-medium">Busy / No Answer</Badge>;
    }
    if (st.includes("awaiting")) {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-medium">Awaiting Response</Badge>;
    }
    if (st.includes("declined") || st.includes("wrong")) {
      return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-medium">Declined / Wrong No.</Badge>;
    }
    if (st.includes("unresponsive")) {
      return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium">Unresponsive</Badge>;
    }
    return <Badge variant="outline">{status || "Pending"}</Badge>;
  };

  const getStageBadge = (stage?: string) => {
    if (!stage) return <span className="text-slate-400">—</span>;
    const stg = stage.toLowerCase();
    if (stg.includes("collaboration")) {
      return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-medium">{stage}</Badge>;
    }
    if (stg.includes("follow up") || stg.includes("follow-up")) {
      return <Badge variant="outline" className="border-blue-300 text-blue-700 dark:text-blue-300 bg-blue-50/50">{stage}</Badge>;
    }
    return <Badge variant="outline" className="border-slate-300 text-slate-700 dark:text-slate-300 bg-slate-50/50">{stage}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Oncologist Outreach Tracker
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive directory & stage tracking for doctor partnerships, hospital outreach, and referral pipelines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
          >
            <Plus className="h-3.5 w-3.5" /> Add Doctor Record
          </Button>
        </div>
      </div>

      {/* Metrics Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <Card className="border-sky-200/80 bg-sky-50/40 dark:bg-sky-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Contacted</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">{stats.total}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-emerald-50/40 dark:bg-emerald-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Positive Responses</p>
              <p className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100 mt-0.5">{stats.positive}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200/80 bg-blue-50/40 dark:bg-blue-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-blue-800 dark:text-blue-400 uppercase tracking-wider">In Follow-Up</p>
              <p className="text-2xl font-extrabold text-blue-900 dark:text-blue-100 mt-0.5">{stats.followUp}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <PhoneCall className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 bg-amber-50/40 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Awaiting Contact</p>
              <p className="text-2xl font-extrabold text-amber-900 dark:text-amber-100 mt-0.5">{stats.awaiting}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50/40 dark:bg-slate-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Declined / Inactive</p>
              <p className="text-2xl font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">{stats.declined}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Filter & Data Section */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by doctor name, hospital, specialisation, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-36">
                <Select value={selectedHospital} onValueChange={setSelectedHospital}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Hospital Tag" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="ALL" className="text-xs">All Hospitals</SelectItem>
                    {hospitalList.map((h) => (
                      <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-36">
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="ALL" className="text-xs">All Stages</SelectItem>
                    {stageList.map((stg) => (
                      <SelectItem key={stg} value={stg} className="text-xs">{stg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-36">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                    {statusList.map((st) => (
                      <SelectItem key={st} value={st} className="text-xs">{st}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-36">
                <Select value={selectedDoneBy} onValueChange={setSelectedDoneBy}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Outreach By" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="ALL" className="text-xs">All Team Members</SelectItem>
                    {doneByList.map((person) => (
                      <SelectItem key={person} value={person} className="text-xs">{person}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(search || selectedHospital !== "ALL" || selectedStage !== "ALL" || selectedStatus !== "ALL" || selectedDoneBy !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setSelectedHospital("ALL");
                    setSelectedStage("ALL");
                    setSelectedStatus("ALL");
                    setSelectedDoneBy("ALL");
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 h-9"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50/90 dark:bg-slate-900/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {activeColumns.map((col) => (
                    <th
                      key={col.id}
                      className={`p-3 ${col.align === "right" ? "text-right" : "text-left"}`}
                      style={{ minWidth: col.minWidth }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={activeColumns.length} className="py-12 text-center text-slate-500">
                      No oncologist outreach records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setDetailEntry(item)}
                      className="hover:bg-sky-50/50 dark:hover:bg-sky-900/10 cursor-pointer transition-colors"
                    >
                      {activeColumns.map((col) => {
                        switch (col.id) {
                          case "id":
                            return (
                              <td key={col.id} className="p-3 font-mono text-[11px] text-slate-400">
                                {item.id}
                              </td>
                            );
                          case "doctorName":
                            return (
                              <td key={col.id} className="p-3">
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{item.doctorName || "—"}</p>
                                {item.specialisation && (
                                  <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">{item.specialisation}</p>
                                )}
                              </td>
                            );
                          case "hospital":
                            return (
                              <td key={col.id} className="p-3 max-w-[200px]">
                                <p className="text-slate-800 dark:text-slate-200 font-medium truncate">{item.hospital || "—"}</p>
                                {item.sourceSheet && item.sourceSheet !== item.hospital && (
                                  <Badge variant="outline" className="text-[10px] py-0 border-sky-300 text-sky-700 bg-sky-50/60 mt-1">
                                    {item.sourceSheet}
                                  </Badge>
                                )}
                              </td>
                            );
                          case "contactNumber":
                            return (
                              <td key={col.id} className="p-3 font-mono text-slate-700 dark:text-slate-300">
                                {item.contactNumber || "—"}
                              </td>
                            );
                          case "email":
                            return (
                              <td key={col.id} className="p-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] truncate max-w-[160px]">
                                {item.email || "—"}
                              </td>
                            );
                          case "outreachStage":
                            return <td key={col.id} className="p-3">{getStageBadge(item.outreachStage)}</td>;
                          case "status":
                            return <td key={col.id} className="p-3">{getStatusBadge(item.status)}</td>;
                          case "outreachDoneBy":
                            return (
                              <td key={col.id} className="p-3 font-medium text-slate-700 dark:text-slate-300">
                                {item.outreachDoneBy || "—"}
                              </td>
                            );
                          case "lastOutreachDate":
                            return (
                              <td key={col.id} className="p-3 text-slate-500 font-mono text-[11px]">
                                {item.lastOutreachDate || "—"}
                              </td>
                            );
                          case "notes":
                            return (
                              <td key={col.id} className="p-3" onClick={(e) => e.stopPropagation()}>
                                <AutoResizingNoteInput
                                  value={item.notes || ""}
                                  onChange={(val) => updateOutreachEntry(item.id, { notes: val })}
                                />
                              </td>
                            );
                          case "actions":
                            return (
                              <td key={col.id} className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                    onClick={(e) => handleOpenEdit(item, e)}
                                    title="Edit Record"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                    onClick={(e) => handleDelete(item.id, e)}
                                    title="Delete Record"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            );
                          default:
                            return <td key={col.id} className="p-3">—</td>;
                        }
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Doctor Outreach Detail Modal */}
      {detailEntry && (
        <Dialog open={!!detailEntry} onOpenChange={(open) => !open && setDetailEntry(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Hospital className="h-5 w-5 text-blue-600" />
                  {detailEntry.doctorName || "Doctor Record"}
                </DialogTitle>
                <Badge variant="outline" className="font-mono text-xs">{detailEntry.id}</Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                {detailEntry.specialisation || "Oncology Specialist"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-slate-400 font-medium">Hospital Affiliation</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{detailEntry.hospital || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Hospital Tag</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{detailEntry.sourceSheet || "General"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <Phone className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-400 font-medium">Contact Number</p>
                    <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">{detailEntry.contactNumber || "—"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-slate-400 font-medium">Email Address</p>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5 truncate">{detailEntry.email || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-sky-50/50 dark:bg-sky-950/20 rounded-xl border border-sky-200/80">
                <div>
                  <p className="text-slate-400 font-medium">Outreach Stage</p>
                  <div className="mt-1">{getStageBadge(detailEntry.outreachStage)}</div>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Status</p>
                  <div className="mt-1">{getStatusBadge(detailEntry.status)}</div>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Outreach By</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{detailEntry.outreachDoneBy || "—"}</p>
                </div>
              </div>

              {detailEntry.notes && (
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 space-y-1">
                  <p className="text-amber-900 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Notes & Follow-up Details
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {detailEntry.notes}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                onClick={(e) => {
                  const targetId = detailEntry.id;
                  setDetailEntry(null);
                  handleDelete(targetId, e);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Doctor Record
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setDetailEntry(null)} className="text-xs">
                  Close
                </Button>
                <Button
                  size="sm"
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-medium"
                  onClick={(e) => {
                    const itemToEdit = detailEntry;
                    setDetailEntry(null);
                    handleOpenEdit(itemToEdit, e);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit Record
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add / Edit Doctor Outreach Modal */}
      <AddEditOutreachModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        entryToEdit={editingEntry}
        onSave={async (data) => {
          if (data.id) {
            await updateOutreachEntry(data.id, data);
          } else {
            await addOutreachEntry(data);
          }
        }}
      />
    </div>
  );
};
