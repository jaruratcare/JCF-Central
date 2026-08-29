import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Link } from "wouter";
import { CalendarDays, CheckCircle2, CircleDot, ListTodo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getListProjectItemsQueryKey,
  listProjectItems,
  useListProjects,
  type WorkItem,
} from "@/departments/tech/lib/api-client";
import { useOrg } from "@/departments/tech/hooks/use-org";
import { ItemTypeIcon, getPriorityColor } from "@/departments/tech/components/item-utils";

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

const STATUS_CLASSES: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  in_progress: "bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-200",
  in_review: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200",
  done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200",
};

function formatDate(value?: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default function MyTasks() {
  const { data: projects, isLoading: loadingProjects } = useListProjects();
  const { currentUser } = useOrg();
  const [projectFilter, setProjectFilter] = useState("all");

  const itemQueries = useQueries({
    queries: (projects ?? []).map((project) => ({
      queryKey: getListProjectItemsQueryKey(project.id),
      queryFn: () => listProjectItems(project.id),
      enabled: !!projects,
    })),
  });

  const loadingItems = itemQueries.some((query) => query.isLoading);
  const tasks = useMemo(() => {
    const projectById = new Map((projects ?? []).map((project) => [project.id, project]));
    return itemQueries.flatMap((query, index) => {
      const project = projects?.[index];
      return (query.data ?? [])
        .filter((item) => item.assigneeId === currentUser?.id)
        .filter((item) => projectFilter === "all" || String(item.projectId) === projectFilter)
        .map((item) => ({ item, project: project ?? projectById.get(item.projectId) }));
    });
  }, [currentUser?.id, itemQueries, projectFilter, projects]);

  const counts = {
    total: tasks.length,
    open: tasks.filter(({ item }) => item.status !== "done").length,
    done: tasks.filter(({ item }) => item.status === "done").length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Tech / personal workload</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every work item assigned to you across the Tech projects you can access.</p>
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-64" aria-label="Filter tasks by project">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {(projects ?? []).map((project) => <SelectItem key={project.id} value={String(project.id)}>{project.key} - {project.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Assigned tasks" value={counts.total} icon={ListTodo} />
        <SummaryCard label="Open tasks" value={counts.open} icon={CircleDot} />
        <SummaryCard label="Completed" value={counts.done} icon={CheckCircle2} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{projectFilter === "all" ? "All assigned work" : "Project tasks"}</CardTitle>
          <CardDescription>{loadingProjects || loadingItems ? "Loading your assigned work..." : `${tasks.length} task${tasks.length === 1 ? "" : "s"} found.`}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingProjects || loadingItems ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500/70" />
              <p className="font-medium">No assigned tasks found</p>
              <p className="text-sm text-muted-foreground">Try another project filter or wait for a task to be assigned.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(({ item, project }) => <TaskRow key={`${item.projectId}-${item.id}`} item={item} project={project} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof ListTodo }) {
  return <Card><CardContent className="flex items-center gap-3 p-4"><Icon className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>;
}

function TaskRow({ item, project }: { item: WorkItem; project?: { id: number; name: string; key: string } }) {
  return (
    <Link href={`/projects/${item.projectId}/items/${item.id}`} className="block rounded-xl border p-4 transition-colors hover:border-sky-400 hover:bg-sky-50/60 dark:hover:border-sky-500 dark:hover:bg-sky-950/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <ItemTypeIcon type={item.type} className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="font-semibold">{item.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{project?.key ?? "Project"} · {project?.name ?? "Unknown project"} · {item.itemKey}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-7 sm:justify-end sm:pl-0">
          <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
          <Badge className={STATUS_CLASSES[item.status] ?? STATUS_CLASSES.todo}>{STATUS_LABELS[item.status] ?? item.status}</Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{formatDate(item.dueDate)}</span>
        </div>
      </div>
    </Link>
  );
}
