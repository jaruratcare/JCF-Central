import { useParams } from "wouter";
import { useGetProject, useListProjectMembers, getGetProjectQueryKey, getListProjectMembersQueryKey } from "@/departments/tech/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarDays, Info, Users } from "lucide-react";
import { format } from "date-fns";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const ROLE_COLORS: Record<string, string> = {
  manager: "bg-violet-100 text-violet-700 border-violet-200",
  editor: "bg-blue-100 text-blue-700 border-blue-200",
  viewer: "bg-slate-100 text-slate-600 border-slate-200",
};

const ROLE_LABELS: Record<string, string> = {
  manager: "Manager",
  editor: "Editor",
  viewer: "Viewer",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  planning: "bg-amber-100 text-amber-700 border-amber-200",
  on_hold: "bg-orange-100 text-orange-700 border-orange-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  signed_off: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function About() {
  const { projectId: projectIdStr } = useParams<{ projectId: string }>();
  const projectId = parseInt(projectIdStr!);

  const { data: project, isLoading: loadingProject } = useGetProject(projectId, {
    query: { queryKey: getGetProjectQueryKey(projectId) },
  });
  const { data: members, isLoading: loadingMembers } = useListProjectMembers(projectId, {
    query: { queryKey: getListProjectMembersQueryKey(projectId) },
  });

  if (loadingProject) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!project) return <div className="text-muted-foreground">Project not found.</div>;

  const statusLabel = (project.status as string)?.replace(/_/g, " ") ?? "active";

  return (
    <div className="max-w-2xl space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
            {project.key}
          </span>
          <Badge
            variant="outline"
            className={STATUS_COLORS[project.status as string] ?? STATUS_COLORS.active}
          >
            {statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{project.name}</h1>
      </div>

      {/* Description */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Info className="h-4 w-4" /> About
        </h2>
        <div className="rounded-lg border bg-card p-4 text-sm leading-relaxed text-card-foreground">
          {project.description ? (
            <p className="whitespace-pre-wrap">{project.description}</p>
          ) : (
            <p className="italic text-muted-foreground">No description provided.</p>
          )}
        </div>
      </section>

      {/* Deadline */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <CalendarDays className="h-4 w-4" /> Deadline
        </h2>
        <div className="rounded-lg border bg-card p-4 text-sm text-card-foreground">
          {project.deadline ? (
            <span className="font-medium">
              {format(new Date(project.deadline), "MMMM d, yyyy")}
            </span>
          ) : (
            <span className="italic text-muted-foreground">No deadline set.</span>
          )}
        </div>
      </section>

      {/* Members */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Users className="h-4 w-4" /> Team Members
        </h2>
        <div className="rounded-lg border bg-card divide-y">
          {loadingMembers ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : members && members.length > 0 ? (
            members.map((m) => (
              <div key={m.userId} className="flex items-center gap-3 px-4 py-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(m.name ?? m.email ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.name ?? m.email}</p>
                  {m.name && <p className="text-xs text-muted-foreground truncate">{m.email}</p>}
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${ROLE_COLORS[m.roleInProject] ?? ROLE_COLORS.viewer}`}
                >
                  {ROLE_LABELS[m.roleInProject] ?? m.roleInProject}
                </Badge>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground italic">
              No members added yet. Use project settings to add team members.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
