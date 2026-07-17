import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useListProjectItems,
  useListSprints,
  useListProjectMembers,
  useUpdateItem,
  getListProjectItemsQueryKey,
  getGetBacklogQueryKey,
  getListProjectMembersQueryKey,
} from "@/departments/tech/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, GripVertical } from "lucide-react";
import { ItemDialog } from "@/departments/tech/components/dialogs/item-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemTypeIcon, getTypeColor, getPriorityColor, resolveAssigneeName } from "@/departments/tech/components/item-utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getListSprintsQueryKey } from "@/departments/tech/lib/api-client";

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-red-600",
  high: "bg-orange-500",
  medium: "bg-amber-400",
  low: "bg-slate-400",
};

const STATUS_BADGE: Record<string, string> = {
  todo: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  in_review: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

export default function Backlog() {
  const { projectId: projectIdStr } = useParams<{ projectId: string }>();
  const projectId = parseInt(projectIdStr!);
  const queryClient = useQueryClient();

  const { data: members } = useListProjectMembers(projectId, {
    query: { enabled: !!projectId, queryKey: getListProjectMembersQueryKey(projectId) },
  });

  const { data: allItems, isLoading: loadingItems } = useListProjectItems(projectId, {
    query: { enabled: !!projectId, queryKey: getListProjectItemsQueryKey(projectId) },
  });
  const { data: sprints, isLoading: loadingSprints } = useListSprints(projectId, {
    query: { enabled: !!projectId, queryKey: getListSprintsQueryKey(projectId) },
  });

  const updateItem = useUpdateItem();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createSprintId, setCreateSprintId] = useState<number | null>(null);

  const isLoading = loadingItems || loadingSprints;

  // Active + planning sprints only (not completed)
  const activeSprints = (sprints ?? [])
    .filter((s) => s.status !== "completed")
    .sort((a, b) => {
      const order: Record<string, number> = { active: 0, planning: 1 };
      return (order[a.status] ?? 2) - (order[b.status] ?? 2);
    });

  const itemsInSprint = (sprintId: number) =>
    (allItems ?? []).filter((i) => i.sprintId === sprintId);
  const backlogItems = (allItems ?? []).filter((i) => i.sprintId == null);

  /* ── Drag & Drop ── */
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const itemId = parseInt(result.draggableId);
    const dest = result.destination.droppableId;

    let newSprintId: number | null = null;
    if (dest !== "backlog") {
      newSprintId = parseInt(dest.replace("sprint-", ""));
    }

    const item = allItems?.find((i) => i.id === itemId);
    if (!item) return;
    if (item.sprintId === newSprintId) return;

    // Optimistic update
    queryClient.setQueryData(getListProjectItemsQueryKey(projectId), (old: typeof allItems) =>
      old ? old.map((i) => (i.id === itemId ? { ...i, sprintId: newSprintId } : i)) : old
    );

    updateItem.mutate(
      { id: itemId, data: { sprintId: newSprintId } as any },
      {
        onError: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectItemsQueryKey(projectId) });
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBacklogQueryKey(projectId) });
        },
      }
    );
  };

  const openCreate = (sprintId: number | null) => {
    setCreateSprintId(sprintId);
    setCreateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Backlog</h1>
        <p className="text-muted-foreground">Drag items between sprints or into the backlog.</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="space-y-5">
          {/* Sprint sections */}
          {activeSprints.map((sprint) => {
            const items = itemsInSprint(sprint.id);
            const doneCount = items.filter((i) => i.status === "done").length;

            return (
              <div key={sprint.id} className="border rounded-xl overflow-hidden shadow-sm">
                {/* Sprint header */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                        sprint.status === "active"
                          ? "bg-primary/10 text-primary"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {sprint.status}
                    </span>
                    <h3 className="font-semibold text-sm truncate">{sprint.name}</h3>
                    {sprint.goal && (
                      <span className="text-xs text-muted-foreground truncate hidden md:block">
                        — {sprint.goal}
                      </span>
                    )}
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 flex-shrink-0">
                      {doneCount}/{items.length}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs flex-shrink-0" onClick={() => openCreate(sprint.id)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>

                {/* Droppable item list */}
                <Droppable droppableId={`sprint-${sprint.id}`}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`divide-y min-h-[48px] transition-colors ${
                        snapshot.isDraggingOver ? "bg-primary/5" : "bg-card"
                      }`}
                    >
                      {items.length === 0 && !snapshot.isDraggingOver && (
                        <div className="py-4 text-center text-xs text-muted-foreground">
                          No items — drag here or{" "}
                          <button onClick={() => openCreate(sprint.id)} className="text-primary hover:underline">
                            add one
                          </button>
                        </div>
                      )}

                      {items.map((item, index) => (
                        <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                          {(drag, dragSnapshot) => (
                            <div
                              ref={drag.innerRef}
                              {...drag.draggableProps}
                              style={drag.draggableProps.style}
                              className={`flex items-center gap-3 px-4 py-2.5 group transition-colors ${
                                dragSnapshot.isDragging
                                  ? "shadow-lg bg-card border border-border/60 rounded-lg opacity-95"
                                  : "hover:bg-muted/30"
                              }`}
                            >
                              {/* Drag handle */}
                              <div
                                {...drag.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 flex-shrink-0"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>

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
                                  className={`hidden sm:inline text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_BADGE[item.status] ?? ""}`}
                                >
                                  {item.status.replace("_", " ")}
                                </span>

                                {item.storyPoints != null && (
                                  <span className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-[10px] flex items-center justify-center font-semibold">
                                    {item.storyPoints}
                                  </span>
                                )}

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
                                    <div className="w-5 h-5 rounded-full border border-dashed border-muted-foreground/30" />
                                  );
                                })()}
                              </div>
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

          {/* Backlog section */}
          <div className="border rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-sm">Backlog</h3>
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {backlogItems.length}
                </Badge>
                <span className="hidden sm:inline text-xs text-muted-foreground">Items with no sprint</span>
              </div>
              <Button size="sm" className="h-7 text-xs flex-shrink-0" onClick={() => openCreate(null)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Create
              </Button>
            </div>

            <Droppable droppableId="backlog">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`divide-y min-h-[60px] transition-colors ${
                    snapshot.isDraggingOver ? "bg-primary/5" : "bg-card"
                  }`}
                >
                  {backlogItems.length === 0 && !snapshot.isDraggingOver && (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Backlog is empty — drag items here or{" "}
                      <button onClick={() => openCreate(null)} className="text-primary hover:underline">
                        create one
                      </button>
                    </div>
                  )}

                  {backlogItems.map((item, index) => (
                    <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                      {(drag, dragSnapshot) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          style={drag.draggableProps.style}
                          className={`flex items-center gap-3 px-4 py-2.5 group transition-colors ${
                            dragSnapshot.isDragging
                              ? "shadow-lg bg-card border border-border/60 rounded-lg opacity-95"
                              : "hover:bg-muted/30"
                          }`}
                        >
                          <div
                            {...drag.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 flex-shrink-0"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>

                          <ItemTypeIcon
                            type={item.type}
                            className={`w-3.5 h-3.5 flex-shrink-0 ${getTypeColor(item.type).split(" ")[0]}`}
                          />
                          <span className="text-[11px] font-mono text-muted-foreground w-14 flex-shrink-0">
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
                              className={`hidden sm:inline text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_BADGE[item.status] ?? ""}`}
                            >
                              {item.status.replace("_", " ")}
                            </span>

                            {item.storyPoints != null && (
                              <span className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-[10px] flex items-center justify-center font-semibold">
                                {item.storyPoints}
                              </span>
                            )}

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
                                <div className="w-5 h-5 rounded-full border border-dashed border-muted-foreground/30" />
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>

      <ItemDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) queryClient.invalidateQueries({ queryKey: getListProjectItemsQueryKey(projectId) });
        }}
        projectId={projectId}
        defaultSprintId={createSprintId}
      />
    </div>
  );
}
