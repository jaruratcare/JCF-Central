import { Router, type IRouter } from "express";
import { sbSelect, toCamel } from "./supabase";
import { scopedProjectIds } from "./lib/permissions";

const router: IRouter = Router();

router.get("/blockers", async (req, res): Promise<void> => {
  const projectIds = await scopedProjectIds(req.user!);
  if (!projectIds.length) { res.json([]); return; }
  const rows = await sbSelect("blockers", { project_id: `in.(${projectIds.join(",")})`, order: "raised_at.desc" });
  res.json(rows.map(toCamel));
});

export default router;
