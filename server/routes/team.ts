import { Router } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

// GET team
router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .order("name");

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE team member
router.post("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("team_members")
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE team member
router.put("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("team_members")
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

// DELETE team member
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    res.json({ message: "Team member deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;