import { Router, type IRouter } from "express";
import { sbDelete, sbInsert, sbSelect, sbUpdate, toCamel, toSnake } from "./supabase";
import { getProjectAccess, hasAtLeast, scopedProjectIds } from "./lib/permissions";

const router: IRouter = Router();

router.get("/blockers", async (req, res): Promise<void> => {
  const projectIds = await scopedProjectIds(req.user!);
  if (!projectIds.length) { res.json([]); return; }
  const rows = await sbSelect("blockers", { project_id: `in.(${projectIds.join(",")})`, order: "raised_at.desc" });
  res.json(rows.map(toCamel));
});

router.post("/blockers", async (req, res): Promise<void> => {
  const projectId = Number(req.body?.projectId);
  const severity = String(req.body?.severity ?? "");
  const description = String(req.body?.description ?? "").trim();
  if (!Number.isInteger(projectId) || !description || !["critical", "high", "medium", "low"].includes(severity)) {
    res.status(400).json({ error: "Project, severity, and description are required" }); return;
  }
  if (!hasAtLeast(await getProjectAccess(req.user!, projectId), "manage")) { res.status(403).json({ error: "Manage access required" }); return; }
  const referenceCode = String(req.body?.referenceCode ?? `BLK-${Date.now()}`).trim();
  const row = await sbInsert("blockers", toSnake({ referenceCode, projectId, severity, description, raisedBy: req.user!.id, status: "open" }));
  res.status(201).json(toCamel(row));
});

router.patch("/blockers/:id", async (req, res): Promise<void> => {
  const rows = await sbSelect("blockers", { id: `eq.${req.params.id}` });
  if (!rows[0]) { res.status(404).json({ error: "Blocker not found" }); return; }
  if (!hasAtLeast(await getProjectAccess(req.user!, rows[0].project_id as number), "manage")) { res.status(403).json({ error: "Manage access required" }); return; }
  const data = toSnake(Object.fromEntries(["referenceCode", "severity", "description", "status"].filter((key) => req.body?.[key] !== undefined).map((key) => [key, req.body[key]])));
  const row = await sbUpdate("blockers", { id: `eq.${req.params.id}` }, data);
  res.json(row ? toCamel(row) : null);
});

router.delete("/blockers/:id", async (req, res): Promise<void> => {
  const rows = await sbSelect("blockers", { id: `eq.${req.params.id}` });
  if (!rows[0]) { res.status(404).json({ error: "Blocker not found" }); return; }
  if (!hasAtLeast(await getProjectAccess(req.user!, rows[0].project_id as number), "manage")) { res.status(403).json({ error: "Manage access required" }); return; }
  await sbDelete("blockers", { id: `eq.${req.params.id}` });
  res.sendStatus(204);
});

export default router;
