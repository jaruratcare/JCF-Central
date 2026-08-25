import { Router, type IRouter } from "express";
import { sbSelect, toCamel } from "./supabase";
import { isCeoOffice } from "./middlewares/auth";

const router: IRouter = Router();

router.get("/conversion-reminders", async (req, res): Promise<void> => {
  const user = req.user!;
  const ceo = await isCeoOffice(user);
  const users = ceo
    ? await sbSelect("users", {})
    : await sbSelect("users", { dept_id: `eq.${user.deptId ?? "null"}` });
  const userIds = users.map((u) => u.id as string);
  if (!userIds.length) { res.json([]); return; }
  const rows = await sbSelect("conversion_reminders", { member_id: `in.(${userIds.join(",")})`, order: "due_date.asc" });
  res.json(rows.map(toCamel));
});

export default router;
