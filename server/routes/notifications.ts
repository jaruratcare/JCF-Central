import { Router } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

// GET notifications
router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET unread count
router.get("/count", async (_req, res) => {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);

    if (error) throw error;

    res.json({ count: count || 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// MARK notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;