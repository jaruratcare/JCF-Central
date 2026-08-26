import { Router, type IRouter } from "express";
import { sbDelete, sbInsert, sbSelect, sbUpdate, toCamel, toSnake } from "./supabase";
import { isCeoOffice, isElevatedRole } from "./middlewares/auth";

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

async function canManage(user: NonNullable<Express.Request["user"]>) { return isElevatedRole(user); }

router.post("/conversion-reminders", async (req, res): Promise<void> => {
  if (!(await canManage(req.user!))) { res.status(403).json({ error: "Elevated access required" }); return; }
  const memberId = String(req.body?.memberId ?? "");
  const reminderType = String(req.body?.reminderType ?? "").trim();
  const dueDate = String(req.body?.dueDate ?? "");
  if (!memberId || !reminderType || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) { res.status(400).json({ error: "Member, reminder type, and date are required" }); return; }
  const row = await sbInsert("conversion_reminders", toSnake({ memberId, reminderType, dueDate, recipientMemberId: req.body?.recipientMemberId || null, status: req.body?.status || "pending" }));
  res.status(201).json(toCamel(row));
});

router.patch("/conversion-reminders/:id", async (req, res): Promise<void> => {
  if (!(await canManage(req.user!))) { res.status(403).json({ error: "Elevated access required" }); return; }
  const data = toSnake(Object.fromEntries(["memberId", "reminderType", "dueDate", "recipientMemberId", "status"].filter((key) => req.body?.[key] !== undefined).map((key) => [key, req.body[key]])));
  const row = await sbUpdate("conversion_reminders", { id: `eq.${req.params.id}` }, data);
  if (!row) { res.status(404).json({ error: "Reminder not found" }); return; }
  res.json(toCamel(row));
});

router.delete("/conversion-reminders/:id", async (req, res): Promise<void> => {
  if (!(await canManage(req.user!))) { res.status(403).json({ error: "Elevated access required" }); return; }
  await sbDelete("conversion_reminders", { id: `eq.${req.params.id}` });
  res.sendStatus(204);
});

export default router;
