import { useState, useMemo } from "react";
import { Link } from "wouter";
import { FolderKanban, Plus, CheckCircle2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useListProjects } from "@/departments/tech/lib/api-client";
import { ProjectDialog } from "@/departments/tech/components/dialogs/project-dialog";
import { format } from "date-fns";
import { useOrg } from "@/departments/tech/hooks/use-org";

function matchesSearch(p: { id: number; name: string; key: string; deadline?: string | null }, q: string) {
  if (!q) return true;
  const lower = q.toLowerCase().trim();
  if (String(p.id).includes(lower)) return true;
  if (p.name.toLowerCase().includes(lower)) return true;
  if (p.key.toLowerCase().includes(lower)) return true;
  if (p.deadline) {
    const formatted = format(new Date(p.deadline), "MMM d, yyyy").toLowerCase();
    const iso = p.deadline.toLowerCase();
    if (formatted.includes(lower) || iso.includes(lower)) return true;
  }
  return false;
}

export default function ProjectsList() {
  const { data: projects, isLoading } = useListProjects();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { canCreateProject } = useOrg();

  const filtered = useMemo(() => (projects ?? []).filter((p) => matchesSearch(p, search)), [projects, search]);
  const activeProjects = filtered.filter((p) => p.status !== "signed_off");
  const signedOffProjects = filtered.filter((p) => p.status === "signed_off");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your agile workspaces.</p>
        </div>
        {canCreateProject && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {/* Search bar */}
      {!isLoading && (projects?.length ?? 0) > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name, key, ID, or deadline…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-40">
              <CardHeader>
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects?.length === 0 || (search && filtered.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg border-dashed bg-card/50">
          {search ? (
            <>
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No projects match "{search}"</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                Try searching by project name, key, ID, or deadline date.
              </p>
              <Button variant="outline" onClick={() => setSearch("")}>
                <X className="mr-2 h-4 w-4" />
                Clear search
              </Button>
            </>
          ) : (
            <>
              <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No projects yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                {canCreateProject
                  ? "Create a project to start tracking your sprints, backlog, and issues."
                  : "No projects have been shared with you yet."}
              </p>
              {canCreateProject && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {/* Active projects */}
          {activeProjects.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover-elevate cursor-pointer transition-all border-l-4 border-l-primary h-full flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl line-clamp-1" title={project.name}>{project.name}</CardTitle>
                        <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-1 rounded">
                          {project.key}
                        </span>
                      </div>
                      <CardDescription>Created {format(new Date(project.createdAt), 'MMM d, yyyy')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description || "No description provided."}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Completed / Signed Off section */}
          {signedOffProjects.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h2 className="text-lg font-semibold">Completed / Signed Off</h2>
                <span className="text-sm text-muted-foreground">({signedOffProjects.length})</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {signedOffProjects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card className="hover-elevate cursor-pointer transition-all border-l-4 border-l-emerald-500 h-full flex flex-col opacity-80">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl line-clamp-1" title={project.name}>{project.name}</CardTitle>
                          <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-1 rounded">
                            {project.key}
                          </span>
                        </div>
                        <CardDescription>Created {format(new Date(project.createdAt), 'MMM d, yyyy')}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description || "No description provided."}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <ProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
