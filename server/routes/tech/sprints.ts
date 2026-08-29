import { Router, type IRouter } from "express";
import { sbSelect, sbInsert, sbUpdate, sbDelete, toCamel, toSnake } from "./supabase";
import { getProjectAccess, hasAtLeast } from "./lib/permissions";
import {
  ListSprintsParams,
  CreateSprintParams,
  CreateSprintBody,
  GetSprintParams,
  UpdateSprintParams,
  UpdateSprintBody,
  DeleteSprintParams,
  StartSprintParams,
  CompleteSprintParams,
} from "./api-zod";

const router: IRouter = Router();

router.get("/projects/:projectId/sprints", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const params = ListSprintsParams.safeParse({ projectId: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const access = await getProjectAccess(req.user!, params.data.projectId);
  if (!access) { res.status(404).json({ error: "Project not found" }); return; }
  const rows = await sbSelect("sprints", { project_id: `eq.${params.data.projectId}`, order: "created_at.asc" });
  res.json(rows.map(toCamel));
});

router.post("/projects/:projectId/sprints", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const params = CreateSprintParams.safeParse({ projectId: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = CreateSprintBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const access = await getProjectAccess(req.user!, params.data.projectId);
  if (!hasAtLeast(access, "editor")) { res.status(403).json({ error: "Edit access required" }); return; }
  const row = await sbInsert("sprints", toSnake({ ...parsed.data, projectId: params.data.projectId } as Record<string, unknown>));
  res.status(201).json(toCamel(row));
});

async function sprintAccess(req: import("express").Request, sprintId: number) {
  const sprints = await sbSelect("sprints", { id: `eq.${sprintId}` });
  const sprint = sprints[0];
  if (!sprint) return { sprint: null, access: null } as const;
  const access = await getProjectAccess(req.user!, sprint.project_id as number);
  return { sprint, access } as const;
}

router.get("/sprints/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetSprintParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { sprint, access } = await sprintAccess(req, params.data.id);
  if (!sprint || !access) { res.status(404).json({ error: "Sprint not found" }); return; }
  res.json(toCamel(sprint));
});

router.patch("/sprints/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateSprintParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateSprintBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { sprint, access } = await sprintAccess(req, params.data.id);
  if (!sprint) { res.status(404).json({ error: "Sprint not found" }); return; }
  if (!hasAtLeast(access, "editor")) { res.status(403).json({ error: "Edit access required" }); return; }
  const row = await sbUpdate("sprints", { id: `eq.${params.data.id}` }, toSnake(parsed.data as Record<string, unknown>));
  if (!row) { res.status(404).json({ error: "Sprint not found" }); return; }
  res.json(toCamel(row));
});

router.delete("/sprints/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteSprintParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { sprint, access } = await sprintAccess(req, params.data.id);
  if (!sprint) { res.status(404).json({ error: "Sprint not found" }); return; }
  if (!hasAtLeast(access, "editor")) { res.status(403).json({ error: "Edit access required" }); return; }
  await sbDelete("sprints", { id: `eq.${params.data.id}` });
  res.sendStatus(204);
});

router.post("/sprints/:id/start", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = StartSprintParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { sprint, access } = await sprintAccess(req, params.data.id);
  if (!sprint) { res.status(404).json({ error: "Sprint not found" }); return; }
  if (!hasAtLeast(access, "editor")) { res.status(403).json({ error: "Edit access required" }); return; }
  const row = await sbUpdate("sprints", { id: `eq.${params.data.id}` }, { status: "active" });
  if (!row) { res.status(404).json({ error: "Sprint not found" }); return; }
  res.json(toCamel(row));
});

router.post("/sprints/:id/complete", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CompleteSprintParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { sprint, access } = await sprintAccess(req, params.data.id);
  if (!sprint) { res.status(404).json({ error: "Sprint not found" }); return; }
  if (!hasAtLeast(access, "editor")) { res.status(403).json({ error: "Edit access required" }); return; }
  const row = await sbUpdate("sprints", { id: `eq.${params.data.id}` }, { status: "completed" });
  if (!row) { res.status(404).json({ error: "Sprint not found" }); return; }
  res.json(toCamel(row));
});

export default router;
