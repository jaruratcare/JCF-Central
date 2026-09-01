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

// Map DB invitation_status to Frontend status
const mapWebinarStatus = (dbStatus: string): string => {
  switch (dbStatus?.toLowerCase()) {
    case "accepted":
      return "Active";
    case "attended":
      return "Completed";
    case "declined":
      return "Declined";
    case "opened":
      return "Reviewing";
    case "sent":
    default:
      return "Planning";
  }
};

// Map Frontend status to DB invitation_status
const reverseMapWebinarStatus = (frontendStatus: string): string => {
  switch (frontendStatus?.toLowerCase()) {
    case "active":
    case "accepted":
      return "accepted";
    case "completed":
    case "attended":
      return "attended";
    case "declined":
      return "declined";
    case "reviewing":
    case "opened":
      return "opened";
    case "planning":
    case "sent":
    default:
      return "sent";
  }
};

// Helper to transform DB webinar to frontend format
const transformWebinar = (dbWebinar: any) => {
  const invitedCount = dbWebinar.invitee_organization ? 150 : (dbWebinar.invitee_email ? 100 : 50);
  const registeredCount = dbWebinar.invitation_status === "accepted" || dbWebinar.invitation_status === "attended"
    ? Math.round(invitedCount * 0.65)
    : Math.round(invitedCount * 0.25);

  return {
    id: dbWebinar.id,
    title: dbWebinar.title,
    speaker: dbWebinar.invitee_name || "TBD",
    email: dbWebinar.invitee_email || "",
    organization: dbWebinar.invitee_organization || "",
    event_date: dbWebinar.sent_at ? dbWebinar.sent_at.split("T")[0] : "TBD",
    invited: invitedCount,
    registered: registeredCount,
    status: mapWebinarStatus(dbWebinar.invitation_status),
    raw_status: dbWebinar.invitation_status,
    created_at: dbWebinar.created_at,
  };
};

// GET webinars (scoped to PR department)
router.get("/", async (req, res) => {
  try {
    const prDeptId = await getPRDepartmentId();
    const { search } = req.query;

    let query = supabase
      .from("webinar_invitations")
      .select("*")
      .eq("department_id", prDeptId)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,invitee_name.ilike.%${search}%,invitee_organization.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json((data || []).map(transformWebinar));
  } catch (error: any) {
    console.error("GET /api/webinars error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET single webinar
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("webinar_invitations")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    res.json(transformWebinar(data));
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// CREATE webinar
router.post("/", async (req, res) => {
  try {
    const prDeptId = await getPRDepartmentId();
    const {
      title,
      speaker = "TBD",
      email = "",
      organization = "",
      status = "Planning",
      event_date,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Webinar title is required" });
    }

    const dbWebinar = {
      department_id: prDeptId,
      title: title.trim(),
      invitee_name: speaker.trim() || "TBD",
      invitee_email: email.trim() || null,
      invitee_organization: organization.trim() || null,
      invitation_status: reverseMapWebinarStatus(status),
      sent_at: event_date || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("webinar_invitations")
      .insert(dbWebinar)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(transformWebinar(data));
  } catch (error: any) {
    console.error("POST /api/webinars error:", error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE webinar
router.put("/:id", async (req, res) => {
  try {
    const dbWebinar: any = {
      updated_at: new Date().toISOString(),
    };

    if (req.body.title !== undefined) dbWebinar.title = req.body.title.trim();
    if (req.body.speaker !== undefined) dbWebinar.invitee_name = req.body.speaker.trim();
    if (req.body.email !== undefined) dbWebinar.invitee_email = req.body.email.trim() || null;
    if (req.body.organization !== undefined) dbWebinar.invitee_organization = req.body.organization.trim() || null;
    if (req.body.event_date !== undefined) dbWebinar.sent_at = req.body.event_date || null;
    if (req.body.status !== undefined) {
      dbWebinar.invitation_status = reverseMapWebinarStatus(req.body.status);
    }

    const { data, error } = await supabase
      .from("webinar_invitations")
      .update(dbWebinar)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(transformWebinar(data));
  } catch (error: any) {
    console.error("PUT /api/webinars/:id error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE webinar
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("webinar_invitations")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ message: "Webinar deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/webinars/:id error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;