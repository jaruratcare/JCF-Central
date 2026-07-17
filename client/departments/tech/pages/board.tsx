import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetProjectSummary,
  useListProjectItems,
  useListSprints,
  useListProjectMembers,
  useUpdateItem,
  useCompleteSprint,
  WorkItemStatus,
  getListProjectItemsQueryKey,
  getGetProjectSummaryQueryKey,
  getListSprintsQueryKey,
  getListProjectMembersQueryKey,
  getGetBacklogQueryKey,
} from "@/departments/tech/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ItemTypeIcon, getTypeColor, getPriorityColor, resolveAssigneeName } from "@/departments/tech/components/item-utils";
import { ItemDialog } from "@/departments/tech/components/dialogs/item-dialog";
import { CompleteSprintDialog, type Disposition, type IncompleteItem } from "@/departments/tech/components/dialogs/complete-sprint-dialog";
import { Plus, CheckCircle, Milestone, User } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { useOrg } from "@/departments/tech/hooks/use-org";

const COLUMNS: { id: WorkItemStatus; label: string; accent: string; headerBg: string }[] = [
  { id: "todo",        label: "To Do",       accent: "border-t-slate-400",  headerBg: "bg-slate-50 dark:bg-slate-900/30" },
  { id: "in_progress", label: "In Progress", accent: "border-t-blue-500",   headerBg: "bg-blue-50 dark:bg-blue-950/30" },
  { id: "in_review",  label: "In Review",   accent: "border-t-amber-500",  headerBg: "bg-amber-50 dark:bg-amber-950/30" },
  { id: "done",       label: "Done",        accent: "border-t-emerald-500", headerBg: "bg-emerald-50 dark:bg-emerald-950/30" },
];

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-red-600",
  high:     "bg-orange-500",
  medium:   "bg-amber-400",
  low:      "bg-slate-400",
};

