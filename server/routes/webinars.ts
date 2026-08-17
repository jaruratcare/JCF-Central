import { Router } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

// GET webinars
router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("webinars")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE webinar
router.post("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("webinars")
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE webinar
router.put("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("webinars")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE webinar
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("webinars")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    res.json({ message: "Webinar deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;