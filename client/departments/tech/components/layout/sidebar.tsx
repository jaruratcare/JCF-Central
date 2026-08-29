import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  KanbanSquare,
  ListTodo,
  Milestone,
  FolderKanban,
  GanttChartSquare,
  Info,
  ChevronDown,
  ArrowLeft,
  Check,
  LogOut,
  Settings,
  ShieldCheck,
  Search,
} from "lucide-react";
import { cn } from "@/departments/tech/lib/utils";
import { Input } from "@/components/ui/input";
import { useListProjects } from "@/departments/tech/lib/api-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/departments/tech/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ProjectSettingsDialog } from "@/departments/tech/components/dialogs/project-settings-dialog";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
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
  const { displayName, user, signOut } = useAuth();
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

  const projectNav = [
    { name: "Dashboard", href: `/projects/${projectId}`, icon: LayoutDashboard, exact: true },
    { name: "Board", href: `/projects/${projectId}/board`, icon: KanbanSquare, exact: false },
    { name: "Backlog", href: `/projects/${projectId}/backlog`, icon: ListTodo, exact: false },
    { name: "Sprints", href: `/projects/${projectId}/sprints`, icon: Milestone, exact: false },
    { name: "Gantt Chart", href: `/projects/${projectId}/gantt`, icon: GanttChartSquare, exact: false },
    { name: "About", href: `/projects/${projectId}/about`, icon: Info, exact: false },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* App brand */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4 font-semibold tracking-tight bg-sidebar-primary/10 gap-2">
        <FolderKanban className="h-5 w-5 text-sidebar-primary flex-shrink-0" />
        <span className="text-sidebar-primary-foreground">Agile Flow</span>
      </div>

      <div className="flex-1 overflow-auto py-3">
        {projectId ? (
          <>
            {/* Back to all projects */}
            <div className="px-3 mb-2">
              <Link
                href="/"
                onClick={() => onClose?.()}
                className="flex items-center gap-1.5 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors px-2 py-1 rounded hover:bg-sidebar-accent"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All Projects
              </Link>
            </div>

            {/* Project switcher */}
            <div className="px-3 mb-3 flex items-center gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-sidebar-accent/50 hover:bg-sidebar-accent text-sidebar-foreground text-sm font-medium transition-colors min-w-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-xs font-mono bg-sidebar-primary/20 text-sidebar-primary px-1.5 py-0.5 rounded flex-shrink-0">
                        {currentProject?.key ?? "—"}
                      </span>
                      <span className="truncate">{currentProject?.name ?? "Project"}</span>
                      {currentProject?.status === "signed_off" && (
                        <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                      )}
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-sidebar-foreground/50" />
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
                          onClick={() => {
                            navigate(`/projects/${p.id}`);
                            onClose?.();
                          }}
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
                  <DropdownMenuItem onClick={() => { navigate("/"); onClose?.(); }}>
                    <FolderKanban className="h-4 w-4 mr-2" />
                    All Projects
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {currentProject && currentProject.accessLevel === "manage" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground"
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
            <div className="px-6 mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              Project
            </div>

            {/* Project nav links */}
            <nav className="space-y-0.5 px-3">
              {projectNav.map((item) => {
                const isActive = item.exact
                  ? location === item.href
                  : location.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => onClose?.()}
                    className={cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-primary/15 text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-4 w-4 flex-shrink-0",
                        isActive ? "text-sidebar-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-accent-foreground"
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </>
        ) : (
          <nav className="space-y-0.5 px-3">
            <Link
              href="/"
              onClick={() => onClose?.()}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                location === "/"
                  ? "bg-sidebar-primary/15 text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <FolderKanban className="mr-3 h-4 w-4 flex-shrink-0 text-sidebar-primary/70" />
              Projects
            </Link>
          </nav>
        )}
      </div>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors text-left">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarFallback className="text-xs bg-sidebar-primary/20 text-sidebar-primary">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{displayName}</p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">{user?.email}</p>
              </div>
              <ChevronDown className="h-3 w-3 flex-shrink-0 text-sidebar-foreground/40" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium truncate">{displayName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
