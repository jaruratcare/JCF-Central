import { Router, type IRouter } from "express";
import { sbSelect, sbUpdate, toCamel, toSnake } from "./supabase";
import { isCeoOffice } from "./middlewares/auth";
import { UpdateUserParams, UpdateUserBody } from "./api-zod";

const router: IRouter = Router();

router.get("/users/me", async (req, res): Promise<void> => {
  res.json(toCamel(req.user as unknown as Record<string, unknown>));
});

router.get("/users", async (req, res): Promise<void> => {
  const user = req.user!;
  const ceo = await isCeoOffice(user);
  // Only surface active/on_leave users — exited staff cannot be added to projects.
  const rows = ceo
    ? await sbSelect("users", { status: "in.(active,on_leave)", order: "name.asc" })
    : await sbSelect("users", { dept_id: `eq.${user.deptId ?? "null"}`, status: "in.(active,on_leave)", order: "name.asc" });
  res.json(rows.map(toCamel));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const user = req.user!;
  if (!(await isCeoOffice(user))) {
    res.status(403).json({ error: "Only CEO Office can assign departments/roles" });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateUserParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const row = await sbUpdate("users", { id: `eq.${params.data.id}` }, toSnake(parsed.data as Record<string, unknown>));
  if (!row) { res.status(404).json({ error: "User not found" }); return; }
  res.json(toCamel(row));
});

export default router;
