import { Router } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

// GET all tasks
router.get("/", async (req, res) => {
  try {
    const { status, assignee, search } = req.query;

    let query = supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "All") {
      query = query.eq("status", status);
    }

    if (assignee) {
      query = query.eq("assignee", assignee);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,project.ilike.%${search}%,assignee.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET single task
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// CREATE task
router.post("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE task
router.put("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tasks")
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

// UPDATE task status - Kanban
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const updateData: any = { status };

    if (status === "Completed") {
      updateData.progress = 100;
    }

    const { data, error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE task
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    res.json({ message: "Task deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;