import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateProject, useUpdateProject, getListProjectsQueryKey, getGetProjectQueryKey } from "@/departments/tech/lib/api-client";
import type { ProjectInput } from "@/departments/tech/lib/api-client/generated/api.schemas";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useOrg } from "@/departments/tech/hooks/use-org";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  key: z.string().min(1, "Key is required").max(10, "Key must be 10 characters or less").toUpperCase(),
  description: z.string().optional(),
  deadline: z.string().optional(),
  departmentId: z.string().optional(),
  visibleDepartmentIds: z.array(z.string()).optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: { id: number; name: string; key: string; description?: string | null; deadline?: string | null };
}

export function ProjectDialog({ open, onOpenChange, project }: ProjectDialogProps) {
  const queryClient = useQueryClient();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const { isCeoOffice, departments, currentUser } = useOrg();
  const { toast } = useToast();

  const isEditing = !!project;

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      deadline: "",
      departmentId: "",
      visibleDepartmentIds: [],
    },
  });

  useEffect(() => {
    if (open) {
      if (project) {
        form.reset({
          name: project.name,
          key: project.key,
          description: project.description || "",
          deadline: project.deadline ? project.deadline.slice(0, 10) : "",
          departmentId: "",
          visibleDepartmentIds: [],
        });
      } else {
        form.reset({
          name: "",
          key: "",
          description: "",
          deadline: "",
          departmentId: currentUser?.deptId ?? "",
          visibleDepartmentIds: [],
        });
      }
    }
  }, [open, project, form, currentUser]);

  const onSubmit = (data: ProjectFormValues) => {
    if (isEditing) {
      const { key: _key, departmentId: _departmentId, visibleDepartmentIds: _visibleDepartmentIds, ...updateData } = data;
      updateProject.mutate({
        id: project.id,
        data: {
          ...updateData,
          deadline:    updateData.deadline    || undefined,
          description: updateData.description || undefined,
        },
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(project.id) });
          onOpenChange(false);
          toast({ title: "Project updated", description: `"${data.name}" has been saved.` });
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? err?.message ?? "Something went wrong";
          toast({ title: "Failed to update project", description: msg, variant: "destructive" });
        },
      });
    } else {
      const payload: ProjectInput = {
        name: data.name,
        key: data.key,
        deadline: data.deadline || undefined,
        description: data.description || undefined,
        ...(isCeoOffice ? { departmentId: data.departmentId, visibleDepartmentIds: data.visibleDepartmentIds } : {}),
      };
      createProject.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          onOpenChange(false);
        toast({ title: "Project created", description: `"${data.name}" is ready to use.` });
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? err?.message ?? "Something went wrong";
          toast({ title: "Failed to create project", description: msg, variant: "destructive" });
        },
      });
    }
  };

  const isPending = createProject.isPending || updateProject.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Project" : "Create Project"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your project details below." : "Add a new project to start tracking work."}
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
                    <Input placeholder="e.g. E-Commerce Redesign" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ECOM" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
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
                    <Textarea placeholder="Optional details about this project" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && isCeoOffice && (
              <>
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Department</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        >
                          <option value="" disabled>Select a department</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>{d.label}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visibleDepartmentIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Also share with departments</FormLabel>
                      <div className="grid grid-cols-2 gap-1.5 rounded-md border p-2">
                        {departments
                          .filter((d) => d.id !== form.watch("departmentId"))
                          .map((d) => {
                            const checked = field.value?.includes(d.id) ?? false;
                            return (
                              <label key={d.id} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(v) => {
                                    const current = field.value ?? [];
                                    field.onChange(v ? [...current, d.id] : current.filter((id) => id !== d.id));
                                  }}
                                />
                                {d.label}
                              </label>
                            );
                          })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
