import { Router, type IRouter } from "express";
import { sbSelect, sbInsert, sbDelete, toCamel, toSnake } from "./supabase";
import { isCeoOffice } from "./middlewares/auth";
import { getProjectAccess, hasAtLeast } from "./lib/permissions";
import {
  ListProjectMembersParams,
  AddProjectMemberParams,
  AddProjectMemberBody,
  RemoveProjectMemberParams,
} from "./api-zod";

const router: IRouter = Router();

router.get("/projects/:projectId/members", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const params = ListProjectMembersParams.safeParse({ projectId: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const access = await getProjectAccess(req.user!, params.data.projectId);
  if (!access) { res.status(404).json({ error: "Project not found" }); return; }

  // Exclude 'removed' sentinel rows — those are internal denial markers, not real members.
  const rows = await sbSelect("project_members", {
    project_id: `eq.${params.data.projectId}`,
    role_in_project: "neq.removed",
    order: "joined_at.asc",
  });
  const userIds = [...new Set(rows.map((r) => r.user_id as string))];
  const users = userIds.length
    ? await sbSelect("users", { id: `in.(${userIds.join(",")})` })
    : [];
  const usersById = new Map(users.map((u) => [u.id as string, u]));

  res.json(
    rows.map((r) => {
      const u = usersById.get(r.user_id as string);
      return {
        ...toCamel(r),
        ...(u ? { name: u.name, email: u.email, departmentId: u.dept_id ?? undefined } : {}),
      };
    }),
  );
});

async function assertProjectEditable(projectId: number): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const projects = await sbSelect("projects", { id: `eq.${projectId}` });
  if (!projects[0]) return { ok: false, status: 404, error: "Project not found" };
  if (projects[0].status === "signed_off") {
    return { ok: false, status: 409, error: "Project is signed off and can no longer be edited" };
  }
  return { ok: true };
}

router.post("/projects/:projectId/members", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const params = AddProjectMemberParams.safeParse({ projectId: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = AddProjectMemberBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const actor = req.user!;
  const access = await getProjectAccess(actor, params.data.projectId);
  if (!hasAtLeast(access, "manage")) { res.status(403).json({ error: "Manage access required" }); return; }

  const editable = await assertProjectEditable(params.data.projectId);
  if (!editable.ok) { res.status((editable as any).status).json({ error: (editable as any).error }); return; }

  const targetUsers = await sbSelect("users", { id: `eq.${parsed.data.userId}` });
  const targetUser = targetUsers[0];
  if (!targetUser) { res.status(404).json({ error: "User not found" }); return; }

  const actorIsCeo = await isCeoOffice(actor);
  if (!actorIsCeo && targetUser.dept_id !== actor.deptId) {
    res.status(403).json({ error: "You can only add members from your own department" });
    return;
  }

  // Clear any previous 'removed' denial sentinel for this user on this project
  // so re-adding them properly restores access.
  await sbDelete("project_members", {
    project_id: `eq.${params.data.projectId}`,
    user_id: `eq.${parsed.data.userId}`,
    role_in_project: "eq.removed",
  });

  const row = await sbInsert(
    "project_members",
    toSnake({ ...parsed.data, projectId: params.data.projectId } as Record<string, unknown>),
  );

  // If a CEO Office user brought in a member from another department, make the
  // project visible to that department too.
  if (actorIsCeo && targetUser.dept_id) {
    const projects = await sbSelect("projects", { id: `eq.${params.data.projectId}` });
    const project = projects[0];
    if (project && project.department_id !== targetUser.dept_id) {
      const existingVisibility = await sbSelect("project_visibility", {
        project_id: `eq.${params.data.projectId}`,
        department_id: `eq.${targetUser.dept_id}`,
      });
      if (!existingVisibility[0]) {
        await sbInsert("project_visibility", {
          project_id: params.data.projectId,
          department_id: targetUser.dept_id,
          shared_by_user_id: actor.id,
        });
      }
    }
  }

  res.status(201).json({
    ...toCamel(row),
    name: targetUser.name,
    email: targetUser.email,
    departmentId: targetUser.dept_id ?? undefined,
  });
});

router.delete("/members/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RemoveProjectMemberParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const members = await sbSelect("project_members", { id: `eq.${params.data.id}` });
  if (!members[0]) { res.status(404).json({ error: "Member not found" }); return; }

  const access = await getProjectAccess(req.user!, members[0].project_id as number);
  if (!hasAtLeast(access, "manage")) { res.status(403).json({ error: "Manage access required" }); return; }

  const editable = await assertProjectEditable(members[0].project_id as number);
  if (!editable.ok) { res.status((editable as any).status).json({ error: (editable as any).error }); return; }

  // Don't just delete — write a 'removed' sentinel so department/visibility
  // fallback access is also revoked for this user on this project.
  await sbDelete("project_members", { id: `eq.${params.data.id}` });
  await sbInsert("project_members", {
    project_id: members[0].project_id,
    user_id: members[0].user_id,
    role_in_project: "removed",
  });
  res.sendStatus(204);
});

export default router;
