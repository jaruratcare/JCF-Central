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

router.get("/stats", async (_req, res) => {
  try {
    const prDeptId = await getPRDepartmentId();

    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("id, status, description, due_date")
      .eq("department_id", prDeptId);

    if (error) throw error;

    const taskList = tasks || [];
    const total = taskList.length;

    const isCompleted = (t: any) => {
      if (t.status === "done" || t.status === "completed") return true;
      try {
        if (t.description) {
          const parsed = JSON.parse(t.description);
          if (parsed.frontend_status === "Completed") return true;
        }
      } catch {}
      return false;
    };

    const completed = taskList.filter(isCompleted).length;
    const pending = total - completed;

    const today = new Date().toISOString().split("T")[0];

    const overdue = taskList.filter((task) => {
      if (isCompleted(task)) return false;
      if (!task.due_date) return false;
      const taskDate = task.due_date.split("T")[0];
      return taskDate < today;
    }).length;

    const upcoming = taskList.filter((task) => {
      if (isCompleted(task)) return false;
      if (!task.due_date) return false;
      const taskDate = task.due_date.split("T")[0];
      return taskDate >= today;
    }).length;

    res.json({
      total,
      pending,
      completed,
      overdue,
      upcoming,
    });
  } catch (error: any) {
    console.error("GET /api/dashboard/stats error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;