import { RequestHandler } from "express";
import { supabaseAdmin } from "../../supabaseClient";

const CARCINOME_DEPT_ID = "44e9a0b7-e3e1-43cf-adee-13fef2fe5c61";

// GET /api/carcinome/tasks
export const handleGetTasks: RequestHandler = async (_req, res) => {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase not connected" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("department_id", CARCINOME_DEPT_ID)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const tasks = (data || []).map((t: any) => {
    let extra: any = {};
    if (t.description) {
      try {
        extra = typeof t.description === "string" && t.description.startsWith("{") ? JSON.parse(t.description) : { desc: t.description };
      } catch {
        extra = { desc: t.description };
      }
    }

    return {
      id: extra.id || t.id,
      title: t.title,
      description: extra.desc || t.description || "",
      patientId: extra.patientId || "",
      patientName: extra.patientName || "",
      status: t.status === "completed" ? "Completed" : t.status === "in_progress" ? "In Progress" : "Pending",
      priority: t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : "Medium",
      assignee: extra.assignee || "Komal",
      dueDate: t.due_date || "",
      category: extra.category || "General",
      _dbId: t.id,
    };
  });

  res.json({ tasks });
};

// POST /api/carcinome/tasks
export const handleAddTask: RequestHandler = async (req, res) => {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase not connected" });
    return;
  }

  const task = req.body;
  const taskId = task.id || `TSK-${Date.now().toString().slice(-4)}`;

  const extra = {
    id: taskId,
    desc: task.description || "",
    patientId: task.patientId || "",
    patientName: task.patientName || "",
    assignee: task.assignee || "Komal",
    category: task.category || "General",
  };

  const dbStatus = task.status === "Completed" ? "completed" : task.status === "In Progress" ? "in_progress" : "todo";
  const dbPriority = (task.priority || "medium").toLowerCase();

  const dbRow = {
    department_id: CARCINOME_DEPT_ID,
    title: task.title,
    description: JSON.stringify(extra),
    status: dbStatus,
    priority: dbPriority,
    due_date: task.dueDate || null,
  };

  const { data: inserted, error } = await supabaseAdmin
    .from("tasks")
    .insert(dbRow)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({
    task: {
      id: taskId,
      title: inserted.title,
      description: task.description || "",
      patientId: task.patientId || "",
      patientName: task.patientName || "",
      status: task.status || "Pending",
      priority: task.priority || "Medium",
      assignee: task.assignee || "Komal",
      dueDate: inserted.due_date || "",
      category: task.category || "General",
      _dbId: inserted.id,
    },
  });
};

// PATCH /api/carcinome/tasks/:id
export const handleUpdateTask: RequestHandler = async (req, res) => {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase not connected" });
    return;
  }

  const { id } = req.params;
  const updates = req.body;

  // Find task by querying description JSON or _dbId
  const { data: existingTasks } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("department_id", CARCINOME_DEPT_ID);

  const target = (existingTasks || []).find((t: any) => {
    if (t.id === id) return true;
    try {
      const extra = JSON.parse(t.description);
      return extra.id === id;
    } catch {
      return false;
    }
  });

  if (!target) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  let extra: any = {};
  try {
    extra = JSON.parse(target.description);
  } catch {
    extra = { desc: target.description };
  }

  if (updates.description !== undefined) extra.desc = updates.description;
  if (updates.assignee !== undefined) extra.assignee = updates.assignee;
  if (updates.category !== undefined) extra.category = updates.category;

  const dbUpdates: Record<string, any> = {
    description: JSON.stringify(extra),
    updated_at: new Date().toISOString(),
  };

  if (updates.status !== undefined) {
    dbUpdates.status = updates.status === "Completed" ? "completed" : updates.status === "In Progress" ? "in_progress" : "todo";
  }
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.priority !== undefined) dbUpdates.priority = String(updates.priority).toLowerCase();
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;

  const { data: updated, error } = await supabaseAdmin
    .from("tasks")
    .update(dbUpdates)
    .eq("id", target.id)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({
    task: {
      id: extra.id || updated.id,
      title: updated.title,
      description: extra.desc || "",
      patientId: extra.patientId || "",
      patientName: extra.patientName || "",
      status: updated.status === "completed" ? "Completed" : updated.status === "in_progress" ? "In Progress" : "Pending",
      priority: updated.priority ? updated.priority.charAt(0).toUpperCase() + updated.priority.slice(1) : "Medium",
      assignee: extra.assignee || "Komal",
      dueDate: updated.due_date || "",
      category: extra.category || "General",
      _dbId: updated.id,
    },
  });
};

// DELETE /api/carcinome/tasks/:id
export const handleDeleteTask: RequestHandler = async (req, res) => {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase not connected" });
    return;
  }

  const { id } = req.params;

  const { data: existingTasks } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("department_id", CARCINOME_DEPT_ID);

  const target = (existingTasks || []).find((t: any) => {
    if (t.id === id) return true;
    try {
      const extra = JSON.parse(t.description);
      return extra.id === id;
    } catch {
      return false;
    }
  });

  if (target) {
    await supabaseAdmin.from("tasks").delete().eq("id", target.id);
  }

  res.json({ success: true, id });
};
