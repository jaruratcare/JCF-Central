import { useGetCurrentUser, useListDepartments, useListRoles } from "@/departments/tech/lib/api-client";

/** Current user's profile plus org lookups (departments/roles) and CEO Office detection. */
export function useOrg() {
  const { data: currentUser, isLoading: loadingUser } = useGetCurrentUser();
  const { data: departments, isLoading: loadingDepartments } = useListDepartments();
  const { data: roles } = useListRoles();

  const department = departments?.find((d) => d.id === currentUser?.deptId);
  const isCeoOffice = department?.slug === "ceo_office";
  const role = roles?.find((r) => r.id === currentUser?.roleId);
  const isMember = role?.slug === "member";
  /** Only the base "member" role is blocked from creating projects; everyone else (pod lead and above) can. */
  const canCreateProject = isCeoOffice || !isMember;

  return {
    currentUser,
    departments: departments ?? [],
    roles: roles ?? [],
    department,
    role,
    isCeoOffice,
    isMember,
    canCreateProject,
    isLoading: loadingUser || loadingDepartments,
  };
}
