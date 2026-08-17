import { Router } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

// GET social records
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;

    let query = supabase
      .from("social_media_records")
      .select("*")
      .order("post_date", { ascending: false });

    if (search) {
      query = query.or(
        `post.ilike.%${search}%,channel.ilike.%${search}%,status.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE social record
router.post("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("social_media_records")
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE social record
router.put("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("social_media_records")
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

// DELETE social record
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("social_media_records")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    res.json({ message: "Social record deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;