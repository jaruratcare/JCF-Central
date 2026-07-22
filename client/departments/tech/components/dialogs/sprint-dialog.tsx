import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateSprint, useUpdateSprint, getListSprintsQueryKey, getGetSprintQueryKey, SprintStatus, SprintUpdateStatus } from "@/departments/tech/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const sprintSchema = z.object({
  name: z.string().min(1, "Name is required"),
  goal: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["planning", "active", "completed"]).optional(),
});

type SprintFormValues = z.infer<typeof sprintSchema>;

interface SprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  sprint?: { id: number; name: string; goal?: string | null; startDate?: string | null; endDate?: string | null; status: SprintStatus };
}

export function SprintDialog({ open, onOpenChange, projectId, sprint }: SprintDialogProps) {
  const queryClient = useQueryClient();
  const createSprint = useCreateSprint();
  const updateSprint = useUpdateSprint();

  const isEditing = !!sprint;

  const form = useForm<SprintFormValues>({
    resolver: zodResolver(sprintSchema),
    defaultValues: {
      name: "",
      goal: "",
      startDate: "",
      endDate: "",
      status: "planning",
    },
  });

  useEffect(() => {
    if (open) {
      if (sprint) {
        form.reset({
          name: sprint.name,
          goal: sprint.goal || "",
          startDate: sprint.startDate ? sprint.startDate.split('T')[0] : "",
          endDate: sprint.endDate ? sprint.endDate.split('T')[0] : "",
          status: sprint.status,
        });
      } else {
        form.reset({
          name: "",
          goal: "",
          startDate: "",
          endDate: "",
          status: "planning",
        });
      }
    }
  }, [open, sprint, form]);

  const onSubmit = (data: SprintFormValues) => {
    // Format dates to ISO if provided
    const formattedData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
    };

    if (isEditing) {
      updateSprint.mutate({
        id: sprint.id,
        data: formattedData as any,
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSprintsQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getGetSprintQueryKey(sprint.id) });
          onOpenChange(false);
        }
      });
    } else {
      createSprint.mutate({
        projectId,
        data: formattedData as any,
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSprintsQueryKey(projectId) });
          onOpenChange(false);
        }
      });
    }
  };

  const isPending = createSprint.isPending || updateSprint.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Sprint" : "Create Sprint"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update sprint details." : "Plan a new sprint for this project."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Sprint 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What is the objective of this sprint?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Sprint"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
