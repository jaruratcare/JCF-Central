import { Router, type IRouter } from "express";
import { sbSelect, toCamel } from "./supabase";
import { scopedProjectIds } from "./lib/permissions";

const router: IRouter = Router();

router.get("/blockers/:blockerId/comments", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.blockerId) ? req.params.blockerId[0] : req.params.blockerId;
  const blockers = await sbSelect("blockers", { id: `eq.${raw}` });
  const blocker = blockers[0];
  if (!blocker) { res.status(404).json({ error: "Blocker not found" }); return; }

  const projectIds = await scopedProjectIds(req.user!);
  if (!projectIds.includes(blocker.project_id as number)) {
    res.status(404).json({ error: "Blocker not found" });
    return;
  }

  const rows = await sbSelect("blocker_comments", { blocker_id: `eq.${raw}`, order: "created_at.asc" });
  res.json(rows.map(toCamel));
});

export default router;