export default function Board() {
  const { projectId: projectIdStr } = useParams<{ projectId: string }>();
  const projectId = parseInt(projectIdStr!);
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<WorkItemStatus>("todo");
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completePending, setCompletePending] = useState(false);
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const { currentUser } = useOrg();

  const { data: summary, isLoading: loadingSummary } = useGetProjectSummary(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectSummaryQueryKey(projectId) },
  });

  const { data: members } = useListProjectMembers(projectId, {
    query: { enabled: !!projectId, queryKey: getListProjectMembersQueryKey(projectId) },
  });

  const { data: items, isLoading: loadingItems } = useListProjectItems(projectId, {
    query: { enabled: !!projectId, queryKey: getListProjectItemsQueryKey(projectId) },
  });

  const { data: sprints } = useListSprints(projectId, {
    query: { enabled: !!projectId, queryKey: getListSprintsQueryKey(projectId) },
  });

  const updateItem = useUpdateItem();
  const completeSprint = useCompleteSprint();

  const activeSprintId = summary?.activeSprint?.id;
  const sprintItems = (items ?? [])
    .filter((item) => item.sprintId === activeSprintId)
    .filter((item) => !myTasksOnly || item.assigneeId === currentUser?.id);

  /* ── Drag & Drop ── */
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as WorkItemStatus;
    const itemId = parseInt(result.draggableId);
    const current = sprintItems.find((i) => i.id === itemId);
    if (!current || current.status === newStatus) return;

    // Optimistic update
    queryClient.setQueryData(getListProjectItemsQueryKey(projectId), (old: typeof items) => {
      if (!old) return old;
      return old.map((i) => (i.id === itemId ? { ...i, status: newStatus } : i));
    });

    updateItem.mutate(
      { id: itemId, data: { status: newStatus } },
      {
        onError: () =>
          queryClient.invalidateQueries({ queryKey: getListProjectItemsQueryKey(projectId) }),
        onSuccess: () =>
          queryClient.invalidateQueries({ queryKey: getGetProjectSummaryQueryKey(projectId) }),
      }
    );
  };

  const handleOpenCreate = (status: WorkItemStatus) => {
    setCreateStatus(status);
    setCreateDialogOpen(true);
  };

  const handleCompleteConfirm = async (decisions: Record<number, Disposition>) => {
    if (!activeSprintId) return;
    setCompletePending(true);
    try {
      const moves = Object.entries(decisions).map(([idStr, disposition]) => {
        const itemId = parseInt(idStr);
        const newSprintId = disposition === "backlog" ? null : parseInt(disposition.replace("sprint-", ""));
        return updateItem.mutateAsync({ id: itemId, data: { sprintId: newSprintId } as any });
      });
      await Promise.all(moves);
      await completeSprint.mutateAsync({ id: activeSprintId });
      queryClient.invalidateQueries({ queryKey: getGetProjectSummaryQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: getListSprintsQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: getListProjectItemsQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: getGetBacklogQueryKey(projectId) });
      setCompleteDialogOpen(false);
    } finally {
      setCompletePending(false);
    }
  };

  if (loadingSummary || loadingItems) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-96 flex-1" />)}
        </div>
      </div>
    );
  }

  if (!summary?.activeSprint) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Board</h1>
          <p className="text-muted-foreground">No active sprint — start one to see the Kanban board.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl bg-card/50">
          <Milestone className="h-14 w-14 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No active sprint</h3>
          <p className="text-muted-foreground mb-6 max-w-sm text-sm">
            Go to <strong>Sprints</strong>, create or select a sprint, and click <strong>Start Sprint</strong>.
          </p>
          <Button asChild>
            <Link href={`/projects/${projectId}/sprints`}>Go to Sprints →</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { activeSprint } = summary;
  const doneItems  = sprintItems.filter((i) => i.status === "done").length;
  const totalItems = sprintItems.length;
  const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Sprint header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-5 flex-shrink-0 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{activeSprint.name}</h1>
            <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs px-2 py-0.5">
              Active
            </Badge>
          </div>
          {activeSprint.goal && (
            <p className="text-muted-foreground text-sm mt-0.5 truncate">{activeSprint.goal}</p>
          )}
          {/* Progress bar */}
          <div className="flex items-center gap-2 mt-2">
            <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{doneItems}/{totalItems} done</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <Toggle
            pressed={myTasksOnly}
            onPressedChange={setMyTasksOnly}
            size="sm"
            variant="outline"
            aria-label="Show only my tasks"
          >
            <User className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">My Tasks</span>
          </Toggle>
          <Button variant="outline" size="sm" onClick={() => handleOpenCreate("todo")}>
            <Plus className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Create Issue</span>
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setCompleteDialogOpen(true)}
            disabled={completePending}
          >
            <CheckCircle className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Complete Sprint</span>
          </Button>
        </div>
      </div>

      {/* Kanban board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1 items-start">
          {COLUMNS.map((col) => {
            const colItems = sprintItems.filter((i) => i.status === col.id);

            return (
              <div
                key={col.id}
                className={`flex-1 min-w-[240px] max-w-[320px] flex flex-col rounded-xl border border-border/60 border-t-4 ${col.accent} overflow-hidden`}
              >
                {/* Column header */}
                <div className={`${col.headerBg} px-3 py-2.5 flex items-center justify-between border-b border-border/40`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{col.label}</span>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 min-w-5 text-center">
                      {colItems.length}
                    </Badge>
                  </div>
                  <button
                    onClick={() => handleOpenCreate(col.id)}
                    className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title={`Add ${col.label} item`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Droppable area */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[120px] p-2 space-y-2 transition-colors ${
                        snapshot.isDraggingOver ? "bg-primary/5" : "bg-background/50"
                      }`}
                    >
                      {colItems.length === 0 && !snapshot.isDraggingOver && (
                        <button
                          onClick={() => handleOpenCreate(col.id)}
                          className="w-full h-16 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-muted-foreground/20 rounded-lg hover:border-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                        >
                          + Add issue
                        </button>
                      )}

                      {colItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                          {(drag, dragSnapshot) => (
                            <div
                              ref={drag.innerRef}
                              {...drag.draggableProps}
                              {...drag.dragHandleProps}
                              style={drag.draggableProps.style}
                            >
                              <Card
                                className={`border-border/50 transition-shadow ${
                                  dragSnapshot.isDragging
                                    ? "shadow-xl rotate-1 opacity-90"
                                    : "shadow-sm hover:shadow-md"
                                }`}
                              >
                                <CardContent className="p-3 space-y-2">
                                  {/* Type + key + points */}
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <ItemTypeIcon
                                        type={item.type}
                                        className={`w-3.5 h-3.5 flex-shrink-0 ${getTypeColor(item.type).split(" ")[0]}`}
                                      />
                                      <span className="text-[11px] font-mono text-muted-foreground truncate">
                                        {item.itemKey}
                                      </span>
                                    </div>
                                    {item.storyPoints != null && (
                                      <span className="text-[10px] bg-secondary text-secondary-foreground rounded-full w-5 h-5 flex items-center justify-center font-semibold flex-shrink-0">
                                        {item.storyPoints}
                                      </span>
                                    )}
                                  </div>

                                  {/* Title */}
                                  <Link
                                    href={`/projects/${projectId}/items/${item.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="block text-sm font-medium leading-snug line-clamp-2 hover:text-primary transition-colors"
                                  >
                                    {item.title}
                                  </Link>

                                  {/* Priority dot + assignee */}
                                  <div className="flex items-center justify-between pt-0.5">
                                    <div
                                      className={`w-2 h-2 rounded-full ${PRIORITY_DOT[item.priority] ?? "bg-slate-400"}`}
                                      title={`Priority: ${item.priority}`}
                                    />
                                    {(() => {
                                      const assigneeName = resolveAssigneeName(members, item.assigneeId);
                                      return assigneeName ? (
                                        <Avatar className="w-5 h-5 border" title={assigneeName}>
                                          <AvatarFallback className="text-[9px] bg-secondary">
                                            {assigneeName.slice(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                      ) : (
                                        <div
                                          className="w-5 h-5 rounded-full border border-dashed border-muted-foreground/30"
                                          title="Unassigned"
                                        />
                                      );
                                    })()}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}

                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <ItemDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) queryClient.invalidateQueries({ queryKey: getListProjectItemsQueryKey(projectId) });
        }}
        projectId={projectId}
        defaultSprintId={activeSprintId}
      />

      {activeSprint && (
        <CompleteSprintDialog
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
          sprint={activeSprint}
          incompleteItems={(sprintItems ?? [])
            .filter((i) => i.status !== "done")
            .map((i) => ({ id: i.id, type: i.type, title: i.title, status: i.status, itemKey: i.itemKey }))}
          nextSprints={(sprints ?? []).filter((s) => s.status === "planning")}
          onConfirm={handleCompleteConfirm}
          isPending={completePending}
        />
      )}
    </div>
  );
}
