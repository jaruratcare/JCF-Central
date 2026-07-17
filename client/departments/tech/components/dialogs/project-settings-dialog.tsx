import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { UserPlus, X, ShieldCheck, Trash2, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/departments/tech/lib/utils";
import {
  useUpdateProject,
  useDeleteProject,
  useSignOffProject,
  useListProjectMembers,
  useAddProjectMember,
  useRemoveProjectMember,
  useListUsers,
  getListProjectsQueryKey,
  getGetProjectQueryKey,
  getListProjectMembersQueryKey,
  getListUsersQueryKey,
  type Project,
} from "@/departments/tech/lib/api-client";
import { useOrg } from "@/departments/tech/hooks/use-org";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const generalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  deadline: z.string().optional(),
});
type GeneralFormValues = z.infer<typeof generalSchema>;

const memberSchema = z.object({
  userId: z.string().min(1, "Select a person"),
  roleInProject: z.enum(["viewer", "editor", "manager"]),
});
type MemberFormValues = z.infer<typeof memberSchema>;

interface ProjectSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export function ProjectSettingsDialog({ open, onOpenChange, project }: ProjectSettingsDialogProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [signOffConfirmOpen, setSignOffConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userPickerOpen, setUserPickerOpen] = useState(false);

  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const signOffProject = useSignOffProject();
  const addMember = useAddProjectMember();
  const removeMember = useRemoveProjectMember();
  const { isCeoOffice, departments, roles } = useOrg();

  const { data: members, isLoading: loadingMembers } = useListProjectMembers(project.id, {
    query: { enabled: open, queryKey: getListProjectMembersQueryKey(project.id) },
  });
  // Non-CEO Office users can only add teammates from their own department;
  // CEO Office can add anyone. Backend already filters out exited users.
  const { data: candidateUsers } = useListUsers({ query: { enabled: open, queryKey: getListUsersQueryKey() } });
  const availableUsers = useMemo(
    () => (candidateUsers ?? []).filter((u) => !members?.some((m) => m.userId === u.id)),
    [candidateUsers, members],
  );

  const isSignedOff = project.status === "signed_off";
  const canManage = project.accessLevel === "manage";

  const generalForm = useForm<GeneralFormValues>({
    resolver: zodResolver(generalSchema),
    values: {
      name: project.name,
      description: project.description || "",
      deadline: project.deadline ? project.deadline.slice(0, 10) : "",
    },
  });

  const memberForm = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: { userId: "", roleInProject: "viewer" },
  });

  const onSaveGeneral = (data: GeneralFormValues) => {
    updateProject.mutate(
      { id: project.id, data: { ...data, deadline: data.deadline || null } as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(project.id) });
        },
      },
    );
  };

  const onAddMember = (data: MemberFormValues) => {
    addMember.mutate(
      { projectId: project.id, data: data as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectMembersQueryKey(project.id) });
          // Re-adding someone clears their denial — refresh project list so
          // their access level is reflected everywhere immediately.
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          memberForm.reset({ userId: "", roleInProject: "viewer" });
        },
      },
    );
  };

  const onRemoveMember = (memberId: string) => {
    removeMember.mutate(
      { id: memberId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectMembersQueryKey(project.id) });
          // Invalidate project list so the removed user's access is revoked
          // in every open tab on their next refetch/focus.
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        },
      },
    );
  };

  const onSignOff = () => {
    signOffProject.mutate(
      { id: project.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(project.id) });
          setSignOffConfirmOpen(false);
        },
      },
    );
  };

  const onDelete = () => {
    deleteProject.mutate(
      { id: project.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          setDeleteConfirmOpen(false);
          onOpenChange(false);
          navigate("/");
        },
      },
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Project Settings
              {isSignedOff && (
                <Badge variant="outline" className="text-emerald-600 border-emerald-600/40 gap-1">
                  <ShieldCheck className="h-3 w-3" /> Signed off
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>Manage details, members, and lifecycle for {project.name}.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="danger">Danger Zone</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 pt-2">
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(onSaveGeneral)} className="space-y-4">
                  <FormField
                    control={generalForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSignedOff || !canManage} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={generalForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={isSignedOff || !canManage} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={generalForm.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadline</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} disabled={isSignedOff || !canManage} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {canManage && (
                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateProject.isPending || isSignedOff}>
                        {updateProject.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="members" className="space-y-4 pt-2">
              {!canManage && (
                <p className="text-xs text-muted-foreground">
                  You need manage access on this project to add or remove members.
                </p>
              )}
              {!isSignedOff && canManage && (
                <Form {...memberForm}>
                  <form onSubmit={memberForm.handleSubmit(onAddMember)} className="flex items-start gap-2">
                    <FormField
                      control={memberForm.control}
                      name="userId"
                      render={({ field }) => {
                        const selectedUser = availableUsers.find((u) => u.id === field.value);
                        return (
                          <FormItem className="flex-1 min-w-0">
                            <Popover open={userPickerOpen} onOpenChange={setUserPickerOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-full h-9 justify-between font-normal text-sm truncate",
                                      !field.value && "text-muted-foreground",
                                    )}
                                    disabled={availableUsers.length === 0}
                                  >
                                    <span className="truncate">
                                      {selectedUser
                                        ? selectedUser.name as string
                                        : availableUsers.length === 0
                                          ? "No eligible people"
                                          : "Search by name, email or dept…"}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 flex-shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-[280px] p-0"
                                align="start"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                              >
                                <Command
                                  filter={(value, search) => {
                                    const u = availableUsers.find((x) => x.id === value);
                                    if (!u) return 0;
                                    const dept = departments.find((d) => d.id === (u as any).departmentId)?.label ?? "";
                                    const role = roles.find((r) => r.id === (u as any).roleId) ? (roles.find((r) => r.id === (u as any).roleId) as any).name : "";
                                    const hay = `${u.name} ${u.email} ${dept} ${role}`.toLowerCase();
                                    return hay.includes(search.toLowerCase()) ? 1 : 0;
                                  }}
                                >
                                  <CommandInput placeholder="Search name, email, department…" />
                                  <CommandList>
                                    <CommandEmpty>No matching people.</CommandEmpty>
                                    <CommandGroup>
                                      {availableUsers.map((u) => {
                                        const dept = departments.find((d) => d.id === (u as any).departmentId)?.label;
                                        const role = roles.find((r) => r.id === (u as any).roleId) ? (roles.find((r) => r.id === (u as any).roleId) as any).name : undefined;
                                        return (
                                          <CommandItem
                                            key={u.id as string}
                                            value={u.id as string}
                                            onSelect={(val) => {
                                              field.onChange(val);
                                              setUserPickerOpen(false);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-3.5 w-3.5 flex-shrink-0",
                                                field.value === u.id ? "opacity-100" : "opacity-0",
                                              )}
                                            />
                                            <div className="min-w-0">
                                              <p className="text-sm font-medium truncate">{u.name as string}</p>
                                              <p className="text-xs text-muted-foreground truncate">
                                                {u.email as string}
                                                {dept ? ` · ${dept}` : ""}
                                                {role ? ` · ${role}` : ""}
                                              </p>
                                            </div>
                                          </CommandItem>
                                        );
                                      })}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={memberForm.control}
                      name="roleInProject"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <select
                              {...field}
                              className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="editor">Editor</option>
                              <option value="manager">Manager</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" size="icon" disabled={addMember.isPending}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              )}
              {!isCeoOffice && canManage && (
                <p className="text-xs text-muted-foreground">
                  You can only add teammates from your own department. Only CEO Office can bring in
                  members across departments.
                </p>
              )}

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {loadingMembers ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Loading members...</p>
                ) : members?.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No members yet. Add teammates above.
                  </p>
                ) : (
                  members?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 border rounded-lg"
                    >
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarFallback className="text-xs">{getInitials(member.name ?? "?")}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize flex-shrink-0">
                        {member.roleInProject}
                      </Badge>
                      {departments.find((d) => d.id === member.departmentId) && (
                        <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                          {departments.find((d) => d.id === member.departmentId)?.label}
                        </Badge>
                      )}
                      {!isSignedOff && canManage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => onRemoveMember(member.id)}
                          disabled={removeMember.isPending}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="danger" className="space-y-3 pt-2">
              {canManage ? (
                <>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Sign off this project</p>
                      <p className="text-xs text-muted-foreground">
                        {isSignedOff
                          ? "This project is signed off and locked from further edits."
                          : "Marks this project as approved and complete. Locks editing."}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="text-emerald-600 border-emerald-600/40 hover:bg-emerald-600/10"
                      disabled={isSignedOff}
                      onClick={() => setSignOffConfirmOpen(true)}
                    >
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Sign Off
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-destructive/30 rounded-lg bg-destructive/5">
                    <div>
                      <p className="text-sm font-medium">Delete this project</p>
                      <p className="text-xs text-muted-foreground">
                        Permanently deletes the project and all its items, sprints, and members.
                      </p>
                    </div>
                    <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  You need manage access on this project to sign off or delete it.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={signOffConfirmOpen} onOpenChange={setSignOffConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign off &ldquo;{project.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This marks the project as complete and approved. You won&apos;t be able to edit its
              details afterward. This action can&apos;t be undone from here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={onSignOff}
              disabled={signOffProject.isPending}
            >
              {signOffProject.isPending ? "Signing off..." : "Sign Off"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{project.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the project along with all of its sprints, backlog items,
              comments, and members. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={onDelete}
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
