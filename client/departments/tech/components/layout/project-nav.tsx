import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  KanbanSquare,
  ListTodo,
  Milestone,
  GanttChartSquare,
  Info,
  ChevronDown,
  ArrowLeft,
  Check,
  Settings,
  ShieldCheck,
  Search,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/departments/tech/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useListProjects } from "@/departments/tech/lib/api-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectSettingsDialog } from "@/departments/tech/components/dialogs/project-settings-dialog";

/**
 * Project navigation for the Tech department, rendered inside the shared
 * JCF AppLayout sidebar via its `secondaryNav` slot. Only shown while a project
 * is selected. Uses wouter routing (base "/departments/tech").
 */
export function TechProjectNav() {
  const [location, navigate] = useLocation();
  const projectIdMatch = location.match(/^\/projects\/(\d+)/);
  const projectId = projectIdMatch ? projectIdMatch[1] : undefined;

  // Refetch every 30 s so access changes made by others (e.g. member removal)
  // are reflected without a full page reload.
  const { data: projects } = useListProjects({
    // @ts-ignore
    query: { refetchInterval: 30_000, refetchOnWindowFocus: true },
  });
  const currentProject = projects?.find((p) => p.id === Number(projectId));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [switcherSearch, setSwitcherSearch] = useState("");

  const filteredSwitcherProjects = useMemo(() => {
    const q = switcherSearch.toLowerCase().trim();
    if (!q) return projects ?? [];
    return (projects ?? []).filter((p) => {
      if (String(p.id).includes(q)) return true;
      if (p.name.toLowerCase().includes(q)) return true;
      if (p.key.toLowerCase().includes(q)) return true;
      if (p.deadline) {
        const iso = p.deadline.toLowerCase();
        if (iso.includes(q)) return true;
        try {
          const formatted = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
            .format(new Date(p.deadline))
            .toLowerCase();
          if (formatted.includes(q)) return true;
        } catch { }
      }
      return false;
    });
  }, [projects, switcherSearch]);

  if (!projectId) return null;

  const projectNav = [
    { name: "Dashboard", href: `/projects/${projectId}`, icon: LayoutDashboard, exact: true },
    { name: "Board", href: `/projects/${projectId}/board`, icon: KanbanSquare, exact: false },
    { name: "Backlog", href: `/projects/${projectId}/backlog`, icon: ListTodo, exact: false },
    { name: "Sprints", href: `/projects/${projectId}/sprints`, icon: Milestone, exact: false },
    { name: "Gantt Chart", href: `/projects/${projectId}/gantt`, icon: GanttChartSquare, exact: false },
    { name: "About", href: `/projects/${projectId}/about`, icon: Info, exact: false },
  ];

  return (
    <div className="pt-4 mt-2 border-t border-sidebar-border">
      {/* Back to all projects */}
      <div className="px-4 mb-2">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs opacity-50 hover:opacity-100 transition-opacity px-2 py-1 rounded hover:bg-sidebar-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Projects
        </Link>
      </div>

      {/* Project switcher */}
      <div className="px-4 mb-3 flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-sidebar-accent/50 hover:bg-sidebar-accent text-sm font-medium transition-colors min-w-0">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-xs font-mono bg-sidebar-primary/20 text-sidebar-primary px-1.5 py-0.5 rounded flex-shrink-0">
                  {currentProject?.key ?? "—"}
                </span>
                <span className="truncate">{currentProject?.name ?? "Project"}</span>
                {currentProject?.status === "signed_off" && (
                  <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                )}
              </div>
              <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 p-0" onCloseAutoFocus={(e) => e.preventDefault()}>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Switch Project
            </div>
            <DropdownMenuSeparator className="m-0" />
            {/* Search input — stop key propagation so Radix doesn't hijack typing */}
            <div className="px-2 py-1.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search projects…"
                  value={switcherSearch}
                  onChange={(e) => setSwitcherSearch(e.target.value)}
                  className="h-7 pl-7 pr-2 text-xs"
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <DropdownMenuSeparator className="m-0" />
            <div className="max-h-56 overflow-y-auto py-1">
              {filteredSwitcherProjects.length === 0 ? (
                <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                  No projects match "{switcherSearch}"
                </div>
              ) : (
                filteredSwitcherProjects.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="flex items-center gap-2"
                  >
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded flex-shrink-0">{p.key}</span>
                    <span className="flex-1 truncate">{p.name}</span>
                    {p.id === Number(projectId) && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator className="m-0" />
            <DropdownMenuItem onClick={() => navigate("/")}>
              <FolderKanban className="h-4 w-4 mr-2" />
              All Projects
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {currentProject && currentProject.accessLevel === "manage" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 flex-shrink-0 opacity-60 hover:opacity-100"
            onClick={() => setSettingsOpen(true)}
            title="Project settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>

      {currentProject && (
        <ProjectSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          project={currentProject}
        />
      )}

      {/* Section label */}
      <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider opacity-60">
        Project
      </p>
      <div className="space-y-1">
        {projectNav.map((item) => {
          const isActive = item.exact
            ? location === item.href
            : location.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent",
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
