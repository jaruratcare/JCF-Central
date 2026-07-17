import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateItem, useUpdateItem, getListProjectItemsQueryKey, getGetBacklogQueryKey, getGetItemQueryKey, useListSprints, getListSprintsQueryKey, useListProjectMembers, getListProjectMembersQueryKey, WorkItemInputType, WorkItemInputStatus, WorkItemInputPriority } from "@/departments/tech/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ItemTypeIcon } from "../item-utils";
import { useAuth } from "@/departments/tech/contexts/auth-context";

const itemSchema = z.object({
  type: z.enum(["epic", "story", "task", "bug"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "in_review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  assigneeId: z.string().optional().nullable(),
  storyPoints: z.coerce.number().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  sprintId: z.coerce.number().optional().nullable(),
  epicId: z.coerce.number().optional().nullable(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  defaultSprintId?: number | null;
  item?: { 
    id: number; type: string; title: string; description?: string | null; 
    status: string; priority: string; assigneeId?: string | null; 
    storyPoints?: number | null; dueDate?: string | null; sprintId?: number | null; epicId?: number | null;
  };
}

export function ItemDialog({ open, onOpenChange, projectId, defaultSprintId, item }: ItemDialogProps) {
  const queryClient = useQueryClient();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const { user } = useAuth();

  const { data: sprints } = useListSprints(projectId, { query: { enabled: open, queryKey: getListSprintsQueryKey(projectId) } });
  const { data: members } = useListProjectMembers(projectId, { query: { enabled: open, queryKey: getListProjectMembersQueryKey(projectId) } });

  const isEditing = !!item;

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      type: "task",
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      assigneeId: user?.id ?? null,
      storyPoints: null,
      dueDate: "",
      sprintId: defaultSprintId || null,
      epicId: null,
    },
  });

  useEffect(() => {
    if (open) {
      if (item) {
        form.reset({
          type: item.type as any,
          title: item.title,
          description: item.description || "",
          status: item.status as any,
          priority: item.priority as any,
          assigneeId: item.assigneeId || null,
          storyPoints: item.storyPoints,
          dueDate: item.dueDate ? item.dueDate.slice(0, 10) : "",
          sprintId: item.sprintId,
          epicId: item.epicId,
        });
      } else {
        form.reset({
          type: "task",
          title: "",
          description: "",
          status: "todo",
          priority: "medium",
          assigneeId: user?.id ?? null,
          storyPoints: null,
          dueDate: "",
          sprintId: defaultSprintId || null,
          epicId: null,
        });
      }
    }
  }, [open, item, form, defaultSprintId, user]);

  const onSubmit = (data: ItemFormValues) => {
    const formattedData = {
      ...data,
      storyPoints: data.storyPoints ? Number(data.storyPoints) : undefined,
      sprintId: data.sprintId ? Number(data.sprintId) : undefined,
      epicId: data.epicId ? Number(data.epicId) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    };

    if (isEditing) {
      updateItem.mutate({
        id: item.id,
        data: formattedData as any,
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectItemsQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getGetBacklogQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getGetItemQueryKey(item.id) });
          onOpenChange(false);
        }
      });
    } else {
      createItem.mutate({
        projectId,
        data: formattedData as any,
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectItemsQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getGetBacklogQueryKey(projectId) });
          onOpenChange(false);
        }
      });
    }
  };

  const isPending = createItem.isPending || updateItem.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Work Item" : "Create Work Item"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update details." : "Add a new work item to your project."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="epic">
                          <div className="flex items-center"><ItemTypeIcon type="epic" className="w-4 h-4 mr-2" /> Epic</div>
                        </SelectItem>
                        <SelectItem value="story">
                          <div className="flex items-center"><ItemTypeIcon type="story" className="w-4 h-4 mr-2" /> Story</div>
                        </SelectItem>
                        <SelectItem value="task">
                          <div className="flex items-center"><ItemTypeIcon type="task" className="w-4 h-4 mr-2" /> Task</div>
                        </SelectItem>
                        <SelectItem value="bug">
                          <div className="flex items-center"><ItemTypeIcon type="bug" className="w-4 h-4 mr-2" /> Bug</div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storyPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="e.g. 3" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Input placeholder="What needs to be done?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide details, acceptance criteria, etc." className="min-h-[120px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignee</FormLabel>
                    <Select onValueChange={(val) => field.onChange(val === "unassigned" ? null : val)} value={field.value || "unassigned"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {members?.map(m => (
                          <SelectItem key={m.userId} value={m.userId}>{m.name ?? m.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sprintId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sprint</FormLabel>
                    <Select onValueChange={(val) => field.onChange(val === "none" ? null : parseInt(val))} value={field.value?.toString() || "none"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Sprint" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Backlog (No Sprint)</SelectItem>
                        {sprints?.map(s => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.status})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
