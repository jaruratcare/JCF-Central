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

  if (!dept) {
    // Fallback known PR ID
    return "610ca264-68cb-409f-8a2d-75bdc79f1d20";
  }
  return dept.id;
}

// Map DB status & description to frontend Status
const mapStatus = (dbStatus: string, parsedDesc?: any): string => {
  if (parsedDesc?.frontend_status) {
    return parsedDesc.frontend_status;
  }
  const statusMap: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Completed",
    completed: "Completed",
    blocked: "Under Review",
  };
  return statusMap[dbStatus] || "To Do";
};

// Map DB priority to frontend Priority
const mapPriority = (dbPriority: string): "High" | "Medium" | "Low" => {
  const priorityMap: Record<string, "High" | "Medium" | "Low"> = {
    low: "Low",
    medium: "Medium",
    high: "High",
  };
  return priorityMap[dbPriority?.toLowerCase()] || "Medium";
};

// Reverse map frontend status to DB status
const reverseMapStatus = (frontendStatus: string): { dbStatus: string; frontendStatus: string } => {
  switch (frontendStatus) {
    case "Completed":
      return { dbStatus: "done", frontendStatus: "Completed" };
    case "Under Review":
      return { dbStatus: "in_progress", frontendStatus: "Under Review" };
    case "In Progress":
      return { dbStatus: "in_progress", frontendStatus: "In Progress" };
    case "To Do":
    default:
      return { dbStatus: "todo", frontendStatus: "To Do" };
  }
};

// Helper to transform DB task to frontend format
const transformTask = (dbTask: any) => {
  let parsed: any = {};
  try {
    if (dbTask.description) {
      parsed = JSON.parse(dbTask.description);
    }
  } catch {
    parsed = { desc: dbTask.description };
  }

  return {
    id: dbTask.id,
    title: dbTask.title,
    project: parsed.project || "PR Workspace",
    status: mapStatus(dbTask.status, parsed),
    priority: mapPriority(dbTask.priority),
    assignee: parsed.assignee || "PR Member",
    initials: parsed.initials || "PM",
    due_date: dbTask.due_date ? dbTask.due_date.split("T")[0] : undefined,
    progress: typeof parsed.progress === "number" ? parsed.progress : 0,
    comments: typeof parsed.comments === "number" ? parsed.comments : 0,
    attachments: typeof parsed.attachments === "number" ? parsed.attachments : 0,
    risk: parsed.risk || undefined,
  };
};

// GET all tasks (scoped to PR department)
router.get("/", async (req, res) => {
  try {
    const prDeptId = await getPRDepartmentId();
    const { status, search } = req.query;

    let query = supabase
      .from("tasks")
      .select("*")
      .eq("department_id", prDeptId)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    let transformed = (data || []).map(transformTask);

    if (status && status !== "All") {
      transformed = transformed.filter((t) => t.status === status);
    }

    res.json(transformed);
  } catch (error: any) {
    console.error("GET /api/tasks error:", error);
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
    res.json(transformTask(data));
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// CREATE task
router.post("/", async (req, res) => {
  try {
    const prDeptId = await getPRDepartmentId();
    const {
      title,
      project = "PR Workspace",
      status = "To Do",
      priority = "Medium",
      assignee = "PR Member",
      initials = "PM",
      due_date,
      progress = 0,
      comments = 0,
      attachments = 0,
      risk,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Task title is required" });
    }

    const statusMapping = reverseMapStatus(status);

    const descPayload = {
      project,
      assignee,
      initials: initials || (assignee ? assignee.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "PM"),
      progress: status === "Completed" ? 100 : progress,
      comments,
      attachments,
      risk: risk || null,
      frontend_status: statusMapping.frontendStatus,
    };

    const dbTask = {
      department_id: prDeptId,
      title: title.trim(),
      description: JSON.stringify(descPayload),
      status: statusMapping.dbStatus,
      priority: (priority || "Medium").toLowerCase(),
      due_date: due_date || null,
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert(dbTask)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(transformTask(data));
  } catch (error: any) {
    console.error("POST /api/tasks error:", error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE task
router.put("/:id", async (req, res) => {
  try {
    const { data: current, error: curErr } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (curErr || !current) {
      return res.status(404).json({ error: "Task not found" });
    }

    let currentDesc: any = {};
    try {
      if (current.description) {
        currentDesc = JSON.parse(current.description);
      }
    } catch {
      // Ignore parse errors
    }

    const statusVal = req.body.status !== undefined ? req.body.status : currentDesc.frontend_status || mapStatus(current.status);
    const statusMapping = reverseMapStatus(statusVal);

    const updatedDesc = {
      ...currentDesc,
      project: req.body.project !== undefined ? req.body.project : currentDesc.project,
      assignee: req.body.assignee !== undefined ? req.body.assignee : currentDesc.assignee,
      initials: req.body.initials !== undefined ? req.body.initials : currentDesc.initials,
      progress: req.body.progress !== undefined ? req.body.progress : (statusVal === "Completed" ? 100 : currentDesc.progress),
      comments: req.body.comments !== undefined ? req.body.comments : currentDesc.comments,
      attachments: req.body.attachments !== undefined ? req.body.attachments : currentDesc.attachments,
      risk: req.body.risk !== undefined ? req.body.risk : currentDesc.risk,
      frontend_status: statusMapping.frontendStatus,
    };

    const dbTask: any = {
      updated_at: new Date().toISOString(),
      description: JSON.stringify(updatedDesc),
      status: statusMapping.dbStatus,
    };

    if (req.body.title !== undefined) dbTask.title = req.body.title.trim();
    if (req.body.priority !== undefined) dbTask.priority = req.body.priority.toLowerCase();
    if (req.body.due_date !== undefined) dbTask.due_date = req.body.due_date || null;

    const { data, error } = await supabase
      .from("tasks")
      .update(dbTask)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(transformTask(data));
  } catch (error: any) {
    console.error("PUT /api/tasks/:id error:", error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE task status / progress - Kanban drag & drop / Quick updates
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, progress } = req.body;

    const { data: current, error: curErr } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (curErr || !current) {
      return res.status(404).json({ error: "Task not found" });
    }

    let currentDesc: any = {};
    try {
      if (current.description) {
        currentDesc = JSON.parse(current.description);
      }
    } catch {
      // Ignore
    }

    const statusVal = status || currentDesc.frontend_status || mapStatus(current.status);
    const statusMapping = reverseMapStatus(statusVal);

    let progressVal = currentDesc.progress;
    if (progress !== undefined) {
      progressVal = progress;
    } else if (statusVal === "Completed") {
      progressVal = 100;
    } else if (statusVal === "To Do" && currentDesc.progress === 100) {
      progressVal = 0;
    }

    currentDesc.frontend_status = statusMapping.frontendStatus;
    currentDesc.progress = progressVal;

    const updateData: any = {
      status: statusMapping.dbStatus,
      description: JSON.stringify(currentDesc),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(transformTask(data));
  } catch (error: any) {
    console.error("PATCH /api/tasks/:id/status error:", error);
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
    console.error("DELETE /api/tasks/:id error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;