import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  KanbanSquare,
  ListTodo,
  Milestone,
  GanttChartSquare,
  Info,
} from "lucide-react";
import { cn } from "@/departments/tech/lib/utils";

/**
 * Project navigation links for the Tech department, rendered inside the shared
 * JCF AppLayout sidebar via its `secondaryNav` slot. Only shown while a project
 * is selected. Uses wouter routing (base "/departments/tech").
 */
export function TechProjectNav() {
  const [location] = useLocation();
  const projectIdMatch = location.match(/^\/projects\/(\d+)/);
  const projectId = projectIdMatch ? projectIdMatch[1] : undefined;

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
