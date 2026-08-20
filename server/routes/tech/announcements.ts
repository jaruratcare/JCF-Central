import { Router, type IRouter } from "express";
import { sbDelete, sbInsert, sbSelect, sbUpdate, toCamel } from "./supabase";
import { isElevatedRole } from "./middlewares/auth";

const router: IRouter = Router();

async function canManageAnnouncements(user: NonNullable<Express.Request["user"]>) {
  return Boolean(user.deptId) && (await isElevatedRole(user));
}

router.get("/announcements", async (req, res): Promise<void> => {
  const user = req.user!;
  if (!user.deptId) { res.json([]); return; }
  const rows = await sbSelect("announcements", { order: "created_at.desc" });
  const visible = rows.filter((row) => row.team_id === null || row.audience_scope === user.deptId || row.team_id === user.deptId);
  res.json(visible.map(toCamel));
});

router.post("/announcements", async (req, res): Promise<void> => {
  const user = req.user!;
  if (!(await canManageAnnouncements(user))) { res.status(403).json({ error: "Only POD leads and above can publish notices" }); return; }
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
  if (!title || !body) { res.status(400).json({ error: "Notice title and body are required" }); return; }
  const row = await sbInsert("announcements", {
    title,
    body,
    author_member_id: user.id,
    audience_scope: user.deptId,
    is_published: true,
  });
  res.status(201).json(toCamel(row));
});

router.patch("/announcements/:id", async (req, res): Promise<void> => {
  const user = req.user!;
  if (!(await canManageAnnouncements(user))) { res.status(403).json({ error: "Only POD leads and above can edit notices" }); return; }
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
  if (!title || !body) { res.status(400).json({ error: "Notice title and body are required" }); return; }
  const rows = await sbSelect("announcements", { id: `eq.${req.params.id}`, audience_scope: `eq.${user.deptId}` });
  if (!rows[0]) { res.status(404).json({ error: "Notice not found" }); return; }
  const row = await sbUpdate("announcements", { id: `eq.${req.params.id}`, audience_scope: `eq.${user.deptId}` }, { title, body, updated_at: new Date().toISOString() });
  if (!row) { res.status(404).json({ error: "Notice not found" }); return; }
  res.json(toCamel(row));
});

router.delete("/announcements/:id", async (req, res): Promise<void> => {
  const user = req.user!;
  if (!(await canManageAnnouncements(user))) { res.status(403).json({ error: "Only POD leads and above can delete notices" }); return; }
  const rows = await sbSelect("announcements", { id: `eq.${req.params.id}` });
  const notice = rows[0];
  if (!notice || (notice.audience_scope !== null && notice.audience_scope !== user.deptId)) {
    res.status(404).json({ error: "Notice not found" });
    return;
  }
  await sbDelete("announcements", { id: `eq.${req.params.id}` });
  res.sendStatus(204);
});

export default router;