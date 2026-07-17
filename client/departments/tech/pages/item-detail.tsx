import { useState, useRef, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { 
  useGetItem, 
  useUpdateItem,
  useDeleteItem,
  useListComments,
  useCreateComment,
  getGetItemQueryKey,
  getListCommentsQueryKey,
  getListProjectItemsQueryKey,
  getGetBacklogQueryKey,
  useListSprints,
  getListSprintsQueryKey,
  useListProjectMembers,
  getListProjectMembersQueryKey,
  WorkItemStatus,
  WorkItemPriority,
  WorkItemType
} from "@/departments/tech/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MessageSquare, Trash2, User } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

export default function ItemDetail() {
  const { projectId: projectIdStr, itemId: itemIdStr } = useParams<{ projectId: string, itemId: string }>();
  const projectId = parseInt(projectIdStr!);
  const itemId = parseInt(itemIdStr!);
  const queryClient = useQueryClient();

  const { data: item, isLoading } = useGetItem(itemId, { query: { enabled: !!itemId, queryKey: getGetItemQueryKey(itemId) } });
  const { data: comments, isLoading: loadingComments } = useListComments(itemId, { query: { enabled: !!itemId, queryKey: getListCommentsQueryKey(itemId) } });
  const { data: sprints } = useListSprints(projectId, { query: { enabled: !!projectId, queryKey: getListSprintsQueryKey(projectId) } });
  const { data: members } = useListProjectMembers(projectId, { query: { enabled: !!projectId, queryKey: getListProjectMembersQueryKey(projectId) } });
  
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const createComment = useCreateComment();
  const [, navigate] = useLocation();

  // Local state for inline editing
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newComment, setNewComment] = useState("");
  
  // Track if we've initialized local state from server
  const initRef = useRef(false);

  useEffect(() => {
    if (item && !initRef.current) {
      setTitle(item.title);
      setDescription(item.description || "");
      initRef.current = true;
    }
  }, [item]);

  const handleUpdateField = (field: string, value: any) => {
    if (!item) return;
    
    updateItem.mutate({
      id: itemId,
      data: { [field]: value } as any
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetItemQueryKey(itemId) });
      }
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

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-32" /><Skeleton className="h-12 w-2/3" /><div className="flex gap-8"><Skeleton className="flex-1 h-64" /><Skeleton className="w-80 h-96" /></div></div>;
  }

  if (!item) return <div>Item not found</div>;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto pb-12">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap text-sm text-muted-foreground">
        <div className="flex items-center min-w-0">
          <Link href={`/projects/${projectId}/board`} className="hover:text-foreground flex items-center flex-shrink-0">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
          <span className="mx-2">/</span>
          <ItemTypeIcon type={item.type} className={`w-4 h-4 mr-1 flex-shrink-0 ${getTypeColor(item.type).split(' ')[0]}`} />
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
                This will permanently delete <strong>{item.itemKey}</strong>. This action cannot be undone.
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
        <div className="flex-1 space-y-6">
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
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-sm">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), 'MMM d, yyyy • h:mm a')}
                        </span>
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
    </div>
  );
}
