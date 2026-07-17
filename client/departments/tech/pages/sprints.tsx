import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useListSprints,
  useListProjectItems,
  useListProjectMembers,
  useStartSprint,
  useCompleteSprint,
  useUpdateItem,
  getListSprintsQueryKey,
  getGetProjectSummaryQueryKey,
  getListProjectItemsQueryKey,
  getGetBacklogQueryKey,
  getListProjectMembersQueryKey,
} from "@/departments/tech/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Plus, Play, CheckCircle, Calendar, Target, ChevronDown, ChevronRight,
  ExternalLink,
} from "lucide-react";
import { SprintDialog } from "@/departments/tech/components/dialogs/sprint-dialog";
import { CompleteSprintDialog, type Disposition, type IncompleteItem } from "@/departments/tech/components/dialogs/complete-sprint-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemTypeIcon, getTypeColor, resolveAssigneeName } from "@/departments/tech/components/item-utils";
import { format } from "date-fns";

const STATUS_BADGE: Record<string, string> = {
  todo: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  in_review: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

export default function Sprints() {
  const { projectId: projectIdStr } = useParams<{ projectId: string }>();
  const projectId = parseInt(projectIdStr!);
  const queryClient = useQueryClient();

  const { data: sprints, isLoading } = useListSprints(projectId, {
    query: { enabled: !!projectId, queryKey: getListSprintsQueryKey(projectId) },
  });
  const { data: allItems } = useListProjectItems(projectId, {
    query: { enabled: !!projectId, queryKey: getListProjectItemsQueryKey(projectId) },
  });
  const { data: members } = useListProjectMembers(projectId, {
    query: { enabled: !!projectId, queryKey: getListProjectMembersQueryKey(projectId) },
  });

  const startSprint = useStartSprint();
  const completeSprint = useCompleteSprint();
  const updateItem = useUpdateItem();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<any>(null);
  const [expandedSprints, setExpandedSprints] = useState<Set<number>>(new Set());
  const [completingSprintId, setCompletingSprintId] = useState<number | null>(null);
  const [completePending, setCompletePending] = useState(false);

  const toggleExpand = (id: number) => {
    setExpandedSprints((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleStart = (id: number) => {
    startSprint.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSprintsQueryKey(projectId) });
        queryClient.invalidateQueries({ queryKey: getGetProjectSummaryQueryKey(projectId) });
      },
    });
  };

  const handleCompleteClick = (sprintId: number) => {
    setCompletingSprintId(sprintId);
  };

  const handleCompleteConfirm = async (decisions: Record<number, Disposition>) => {
    if (!completingSprintId) return;
    setCompletePending(true);

    try {
      // Apply item moves
      const movePromises = Object.entries(decisions).map(([idStr, disposition]) => {
        const itemId = parseInt(idStr);
        const newSprintId = disposition === "backlog"
          ? null
          : parseInt(disposition.replace("sprint-", ""));
        return updateItem.mutateAsync({ id: itemId, data: { sprintId: newSprintId } as any });
      });
      await Promise.all(movePromises);

      // Complete the sprint
      await completeSprint.mutateAsync({ id: completingSprintId });

      queryClient.invalidateQueries({ queryKey: getListSprintsQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: getGetProjectSummaryQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: getListProjectItemsQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: getGetBacklogQueryKey(projectId) });

      setCompletingSprintId(null);
    } finally {
      setCompletePending(false);
    }
  };

  const hasActiveSprint = sprints?.some((s) => s.status === "active");

  const sortedSprints = [...(sprints ?? [])].sort((a, b) => {
    const order: Record<string, number> = { active: 0, planning: 1, completed: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  const completingSprint = sprints?.find((s) => s.id === completingSprintId);
  const incompleteItems: IncompleteItem[] = (allItems ?? [])
    .filter((i) => i.sprintId === completingSprintId && i.status !== "done")
    .map((i) => ({ id: i.id, type: i.type, title: i.title, status: i.status, itemKey: i.itemKey }));
  const nextSprints = (sprints ?? []).filter((s) => s.status === "planning");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sprints</h1>
          <p className="text-muted-foreground">Manage your sprint lifecycle. Click a sprint to see its items.</p>
        </div>
        <Button className="flex-shrink-0" onClick={() => { setEditingSprint(null); setCreateDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> <span className="hidden xs:inline">Create </span>Sprint
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : sortedSprints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl border-dashed bg-card/50">
          <Target className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold">No sprints yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Create a sprint to group your backlog items into a focused timebox.
          </p>
          <Button onClick={() => { setEditingSprint(null); setCreateDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Create Sprint
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedSprints.map((sprint) => {
            const sprintItems = (allItems ?? []).filter((i) => i.sprintId === sprint.id);
            const doneItems = sprintItems.filter((i) => i.status === "done");
            const pct = sprintItems.length > 0
              ? Math.round((doneItems.length / sprintItems.length) * 100)
              : 0;
            const isExpanded = expandedSprints.has(sprint.id);
            const isActive = sprint.status === "active";
            const isCompleted = sprint.status === "completed";

            return (
              <Card
                key={sprint.id}
                className={`${isActive ? "border-primary shadow-sm" : ""} overflow-hidden`}
              >
                {/* Clickable header row */}
                <CardHeader
                  className="pb-3 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                  onClick={() => toggleExpand(sprint.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Expand chevron */}
                      <div className="mt-0.5 text-muted-foreground flex-shrink-0">
                        {isExpanded
                          ? <ChevronDown className="h-4 w-4" />
                          : <ChevronRight className="h-4 w-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{sprint.name}</CardTitle>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : isCompleted
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-amber-500/10 text-amber-600"
                          }`}>
                            {sprint.status}
                          </span>
                        </div>

                        {(sprint.startDate || sprint.endDate) && (
                          <CardDescription className="flex items-center mt-1 text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {sprint.startDate ? format(new Date(sprint.startDate), "MMM d, yyyy") : "?"}{" — "}
                            {sprint.endDate ? format(new Date(sprint.endDate), "MMM d, yyyy") : "?"}
                          </CardDescription>
                        )}

                        {sprint.goal && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{sprint.goal}</p>
                        )}
                      </div>
                    </div>

                    {/* Right: progress + actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end" onClick={(e) => e.stopPropagation()}>
                      {/* Progress */}
                      {sprintItems.length > 0 && (
                        <div className="hidden sm:flex items-center gap-2">
                          <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {doneItems.length}/{sprintItems.length}
                          </span>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => { setEditingSprint(sprint); setCreateDialogOpen(true); }}
                      >
                        Edit
                      </Button>

                      {sprint.status === "planning" && (
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          disabled={!!hasActiveSprint || startSprint.isPending}
                          onClick={() => handleStart(sprint.id)}
                        >
                          <Play className="w-3.5 h-3.5 mr-1" /> Start
                        </Button>
                      )}

                      {sprint.status === "active" && (
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleCompleteClick(sprint.id)}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Expanded items list */}
                {isExpanded && (
                  <CardContent className="pt-0 pb-4 px-0">
                    <div className="border-t">
                      {sprintItems.length === 0 ? (
                        <div className="px-10 py-5 text-sm text-muted-foreground text-center">
                          No items in this sprint. Add items from the{" "}
                          <Link href={`/projects/${projectId}/backlog`} className="text-primary hover:underline">
                            Backlog
                          </Link>.
                        </div>
                      ) : (
                        <div className="divide-y">
                          {sprintItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 px-4 sm:px-10 py-2.5 hover:bg-muted/20 transition-colors"
                            >
                              <ItemTypeIcon
                                type={item.type}
                                className={`w-3.5 h-3.5 flex-shrink-0 ${getTypeColor(item.type).split(" ")[0]}`}
                              />
                              <span className="text-[11px] font-mono text-muted-foreground w-16 flex-shrink-0">
                                {item.itemKey}
                              </span>
                              <Link
                                href={`/projects/${projectId}/items/${item.id}`}
                                className="flex-1 text-sm font-medium truncate hover:text-primary transition-colors min-w-0"
                              >
                                {item.title}
                              </Link>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_BADGE[item.status] ?? ""}`}
                                >
                                  {item.status.replace("_", " ")}
                                </span>
                                {item.storyPoints != null && (
                                  <span className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-[10px] flex items-center justify-center font-semibold">
                                    {item.storyPoints}
                                  </span>
                                )}
                                {resolveAssigneeName(members, item.assigneeId) && (
                                  <span className="hidden sm:inline text-xs text-muted-foreground">{resolveAssigneeName(members, item.assigneeId)}</span>
                                )}
                                <Link
                                  href={`/projects/${projectId}/items/${item.id}`}
                                  className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                  title="Open item"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <SprintDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
        sprint={editingSprint}
      />

      {completingSprint && (
        <CompleteSprintDialog
          open={!!completingSprintId}
          onOpenChange={(open) => { if (!open) setCompletingSprintId(null); }}
          sprint={completingSprint}
          incompleteItems={incompleteItems}
          nextSprints={nextSprints}
          onConfirm={handleCompleteConfirm}
          isPending={completePending}
        />
      )}
    </div>
  );
}
