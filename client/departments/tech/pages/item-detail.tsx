import { useState, useRef, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { 
  useGetItem,
  useUpdateItem,
  useDeleteItem,
  useListComments,
  useCreateComment,
  useDeleteComment,
  useListProjectItems,
  useGetProject,
  getGetItemQueryKey,
  getListCommentsQueryKey,
  getListProjectItemsQueryKey,
  getGetBacklogQueryKey,
  getGetProjectQueryKey,
  useListSprints,
  getListSprintsQueryKey,
  useListProjectMembers,
  getListProjectMembersQueryKey,
  WorkItemStatus,
  WorkItemPriority,
  WorkItemType,
} from "@/departments/tech/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Trash2, User, Plus, List, LayoutGrid, CornerDownRight } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ItemTypeIcon, getTypeColor, getPriorityColor } from "@/departments/tech/components/item-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { ItemDialog } from "@/departments/tech/components/dialogs/item-dialog";
import { Toggle } from "@/components/ui/toggle";


/** Maps a parent type to its expected child type. */
const CHILD_TYPE_FOR: Record<string, string | null> = {
  epic:    "story",
  story:   "task",
  task:    "subtask",
  bug:     null,
  subtask: null,
};

/** Maps each child type to its required parent type. */
const PARENT_TYPE_FOR: Record<string, string | null> = {
  epic:    null,
  story:   "epic",
  task:    "story",
  bug:     null,
  subtask: "task",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  in_review: "bg-amber-100 text-amber-700 border-amber-200",
  done: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const BOARD_COLS: { id: WorkItemStatus; label: string; accent: string }[] = [
  { id: "todo",        label: "To Do",       accent: "border-t-slate-400"  },
  { id: "in_progress", label: "In Progress", accent: "border-t-blue-500"   },
  { id: "in_review",  label: "In Review",   accent: "border-t-amber-500"  },
  { id: "done",       label: "Done",        accent: "border-t-emerald-500" },
];

export default function ItemDetail() {
  const { projectId: projectIdStr, itemId: itemIdStr } = useParams<{ projectId: string, itemId: string }>();
  const projectId = parseInt(projectIdStr!);
  const itemId = parseInt(itemIdStr!);
  const queryClient = useQueryClient();

  const { data: item, isLoading } = useGetItem(itemId, { query: { enabled: !!itemId, queryKey: getGetItemQueryKey(itemId) } });
  const { data: comments, isLoading: loadingComments } = useListComments(itemId, { query: { enabled: !!itemId, queryKey: getListCommentsQueryKey(itemId) } });
  const { data: sprints } = useListSprints(projectId, { query: { enabled: !!projectId, queryKey: getListSprintsQueryKey(projectId) } });
  const { data: members } = useListProjectMembers(projectId, { query: { enabled: !!projectId, queryKey: getListProjectMembersQueryKey(projectId) } });
  const { data: allItems } = useListProjectItems(projectId, { query: { enabled: !!projectId, queryKey: getListProjectItemsQueryKey(projectId) } });
  const { data: project } = useGetProject(projectId, { query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) } });

  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  // Server requires "editor" access to delete a comment — same rule as adding one.
  const canDeleteComments = project?.accessLevel === "manage" || project?.accessLevel === "editor";
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Local state for inline editing
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newComment, setNewComment] = useState("");
  const [childrenView, setChildrenView] = useState<"list" | "board">("list");
  const [addChildOpen, setAddChildOpen] = useState(false);
  const initRef = useRef(false);

   // Reset init when navigating to a different item
  useEffect(() => {
    initRef.current = false;
  }, [itemId]);

  const handleUpdateField = (field: string, value: any) => {
    if (!item) return;
    
    updateItem.mutate({ id: itemId, data: { [field]: value } as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetItemQueryKey(itemId) });
        queryClient.invalidateQueries({ queryKey: getListProjectItemsQueryKey(projectId) });
      }
    });
  };

  const handleUpdateParent = (parentItemId: number | null) => {
    if (!item) return;
    updateItem.mutate({ id: itemId, data: { parentItemId } as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetItemQueryKey(itemId) });
        queryClient.invalidateQueries({ queryKey: getListProjectItemsQueryKey(projectId) });
        queryClient.invalidateQueries({ queryKey: getGetBacklogQueryKey(projectId) });
        toast({
          title: parentItemId ? "Parent linked" : "Parent detached",
          description: parentItemId
            ? "This item is now linked to a parent."
            : "This item is no longer linked to a parent.",
        });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? err?.message ?? "Something went wrong";
        toast({ title: "Failed to update parent", description: msg, variant: "destructive" });
      },
    });
  };

  const handleSaveText = () => {
    if (!item || (title === item.title && description === (item.description || ""))) return;
    
    updateItem.mutate({
      id: itemId,
      data: { title, description } as any
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetItemQueryKey(itemId) });
      }
    });
  };

  const handleDelete = () => {
    deleteItem.mutate({ id: itemId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectItemsQueryKey(projectId) });
        queryClient.invalidateQueries({ queryKey: getGetBacklogQueryKey(projectId) });
        navigate(`/projects/${projectId}/board`);
      }
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    createComment.mutate({
      itemId,
      data: { content: newComment, author: "Current User" }
    }, {
      onSuccess: () => {
        setNewComment("");
        queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(itemId) });
      }
    });
  };

  const handleDeleteComment = (commentId: number) => {
    deleteComment.mutate({ id: commentId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(itemId) });
      }
    });
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-32" /><Skeleton className="h-12 w-2/3" /><div className="flex gap-8"><Skeleton className="flex-1 h-64" /><Skeleton className="w-80 h-96" /></div></div>;
  }

  if (!item) return <div>Item not found</div>;

  // Derive hierarchy relationships from all project items
  const parentItem = item.parentItemId
    ? (allItems ?? []).find((i) => i.id === item.parentItemId)
    : null;
  const children = (allItems ?? []).filter((i) => i.parentItemId === item.id);
  const allowedParentType = item?.type ? PARENT_TYPE_FOR[item.type] : null;
  const parentCandidates = allowedParentType
    ? (allItems ?? []).filter((candidate) => candidate.type === allowedParentType && candidate.id !== item?.id)
    : [];
  const childType = CHILD_TYPE_FOR[item.type];

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto pb-12">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap text-sm text-muted-foreground">
        <div className="flex items-center min-w-0 gap-1.5 flex-wrap">
          <Link href={`/projects/${projectId}/board`} className="hover:text-foreground flex items-center flex-shrink-0">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
          {/* Parent breadcrumb */}
          {parentItem && (
            <>
              <span>/</span>
              <Link
                href={`/projects/${projectId}/items/${parentItem.id}`}
                className="flex items-center gap-1 hover:text-foreground min-w-0"
              >
                <ItemTypeIcon type={parentItem.type} className={`w-3.5 h-3.5 flex-shrink-0 ${getTypeColor(parentItem.type).split(" ")[0]}`} />
                <span className="font-mono truncate">{parentItem.itemKey}</span>
              </Link>
            </>
          )}

          <span>/</span>
          <ItemTypeIcon type={item.type} className={`w-4 h-4 mr-0.5 flex-shrink-0 ${getTypeColor(item.type).split(" ")[0]}`} />
          <span className="font-mono truncate">{item.itemKey}</span>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete work item?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{item.itemKey}</strong>
                {children.length > 0 && ` and its ${children.length} child item${children.length === 1 ? "" : "s"}`}.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteItem.isPending}
              >
                {deleteItem.isPending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content Area */}
        <div className="flex-1 space-y-6 min-w-0">
          <div className="space-y-4">
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              onBlur={handleSaveText}
              className="text-3xl font-bold border-transparent px-0 hover:border-input focus-visible:ring-0 focus-visible:border-input transition-colors bg-transparent shadow-none"
            />
            
            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-1 block">Description</label>
              <Textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                onBlur={handleSaveText}
                placeholder="Add a description..."
                className="min-h-[200px] border-transparent hover:border-input focus-visible:ring-0 focus-visible:border-input transition-colors resize-y bg-muted/20"
              />
            </div>
          </div>

          {/* ── Children Section ── */}
          {childType && (
            <>
              <Separator />
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <CornerDownRight className="w-4 h-4 text-muted-foreground" />
                    {childType.charAt(0).toUpperCase() + childType.slice(1)}s
                    {children.length > 0 && (
                      <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                        {children.length}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    {children.length > 0 && (
                      <div className="flex rounded-md border overflow-hidden">
                        <button
                          onClick={() => setChildrenView("list")}
                          className={`px-2 py-1 text-xs flex items-center gap-1 transition-colors ${
                            childrenView === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          <List className="w-3 h-3" /> List
                        </button>
                        <button
                          onClick={() => setChildrenView("board")}
                          className={`px-2 py-1 text-xs flex items-center gap-1 border-l transition-colors ${
                            childrenView === "board" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          <LayoutGrid className="w-3 h-3" /> Board
                        </button>
                      </div>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setAddChildOpen(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add {childType}
                    </Button>
                  </div>
                </div>

                {children.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <p className="text-sm text-muted-foreground">No {childType}s yet.</p>
                    <Button size="sm" variant="ghost" className="mt-2" onClick={() => setAddChildOpen(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add first {childType}
                    </Button>
                  </div>
                ) : childrenView === "list" ? (
                  /* List view */
                  <div className="space-y-1.5">
                    {children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/projects/${projectId}/items/${child.id}`}
                        className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors group"
                      >
                        <ItemTypeIcon
                          type={child.type}
                          className={`w-4 h-4 flex-shrink-0 ${getTypeColor(child.type).split(" ")[0]}`}
                        />
                        <span className="font-mono text-xs text-muted-foreground flex-shrink-0">{child.itemKey}</span>
                        <span className="flex-1 text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {child.title}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${STATUS_COLORS[child.status] ?? ""}`}>
                          {STATUS_LABELS[child.status] ?? child.status}
                        </span>
                        {child.storyPoints != null && (
                          <span className="text-[10px] bg-secondary text-secondary-foreground rounded-full w-5 h-5 flex items-center justify-center font-semibold flex-shrink-0">
                            {child.storyPoints}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  /* Board view — read-only mini kanban */
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {BOARD_COLS.map((col) => {
                      const colChildren = children.filter((c) => c.status === col.id);
                      return (
                        <div
                          key={col.id}
                          className={`flex-1 min-w-[180px] rounded-lg border border-t-2 ${col.accent} bg-background/50`}
                        >
                          <div className="px-2.5 py-2 flex items-center gap-1.5 border-b">
                            <span className="text-xs font-semibold">{col.label}</span>
                            <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5">{colChildren.length}</span>
                          </div>
                          <div className="p-1.5 space-y-1.5 min-h-[80px]">
                            {colChildren.map((child) => (
                              <Link
                                key={child.id}
                                href={`/projects/${projectId}/items/${child.id}`}
                                className="block p-2 rounded-md border bg-card hover:bg-muted/40 transition-colors"
                              >
                                <div className="flex items-center gap-1.5 mb-1">
                                  <ItemTypeIcon
                                    type={child.type}
                                    className={`w-3 h-3 flex-shrink-0 ${getTypeColor(child.type).split(" ")[0]}`}
                                  />
                                  <span className="font-mono text-[10px] text-muted-foreground">{child.itemKey}</span>
                                </div>
                                <p className="text-xs font-medium line-clamp-2">{child.title}</p>
                              </Link>
                            ))}
                            {colChildren.length === 0 && (
                              <p className="text-[11px] text-muted-foreground/50 text-center py-3">Empty</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Comments Section */}
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" /> Comments
            </h3>
            
            <div className="flex gap-3 mb-6">
              <Avatar className="w-8 h-8 mt-1">
                <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[80px]"
                />
                <Button 
                  onClick={handleAddComment} 
                  disabled={!newComment.trim() || createComment.isPending}
                >
                  Save Comment
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {loadingComments ? (
                <Skeleton className="h-24 w-full" />
              ) : comments?.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No comments yet.</p>
              ) : (
                comments?.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{comment.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="flex items-baseline gap-2 min-w-0">
                          <span className="font-semibold text-sm">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.createdAt), 'MMM d, yyyy • h:mm a')}
                          </span>
                        </div>
                        {canDeleteComments && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this comment. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                  disabled={deleteComment.isPending}
                                >
                                  {deleteComment.isPending ? "Deleting…" : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                      <div className="text-sm bg-muted/30 p-3 rounded-md border border-border/50">
                        {comment.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-80 space-y-6 flex-shrink-0">
          <div className="bg-card border rounded-lg p-5 space-y-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Status</label>
              <Select value={item.status} onValueChange={(v) => handleUpdateField('status', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Parent item — show for types that can have a parent */}
            {CHILD_TYPE_FOR[item.type] !== undefined && item.type !== "epic" && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Parent
                </label>
                {allowedParentType ? (
                  <Select
                    value={item.parentItemId?.toString() || "none"}
                    onValueChange={(value) => handleUpdateParent(value === "none" ? null : parseInt(value, 10))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select parent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No parent</SelectItem>
                      {parentCandidates.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                          No compatible parent items found
                        </div>
                      ) : (
                        parentCandidates.map((candidate) => (
                          <SelectItem key={candidate.id} value={candidate.id.toString()}>
                            <div className="flex items-center gap-2">
                              <ItemTypeIcon
                                type={candidate.type as any}
                                className={`w-3.5 h-3.5 flex-shrink-0 ${getTypeColor(candidate.type as any).split(" ")[0]}`}
                              />
                              <span className="font-mono text-xs text-muted-foreground">{candidate.itemKey}</span>
                              <span className="truncate">{candidate.title}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  parentItem ? (
                    <Link
                      href={`/projects/${projectId}/items/${parentItem.id}`}
                      className="flex items-center gap-2 p-2 rounded-md border bg-muted/30 hover:bg-muted/60 transition-colors text-sm"
                    >
                      <ItemTypeIcon
                        type={parentItem.type}
                        className={`w-3.5 h-3.5 flex-shrink-0 ${getTypeColor(parentItem.type).split(" ")[0]}`}
                      />
                      <span className="font-mono text-xs text-muted-foreground">{parentItem.itemKey}</span>
                      <span className="truncate">{parentItem.title}</span>
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No parent set</p>
                  )
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Assignee</label>
              <Select
                value={item.assigneeId || "unassigned"}
                onValueChange={(v) => handleUpdateField('assigneeId', v === "unassigned" ? null : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members?.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>{m.name ?? m.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Priority</label>
              <Select value={item.priority} onValueChange={(v) => handleUpdateField('priority', v)}>
                <SelectTrigger className="w-full flex items-center">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low"><div className="flex items-center"><div className="w-2 h-2 rounded-full bg-slate-500 mr-2"/>Low</div></SelectItem>
                  <SelectItem value="medium"><div className="flex items-center"><div className="w-2 h-2 rounded-full bg-amber-500 mr-2"/>Medium</div></SelectItem>
                  <SelectItem value="high"><div className="flex items-center"><div className="w-2 h-2 rounded-full bg-orange-500 mr-2"/>High</div></SelectItem>
                  <SelectItem value="critical"><div className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-600 mr-2"/>Critical</div></SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Sprint</label>
              <Select 
                value={item.sprintId?.toString() || "none"} 
                onValueChange={(v) => handleUpdateField('sprintId', v === "none" ? null : parseInt(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Sprint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Backlog (No Sprint)</SelectItem>
                  {sprints?.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Due Date</label>
              <Input
                type="date"
                value={item.dueDate ? item.dueDate.slice(0, 10) : ""}
                onChange={(e) => handleUpdateField('dueDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Story Points</label>
              <Input 
                type="number"
                min="0"
                value={item.storyPoints || ""} 
                onChange={(e) => handleUpdateField('storyPoints', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="None"
              />
            </div>

            <Separator />
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Created: {format(new Date(item.createdAt), 'MMM d, yyyy')}</div>
              {item.updatedAt && <div>Updated: {format(new Date(item.updatedAt), 'MMM d, yyyy')}</div>}
            </div>
          </div>
        </div>
      </div>
      {/* Add Child Dialog */}
      {childType && (
        <ItemDialog
          open={addChildOpen}
          onOpenChange={(open) => {
            setAddChildOpen(open);
            if (!open) {
              queryClient.invalidateQueries({ queryKey: getListProjectItemsQueryKey(projectId) });
            }
          }}
          projectId={projectId}
          defaultType={childType}
          defaultParentId={item.id}
        />
      )}
    </div>
  );
}
