import { Router, type IRouter } from "express";
import { sbSelect, toCamel } from "./supabase";

const router: IRouter = Router();

router.get("/roles", async (_req, res): Promise<void> => {
  const rows = await sbSelect("roles", { order: "hierarchy_level.asc" });
  res.json(rows.map(toCamel));
});

export default router;
