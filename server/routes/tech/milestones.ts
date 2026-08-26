import { Router, type IRouter } from "express";
import { sbDelete, sbInsert, sbSelect, sbUpdate, toCamel, toSnake } from "./supabase";
import { getProjectAccess, hasAtLeast, scopedProjectIds } from "./lib/permissions";

const router: IRouter = Router();

router.get("/milestones", async (req, res): Promise<void> => {
  const projectIds = await scopedProjectIds(req.user!);
  if (!projectIds.length) { res.json([]); return; }
  const rows = await sbSelect("milestones", { project_id: `in.(${projectIds.join(",")})`, order: "milestone_date.asc" });
  res.json(rows.map(toCamel));
});

router.post("/milestones", async (req, res): Promise<void> => {
  const projectId = Number(req.body?.projectId);
  const title = String(req.body?.title ?? "").trim();
  const milestoneDate = String(req.body?.milestoneDate ?? "");
  if (!Number.isInteger(projectId) || !title || !/^\d{4}-\d{2}-\d{2}$/.test(milestoneDate)) { res.status(400).json({ error: "Project, title, and date are required" }); return; }
  if (!hasAtLeast(await getProjectAccess(req.user!, projectId), "manage")) { res.status(403).json({ error: "Manage access required" }); return; }
  const row = await sbInsert("milestones", toSnake({ projectId, title, milestoneDate, description: req.body?.description || null, status: req.body?.status || "planned", ownerMemberId: req.body?.ownerMemberId || null }));
  res.status(201).json(toCamel(row));
});

router.patch("/milestones/:id", async (req, res): Promise<void> => {
  const rows = await sbSelect("milestones", { id: `eq.${req.params.id}` });
  if (!rows[0]) { res.status(404).json({ error: "Milestone not found" }); return; }
  if (!hasAtLeast(await getProjectAccess(req.user!, rows[0].project_id as number), "manage")) { res.status(403).json({ error: "Manage access required" }); return; }
  const data = toSnake(Object.fromEntries(["title", "milestoneDate", "description", "status", "ownerMemberId"].filter((key) => req.body?.[key] !== undefined).map((key) => [key, req.body[key]])));
  const row = await sbUpdate("milestones", { id: `eq.${req.params.id}` }, data);
  res.json(row ? toCamel(row) : null);
});

router.delete("/milestones/:id", async (req, res): Promise<void> => {
  const rows = await sbSelect("milestones", { id: `eq.${req.params.id}` });
  if (!rows[0]) { res.status(404).json({ error: "Milestone not found" }); return; }
  if (!hasAtLeast(await getProjectAccess(req.user!, rows[0].project_id as number), "manage")) { res.status(403).json({ error: "Manage access required" }); return; }
  await sbDelete("milestones", { id: `eq.${req.params.id}` });
  res.sendStatus(204);
});

export default router;
