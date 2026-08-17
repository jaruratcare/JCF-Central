import { Router } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

// GET doctors
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;

    let query = supabase
      .from("doctors")
      .select("*")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,specialty.ilike.%${search}%,organization.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE doctor
router.post("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("doctors")
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE doctor
router.put("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("doctors")
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

// DELETE doctor
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("doctors")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    res.json({ message: "Doctor deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;