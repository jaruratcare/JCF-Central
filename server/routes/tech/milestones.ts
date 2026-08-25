import { Router, type IRouter } from "express";
import { sbSelect, toCamel } from "./supabase";
import { scopedProjectIds } from "./lib/permissions";

const router: IRouter = Router();

router.get("/milestones", async (req, res): Promise<void> => {
  const projectIds = await scopedProjectIds(req.user!);
  if (!projectIds.length) { res.json([]); return; }
  const rows = await sbSelect("milestones", { project_id: `in.(${projectIds.join(",")})`, order: "milestone_date.asc" });
  res.json(rows.map(toCamel));
});

export default router;
