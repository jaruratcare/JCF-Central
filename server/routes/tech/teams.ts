import { Router, type IRouter } from "express";
import { sbSelect, toCamel } from "./supabase";
import { isCeoOffice } from "./middlewares/auth";

const router: IRouter = Router();

router.get("/teams", async (req, res): Promise<void> => {
  const user = req.user!;
  const ceo = await isCeoOffice(user);
  const rows = ceo
    ? await sbSelect("teams", { order: "name.asc" })
    : await sbSelect("teams", { department_id: `eq.${user.deptId ?? "null"}`, order: "name.asc" });
  res.json(rows.map(toCamel));
});

export default router;
