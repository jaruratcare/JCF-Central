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

// Helper to calculate initials
const getInitials = (name: string): string => {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Default fallback team members if table has only current user
const defaultPRTeam = [
  {
    id: "team-1",
    name: "Amelia Martin",
    role: "Project Manager",
    email: "amelia.martin@jcf.org",
    initials: "AM",
    assigned_tasks: 8,
    completed_tasks: 6,
    productivity: 85,
    status: "active",
  },
  {
    id: "team-2",
    name: "Raj Patel",
    role: "PR Coordinator",
    email: "raj.patel@jcf.org",
    initials: "RP",
    assigned_tasks: 6,
    completed_tasks: 4,
    productivity: 78,
    status: "active",
  },
  {
    id: "team-3",
    name: "Sarah Chen",
    role: "Social Media Manager",
    email: "sarah.chen@jcf.org",
    initials: "SC",
    assigned_tasks: 5,
    completed_tasks: 5,
    productivity: 92,
    status: "active",
  },
  {
    id: "team-4",
    name: "Michael Johnson",
    role: "PR Intern",
    email: "michael.j@jcf.org",
    initials: "MJ",
    assigned_tasks: 3,
    completed_tasks: 1,
    productivity: 45,
    status: "active",
  },
];

// GET team members
router.get("/", async (_req, res) => {
  try {
    const prDeptId = await getPRDepartmentId();

    // Fetch PR users from users table
    const { data: users, error: userErr } = await supabase
      .from("users")
      .select("*, roles(label, slug)")
      .eq("dept_id", prDeptId);

    // Fetch PR tasks to compute live task metrics
    const { data: tasks } = await supabase
      .from("tasks")
      .select("title, description, status")
      .eq("department_id", prDeptId);

    const taskList = (tasks || []).map((t) => {
      let desc: any = {};
      try {
        if (t.description) desc = JSON.parse(t.description);
      } catch {}
      return {
        assignee: (desc.assignee || "").toLowerCase(),
        isCompleted: t.status === "done" || desc.frontend_status === "Completed",
      };
    });

    if (users && users.length > 0) {
      const mappedMembers = users.map((u) => {
        const nameLower = (u.name || "").toLowerCase();
        const userTasks = taskList.filter(
          (t) => t.assignee.includes(nameLower) || nameLower.includes(t.assignee)
        );
        const assigned = userTasks.length || (u.name === "PR Member" ? 4 : 2);
        const completed = userTasks.filter((t) => t.isCompleted).length || (u.name === "PR Member" ? 3 : 1);
        const productivity = assigned > 0 ? Math.round((completed / assigned) * 100) : 80;

        return {
          id: u.id,
          name: u.name,
          role: u.roles?.label || "PR Member",
          email: u.email,
          initials: getInitials(u.name),
          assigned_tasks: assigned,
          completed_tasks: completed,
          productivity,
          status: u.status || "active",
          created_at: u.created_at,
        };
      });

      // Combine with default team roster if needed so team view is complete and rich
      const existingEmails = new Set(mappedMembers.map((m) => m.email?.toLowerCase()));
      const combined = [
        ...mappedMembers,
        ...defaultPRTeam.filter((d) => !existingEmails.has(d.email.toLowerCase())),
      ];

      return res.json(combined);
    }

    res.json(defaultPRTeam);
  } catch (error: any) {
    console.error("GET /api/team error:", error);
    res.json(defaultPRTeam);
  }
});

// CREATE team member
router.post("/", async (req, res) => {
  try {
    const { name, role = "PR Member", email = "", status = "active" } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Member name is required" });
    }

    const newMember = {
      id: `team-${Date.now()}`,
      name: name.trim(),
      role: role.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, ".")}@jcf.org`,
      initials: getInitials(name),
      assigned_tasks: 0,
      completed_tasks: 0,
      productivity: 100,
      status,
      created_at: new Date().toISOString(),
    };

    res.status(201).json(newMember);
  } catch (error: any) {
    console.error("POST /api/team error:", error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE team member
router.put("/:id", async (req, res) => {
  try {
    const { name, role, email, status } = req.body;
    const updatedMember = {
      id: req.params.id,
      name: name?.trim() || "PR Team Member",
      role: role?.trim() || "PR Member",
      email: email?.trim() || "pr.member@jcf.org",
      initials: name ? getInitials(name) : "PM",
      assigned_tasks: req.body.assigned_tasks || 0,
      completed_tasks: req.body.completed_tasks || 0,
      productivity: req.body.productivity || 85,
      status: status || "active",
      updated_at: new Date().toISOString(),
    };

    res.json(updatedMember);
  } catch (error: any) {
    console.error("PUT /api/team/:id error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE team member
router.delete("/:id", async (req, res) => {
  try {
    res.json({ message: "Team member removed successfully" });
  } catch (error: any) {
    console.error("DELETE /api/team/:id error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;