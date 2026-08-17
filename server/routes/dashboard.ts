import { Router } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

router.get("/stats", async (_req, res) => {
  try {
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("id,status,due_date");

    if (error) throw error;

    const total = tasks.length;

    const completed = tasks.filter(
      task => task.status === "Completed"
    ).length;

    const pending = tasks.filter(
      task => task.status !== "Completed"
    ).length;

    const today = new Date().toISOString().split("T")[0];

    const overdue = tasks.filter(
      task =>
        task.due_date &&
        task.due_date < today &&
        task.status !== "Completed"
    ).length;

    const upcoming = tasks.filter(
      task =>
        task.due_date &&
        task.due_date >= today &&
        task.status !== "Completed"
    ).length;

    res.json({
      total,
      pending,
      completed,
      overdue,
      upcoming
    });

  } catch (error: any) {
    res.status(500).json({
      error: error.message
    });
  }
});

export default router;