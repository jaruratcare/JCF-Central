import { sbSelect } from "../supabase";
import { isCeoOffice, isElevatedRole, type AppUser } from "../middlewares/auth";

export type AccessLevel = "manage" | "editor" | "viewer" | null;

const RANK: Record<Exclude<AccessLevel, null>, number> = { viewer: 1, editor: 2, manage: 3 };

/** Highest access level a user has on a project: manage > editor > viewer > null (no access). */
export async function getProjectAccess(user: AppUser, projectId: number): Promise<AccessLevel> {
  const [projects, members] = await Promise.all([
    sbSelect("projects", { id: `eq.${projectId}` }),
    sbSelect("project_members", { project_id: `eq.${projectId}`, user_id: `eq.${user.id}` }),
  ]);
  const project = projects[0];
  if (!project) return null;

  if (await isCeoOffice(user)) return "manage";

  // A 'removed' sentinel means the user was explicitly expelled — deny all
  // access, including department/visibility fallbacks.
  if (members.some((m) => m.role_in_project === "removed")) return null;

  // If duplicate membership rows ever exist, take the highest access level.
  let level: AccessLevel = null;
  for (const member of members) {
    const roleInProject = member.role_in_project as string;
    if (roleInProject === "removed") continue;
    const memberLevel: AccessLevel =
      roleInProject === "manager" ? "manage" : roleInProject === "editor" ? "editor" : "viewer";
    if (!level || RANK[memberLevel] > RANK[level]) level = memberLevel;
  }

  // Pod leads and above (managers, directors) get manage access over their own
  // department's projects, or over projects with no home department set yet.
  const ownsProjectDept = project.department_id === user.deptId || project.department_id === null;
  if (ownsProjectDept && (await isElevatedRole(user))) {
    if (!level || RANK.manage > RANK[level]) level = "manage";
  }

  // Home-department or explicitly shared users get at least view access.
  if (!level) {
    if (project.department_id && project.department_id === user.deptId) {
      level = "viewer";
    } else {
      const visibility = await sbSelect("project_visibility", {
        project_id: `eq.${projectId}`,
        department_id: `eq.${user.deptId ?? "null"}`,
      });
      if (visibility[0]) level = "viewer";
    }
  }

  return level;
}

export function hasAtLeast(level: AccessLevel, min: Exclude<AccessLevel, null>): boolean {
  return level !== null && RANK[level] >= RANK[min];
}
