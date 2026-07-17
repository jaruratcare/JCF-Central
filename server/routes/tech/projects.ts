import { Router, type IRouter } from "express";
import { sbSelect, sbInsert, sbUpdate, sbDelete, toCamel, toSnake } from "./supabase";
import { isCeoOffice, isElevatedRole, isMemberRole } from "./middlewares/auth";
import { getProjectAccess, hasAtLeast } from "./lib/permissions";
import {
  CreateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  UpdateProjectBody,
  DeleteProjectParams,
  GetProjectSummaryParams,
  SignOffProjectParams,
} from "./api-zod";

const router: IRouter = Router();

const RANK: Record<"manage" | "editor" | "viewer", number> = { viewer: 1, editor: 2, manage: 3 };

router.get("/projects", async (req, res): Promise<void> => {
  const user = req.user!;
  const rows = await sbSelect("projects", { order: "created_at.asc" });

  if (await isCeoOffice(user)) {
    res.json(rows.map((p) => ({ ...toCamel(p), accessLevel: "manage" })));
    return;
  }

  const [memberships, visibility, elevated] = await Promise.all([
    sbSelect("project_members", { user_id: `eq.${user.id}` }),
    user.deptId ? sbSelect("project_visibility", { department_id: `eq.${user.deptId}` }) : Promise.resolve([]),
    isElevatedRole(user),
  ]);

  // Collect projects the user was explicitly removed from — these override all
  // department/visibility fallback grants.
  const deniedProjectIds = new Set<number>();
  const membershipLevelByProject = new Map<number, "manage" | "editor" | "viewer">();
  for (const m of memberships) {
    const projectId = m.project_id as number;
    const roleInProject = m.role_in_project as string;
    if (roleInProject === "removed") {
      deniedProjectIds.add(projectId);
      continue;
    }
    const level: "manage" | "editor" | "viewer" =
      roleInProject === "manager" ? "manage" : roleInProject === "editor" ? "editor" : "viewer";
    const existing = membershipLevelByProject.get(projectId);
    if (!existing || RANK[level] > RANK[existing]) membershipLevelByProject.set(projectId, level);
  }
  const visibleProjectIds = new Set(visibility.map((v) => v.project_id as number));

  const visible = rows
    .map((p) => {
      const id = p.id as number;
      // Explicit removal beats every other grant.
      if (deniedProjectIds.has(id)) return null;
      const ownsProjectDept = p.department_id === user.deptId || p.department_id === null;
      const level =
        membershipLevelByProject.get(id) ??
        (elevated && ownsProjectDept ? "manage" : undefined) ??
        (user.deptId && p.department_id === user.deptId ? "viewer" : undefined) ??
        (visibleProjectIds.has(id) ? "viewer" : undefined);
      return level ? { ...toCamel(p), accessLevel: level } : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);
  res.json(visible);
});

router.post("/projects", async (req, res): Promise<void> => {
  const user = req.user!;
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const ceo = await isCeoOffice(user);
  const { visibleDepartmentIds, departmentId: requestedDeptId, ...rest } = parsed.data;

  if (!ceo && !user.deptId) {
    res.status(403).json({ error: "You must be assigned to a department before creating a project" });
    return;
  }
  if (!ceo && (await isMemberRole(user))) {
    res.status(403).json({ error: "Members cannot create projects. Ask your POD lead or manager." });
    return;
  }
  const departmentId = ceo ? (requestedDeptId ?? user.deptId ?? null) : user.deptId;

  const row = await sbInsert(
    "projects",
    toSnake({ ...rest, departmentId } as Record<string, unknown>),
  );

  if (ceo && visibleDepartmentIds?.length) {
    await Promise.all(
      visibleDepartmentIds
        .filter((deptId) => deptId !== departmentId)
        .map((deptId) =>
          sbInsert("project_visibility", {
            project_id: row.id,
            department_id: deptId,
            shared_by_user_id: user.id,
          }),
        ),
    );
  }

  res.status(201).json(toCamel(row));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProjectParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const access = await getProjectAccess(req.user!, params.data.id);
  if (!access) { res.status(404).json({ error: "Project not found" }); return; }
  const rows = await sbSelect("projects", { id: `eq.${params.data.id}` });
  if (!rows[0]) { res.status(404).json({ error: "Project not found" }); return; }
  res.json({ ...toCamel(rows[0]), accessLevel: access });
});

router.patch("/projects/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateProjectParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const access = await getProjectAccess(req.user!, params.data.id);
  if (!hasAtLeast(access, "manage")) { res.status(403).json({ error: "Manage access required" }); return; }

  const existingRows = await sbSelect("projects", { id: `eq.${params.data.id}` });
  if (!existingRows[0]) { res.status(404).json({ error: "Project not found" }); return; }
  if (existingRows[0].status === "signed_off") {
    res.status(409).json({ error: "Project is signed off and can no longer be edited" });
    return;
  }

  // status is only ever changed via the dedicated sign-off endpoint
  const { status: _status, ...updateFields } = parsed.data;
  const row = await sbUpdate("projects", { id: `eq.${params.data.id}` }, toSnake(updateFields as Record<string, unknown>));
  if (!row) { res.status(404).json({ error: "Project not found" }); return; }
  res.json(toCamel(row));
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteProjectParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const access = await getProjectAccess(req.user!, params.data.id);
  if (!hasAtLeast(access, "manage")) { res.status(403).json({ error: "Manage access required" }); return; }
  await sbDelete("projects", { id: `eq.${params.data.id}` });
  res.sendStatus(204);
});

router.post("/projects/:id/sign-off", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SignOffProjectParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const access = await getProjectAccess(req.user!, params.data.id);
  if (!hasAtLeast(access, "manage")) { res.status(403).json({ error: "Manage access required" }); return; }
  const row = await sbUpdate("projects", { id: `eq.${params.data.id}` }, { status: "signed_off" });
  if (!row) { res.status(404).json({ error: "Project not found" }); return; }
  res.json(toCamel(row));
});

router.get("/projects/:projectId/summary", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const params = GetProjectSummaryParams.safeParse({ projectId: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { projectId } = params.data;

  const access = await getProjectAccess(req.user!, projectId);
  if (!access) { res.status(404).json({ error: "Project not found" }); return; }

  const [items, sprints] = await Promise.all([
    sbSelect("work_items", { project_id: `eq.${projectId}` }),
    sbSelect("sprints", { project_id: `eq.${projectId}`, status: "eq.active", limit: "1" }),
  ]);

  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let completedItems = 0;
  let openItems = 0;

  for (const item of items) {
    const status = item.status as string;
    const type = item.type as string;
    byStatus[status] = (byStatus[status] || 0) + 1;
    byType[type] = (byType[type] || 0) + 1;
    if (status === "done") completedItems++;
    else openItems++;
  }

  res.json({
    totalItems: items.length,
    openItems,
    completedItems,
    byStatus,
    byType,
    activeSprint: sprints[0] ? toCamel(sprints[0]) : null,
  });
});

export default router;
