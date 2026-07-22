import { Router, type IRouter } from "express";
import { sbSelect, toCamel } from "./supabase";

const router: IRouter = Router();

router.get("/departments", async (_req, res): Promise<void> => {
  const rows = await sbSelect("departments", { order: "label.asc" });
  res.json(rows.map(toCamel));
});

export default router;
