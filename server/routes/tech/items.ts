import { Router, type IRouter } from "express";
import { sbSelect, sbInsert, sbUpdate, sbDelete, toCamel, toSnake } from "./supabase";
import { getProjectAccess, hasAtLeast } from "./lib/permissions";
import {
  ListProjectItemsParams,
  CreateItemParams,
  CreateItemBody,
  GetBacklogParams,
  GetItemParams,
  UpdateItemParams,
  UpdateItemBody,
  DeleteItemParams,
} from "./api-zod";

const router: IRouter = Router();

/**
 * Returns true if assigneeId is null/undefined, if the project has no tracked
 * members yet (open-assignment mode), or if the assigneeId is a member of this
 * project. Skipping validation when the membership list is empty prevents the
 * server from blocking all assignments when project_members is unpopulated.
 */
async function isValidAssignee(assigneeId: unknown, projectId: number): Promise<boolean> {
  if (assigneeId === null || assigneeId === undefined) return true;
  const allMembers = await sbSelect("project_members", { project_id: `eq.${projectId}` });
  if (allMembers.length === 0) return true; // no membership list — open assignment
  return allMembers.some((m) => m.user_id === assigneeId);
}

router.get("/projects/:projectId/items", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const params = ListProjectItemsParams.safeParse({ projectId: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const access = await getProjectAccess(req.user!, params.data.projectId);
  if (!access) { res.status(404).json({ error: "Project not found" }); return; }
  const rows = await sbSelect("work_items", {
    project_id: `eq.${params.data.projectId}`,
    order: "sort_order.asc,created_at.asc",
  });
  res.json(rows.map(toCamel));
});

router.post("/projects/:projectId/items", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const params = CreateItemParams.safeParse({ projectId: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const access = await getProjectAccess(req.user!, params.data.projectId);
  if (!hasAtLeast(access, "editor")) { res.status(403).json({ error: "Edit access required" }); return; }

  if (!(await isValidAssignee(parsed.data.assigneeId, params.data.projectId))) {
    res.status(400).json({ error: "assigneeId must be a member of this project" });
    return;
  }

  const [projects, existingItems] = await Promise.all([
    sbSelect("projects", { id: `eq.${params.data.projectId}` }),
    sbSelect("work_items", { project_id: `eq.${params.data.projectId}` }),
  ]);

  if (!projects[0]) { res.status(404).json({ error: "Project not found" }); return; }
  const project = toCamel(projects[0]);
  const nextNum = existingItems.length + 1;
  const itemKey = `${project.key}-${nextNum}`;

  const row = await sbInsert("work_items", toSnake({
    ...parsed.data,
    projectId: params.data.projectId,
    itemKey,
    status: parsed.data.status ?? "todo",
    priority: parsed.data.priority ?? "medium",
    sortOrder: nextNum,
  } as Record<string, unknown>));
  res.status(201).json(toCamel(row));
});

router.get("/projects/:projectId/backlog", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const params = GetBacklogParams.safeParse({ projectId: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const access = await getProjectAccess(req.user!, params.data.projectId);
  if (!access) { res.status(404).json({ error: "Project not found" }); return; }
  const rows = await sbSelect("work_items", {
    project_id: `eq.${params.data.projectId}`,
    sprint_id: "is.null",
    order: "sort_order.asc,created_at.asc",
  });
  res.json(rows.map(toCamel));
});

async function itemAccess(req: import("express").Request, itemId: number) {
  const items = await sbSelect("work_items", { id: `eq.${itemId}` });
  const item = items[0];
  if (!item) return { item: null, access: null } as const;
  const access = await getProjectAccess(req.user!, item.project_id as number);
  return { item, access } as const;
}

router.get("/items/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetItemParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { item, access } = await itemAccess(req, params.data.id);
  if (!item || !access) { res.status(404).json({ error: "Item not found" }); return; }
  res.json(toCamel(item));
});

router.patch("/items/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateItemParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { item, access } = await itemAccess(req, params.data.id);
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }
  if (!hasAtLeast(access, "editor")) { res.status(403).json({ error: "Edit access required" }); return; }
  if ("assigneeId" in parsed.data && !(await isValidAssignee(parsed.data.assigneeId, item.project_id as number))) {
    res.status(400).json({ error: "assigneeId must be a member of this project" });
    return;
  }
  const row = await sbUpdate("work_items", { id: `eq.${params.data.id}` }, toSnake(parsed.data as Record<string, unknown>));
  if (!row) { res.status(404).json({ error: "Item not found" }); return; }
  res.json(toCamel(row));
});

router.delete("/items/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteItemParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { item, access } = await itemAccess(req, params.data.id);
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }
  if (!hasAtLeast(access, "editor")) { res.status(403).json({ error: "Edit access required" }); return; }
  await sbDelete("work_items", { id: `eq.${params.data.id}` });
  res.sendStatus(204);
});

export default router;
