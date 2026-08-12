import React, { useState, useMemo } from "react";
import { CheckSquare, Plus, Filter, Clock, AlertTriangle, CheckCircle2, User, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCarcinome } from "../context/CarcinomeContext";
import { TaskModal } from "../modals/TaskModal";
import type { Task } from "../data/dummy-data";

export const TasksView: React.FC = () => {
  const { tasks, masterData, updateTaskStatus, deleteTask } = useCarcinome();

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<Task["status"] | null>(null);

  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [internFilter, setInternFilter] = useState<string>("all");

  const handleDragStart = (taskId: string) => (event: React.DragEvent<HTMLDivElement>) => {
    setDraggingTaskId(taskId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (status: Task["status"]) => (event: React.DragEvent<HTMLElement>) => {
    if (!draggingTaskId) return;
    event.preventDefault();
    setDragOverStatus(status);
  };

  const handleDrop = (status: Task["status"]) => (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (!draggingTaskId) return;
    updateTaskStatus(draggingTaskId, status);
    setDraggingTaskId(null);
    setDragOverStatus(null);
  };

  const interns = masterData.filter((m) => m.category === "Assignee" && m.active);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
      const matchesIntern = internFilter === "all" || t.assignee === internFilter;
      return matchesPriority && matchesIntern;
    });
  }, [tasks, priorityFilter, internFilter]);

  const pendingTasks = filteredTasks.filter((t) => t.status === "Pending");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "In Progress");
  const completedTasks = filteredTasks.filter((t) => t.status === "Completed");

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Operations Tasks & Action Items
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track daily follow-ups, payment reminders, discharge summary collections & doctor updates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              List View
            </button>
          </div>
          <Button
            onClick={() => setTaskModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
          >
            <Plus className="h-4 w-4" /> Create Task
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Filter By:</span>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-36 text-xs">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="High">High Priority</SelectItem>
                <SelectItem value="Medium">Medium Priority</SelectItem>
                <SelectItem value="Low">Low Priority</SelectItem>
              </SelectContent>
            </Select>

            <Select value={internFilter} onValueChange={setInternFilter}>
              <SelectTrigger className="w-36 text-xs">
                <SelectValue placeholder="All Assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {interns.map((i) => (
                  <SelectItem key={i.id} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-slate-500 text-xs">
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredTasks.length}</strong> tasks
          </div>
        </CardContent>
      </Card>

      {/* KANBAN BOARD VIEW */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Pending */}
          <section
            onDragOver={handleDragOver("Pending")}
            onDragLeave={() => setDragOverStatus(null)}
            onDrop={handleDrop("Pending")}
            className={`space-y-3 rounded-2xl transition-all ${
              dragOverStatus === "Pending"
                ? "ring-2 ring-amber-400/80 bg-amber-50/70"
                : "bg-transparent"
            }`}
          >
            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg">
              <span className="font-semibold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" /> Pending ({pendingTasks.length})
              </span>
            </div>
            <div className="space-y-3 min-h-[300px]">
              {pendingTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onStatusChange={updateTaskStatus}
                  onDelete={deleteTask}
                  draggable
                  onDragStart={handleDragStart(t.id)}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>
          </section>

          {/* Column 2: In Progress */}
          <section
            onDragOver={handleDragOver("In Progress")}
            onDragLeave={() => setDragOverStatus(null)}
            onDrop={handleDrop("In Progress")}
            className={`space-y-3 rounded-2xl transition-all ${
              dragOverStatus === "In Progress"
                ? "ring-2 ring-blue-400/80 bg-blue-50/60"
                : "bg-transparent"
            }`}
          >
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-lg">
              <span className="font-semibold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600" /> In Progress ({inProgressTasks.length})
              </span>
            </div>
            <div className="space-y-3 min-h-[300px]">
              {inProgressTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onStatusChange={updateTaskStatus}
                  onDelete={deleteTask}
                  draggable
                  onDragStart={handleDragStart(t.id)}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>
          </section>

          {/* Column 3: Completed */}
          <section
            onDragOver={handleDragOver("Completed")}
            onDragLeave={() => setDragOverStatus(null)}
            onDrop={handleDrop("Completed")}
            className={`space-y-3 rounded-2xl transition-all ${
              dragOverStatus === "Completed"
                ? "ring-2 ring-emerald-400/80 bg-emerald-50/70"
                : "bg-transparent"
            }`}
          >
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg">
              <span className="font-semibold text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Completed ({completedTasks.length})
              </span>
            </div>
            <div className="space-y-3 min-h-[300px]">
              {completedTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onStatusChange={updateTaskStatus}
                  onDelete={deleteTask}
                  draggable
                  onDragStart={handleDragStart(t.id)}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* LIST VIEW */
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTasks.map((t) => (
                <div key={t.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-xs">
                  <input
                    type="checkbox"
                    checked={t.status === "Completed"}
                    onChange={(e) => updateTaskStatus(t.id, e.target.checked ? "Completed" : "Pending")}
                    className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                        {t.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{t.category}</Badge>
                        <Badge
                          className={
                            t.priority === "High"
                              ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }
                        >
                          {t.priority}
                        </Badge>
                      </div>
                    </div>
                    {t.description && <p className="text-slate-500 mt-1">{t.description}</p>}
                    <div className="flex items-center gap-4 text-slate-400 mt-2">
                      {t.patientName && <span>Patient: <strong className="text-slate-700 dark:text-slate-300">{t.patientName}</strong></span>}
                      <span>Assigned to: <strong className="text-slate-700 dark:text-slate-300">{t.assignee}</strong></span>
                      <span>Due: {t.dueDate}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-600"
                    onClick={() => deleteTask(t.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Modal */}
      <TaskModal open={taskModalOpen} onOpenChange={setTaskModalOpen} />
    </div>
  );
};

// Task Card Helper Subcomponent
function TaskCard({
  task,
  onStatusChange,
  onDelete,
  draggable = false,
  onDragStart,
  onDragEnd,
}: {
  task: Task;
  onStatusChange: (id: string, status: Task["status"]) => void;
  onDelete: (id: string) => void;
  draggable?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
}) {
  return (
    <Card
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <CardContent className="p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-900">
            {task.category}
          </Badge>
          <div className="flex items-center gap-2">
            <Badge
              className={
                task.priority === "High"
                  ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-[10px]"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px]"
              }
            >
              {task.priority}
            </Badge>
            {draggable && <GripVertical className="h-4 w-4 text-slate-400" />}
          </div>
        </div>

        <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{task.title}</div>
        {task.description && (
          <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{task.description}</p>
        )}

        {task.patientName && (
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
            Patient: {task.patientName}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>{task.assignee}</span>
          <Select
            value={task.status}
            onValueChange={(val: Task["status"]) => onStatusChange(task.id, val)}
          >
            <SelectTrigger className="w-28 h-6 text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
