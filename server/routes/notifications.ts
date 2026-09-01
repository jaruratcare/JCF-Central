import { Router } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

// Helper to get PR Department ID
async function getPRDepartmentId(): Promise<string> {
  const { data: dept } = await supabase
    .from("departments")
    .select("id")
    .eq("slug", "pr")
    .single();

  return dept?.id || "610ca264-68cb-409f-8a2d-75bdc79f1d20";
}

// Helper to transform DB notification to frontend format
const transformNotification = (dbNotif: any) => ({
  id: dbNotif.id,
  type: dbNotif.notification_type || "task",
  title: dbNotif.title,
  source: dbNotif.message || "PR Workspace",
  is_read: Boolean(dbNotif.is_read),
  created_at: dbNotif.created_at,
});

// GET notifications (scoped to PR department)
router.get("/", async (_req, res) => {
  try {
    const prDeptId = await getPRDepartmentId();

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("department_id", prDeptId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json((data || []).map(transformNotification));
  } catch (error: any) {
    console.error("GET /api/notifications error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET unread count
router.get("/count", async (_req, res) => {
  try {
    const prDeptId = await getPRDepartmentId();

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("department_id", prDeptId)
      .eq("is_read", false);

    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (error: any) {
    console.error("GET /api/notifications/count error:", error);
    res.status(500).json({ error: error.message });
  }
});

// CREATE notification / announcement
router.post("/", async (req, res) => {
  try {
    const prDeptId = await getPRDepartmentId();
    const { title, message = "PR Workspace Announcement", type = "task" } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Notification title is required" });
    }

    const dbNotif = {
      department_id: prDeptId,
      title: title.trim(),
      message: message.trim(),
      notification_type: type,
      is_read: false,
    };

    const { data, error } = await supabase
      .from("notifications")
      .insert(dbNotif)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(transformNotification(data));
  } catch (error: any) {
    console.error("POST /api/notifications error:", error);
    res.status(500).json({ error: error.message });
  }
});

// MARK ALL notifications as read
router.patch("/read-all", async (_req, res) => {
  try {
    const prDeptId = await getPRDepartmentId();

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("department_id", prDeptId)
      .eq("is_read", false);

    if (error) throw error;
    res.json({ message: "All notifications marked as read" });
  } catch (error: any) {
    console.error("PATCH /api/notifications/read-all error:", error);
    res.status(500).json({ error: error.message });
  }
});

// MARK single notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(transformNotification(data));
  } catch (error: any) {
    console.error("PATCH /api/notifications/:id/read error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE notification
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ message: "Notification deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/notifications/:id error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;