import React, { useState, useMemo } from "react";
import { Activity, Search, Filter, Clock, User, ShieldAlert, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { useCarcinome } from "../context/CarcinomeContext";
import type { AuditLogEntry } from "../data/dummy-data";

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useCarcinome();

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = search.toLowerCase();
      const matchesSearch =
        log.actor.toLowerCase().includes(q) ||
        log.targetName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q);

      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [auditLogs, search, actionFilter]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          System Audit Log
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Automated trail tracking patient modifications, session updates, payment status changes & task completions.
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search audit log by actor, patient name, ID or details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">CREATE</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="STATUS_CHANGE">STATUS_CHANGE</SelectItem>
                <SelectItem value="PAYMENT">PAYMENT</SelectItem>
                <SelectItem value="TASK_COMPLETE">TASK_COMPLETE</SelectItem>
                <SelectItem value="DOCUMENT_UPLOAD">DOCUMENT_UPLOAD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Log ID & Time</th>
                <th className="p-3.5">Actor & Role</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Target Entity</th>
                <th className="p-3.5">Modification Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No audit log records match search filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors cursor-pointer"
                  >
                    <td className="p-3.5 font-mono text-slate-500">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">{log.id}</div>
                      <div className="text-[11px] text-slate-400">{log.timestamp}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {log.actor}
                      </div>
                      <div className="text-[11px] text-slate-400">{log.role}</div>
                    </td>

                    <td className="p-3.5">
                      <Badge
                        className={
                          log.action === "CREATE"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : log.action === "DELETE"
                            ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            : log.action === "PAYMENT"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }
                      >
                        {log.action}
                      </Badge>
                    </td>

                    <td className="p-3.5">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {log.targetName}
                      </span>
                      <div className="text-[11px] text-slate-400">Type: {log.targetType}</div>
                    </td>

                    <td className="p-3.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Audit Log Detail Dialog */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Audit Log Entry ({selectedLog?.id})</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3 text-xs py-2">
              <div>
                <span className="text-slate-500">Timestamp:</span>{" "}
                <strong className="text-slate-900 dark:text-slate-100">{selectedLog.timestamp}</strong>
              </div>
              <div>
                <span className="text-slate-500">Actor:</span>{" "}
                <strong className="text-slate-900 dark:text-slate-100">
                  {selectedLog.actor} ({selectedLog.role})
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Action:</span>{" "}
                <Badge variant="outline">{selectedLog.action}</Badge>
              </div>
              <div>
                <span className="text-slate-500">Target:</span>{" "}
                <strong className="text-slate-900 dark:text-slate-100">
                  {selectedLog.targetName} ({selectedLog.targetType})
                </strong>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                  Details:
                </span>
                <p className="text-slate-600 dark:text-slate-400">{selectedLog.details}</p>
              </div>

              {selectedLog.changes && selectedLog.changes.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Field Modifications:
                  </span>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    {selectedLog.changes.map((c, i) => (
                      <div key={i} className="p-2 border-b border-slate-100 dark:border-slate-800 text-[11px]">
                        <span className="font-mono font-semibold">{c.field}:</span>{" "}
                        <span className="text-red-500 line-through mr-1">{c.oldVal}</span> &rarr;{" "}
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {c.newVal}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
