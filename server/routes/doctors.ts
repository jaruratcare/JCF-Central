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

// Helper to transform DB doctor to frontend format
const transformDoctor = (dbDoctor: any) => ({
  id: dbDoctor.id,
  name: dbDoctor.full_name,
  specialty: dbDoctor.specialty || "General Medicine",
  organization: dbDoctor.hospital_affiliation || "",
  location: dbDoctor.city || "",
  status: (dbDoctor.relationship_status === "active" ? "Active" : "Inactive"),
  email: dbDoctor.email || "",
  phone: dbDoctor.phone || "",
  notes: dbDoctor.notes || "",
  created_at: dbDoctor.created_at,
});

// GET doctors (scoped to PR department)
router.get("/", async (req, res) => {
  try {
    const prDeptId = await getPRDepartmentId();
    const { search } = req.query;

    let query = supabase
      .from("doctors")
      .select("*")
      .eq("department_id", prDeptId)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,specialty.ilike.%${search}%,hospital_affiliation.ilike.%${search}%,city.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json((data || []).map(transformDoctor));
  } catch (error: any) {
    console.error("GET /api/doctors error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET single doctor
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    res.json(transformDoctor(data));
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// CREATE doctor
router.post("/", async (req, res) => {
  try {
    const prDeptId = await getPRDepartmentId();
    const {
      name,
      specialty = "General Medicine",
      organization = "",
      location = "",
      status = "Active",
      email = "",
      phone = "",
      notes = "",
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Doctor name is required" });
    }

    const dbDoctor = {
      department_id: prDeptId,
      full_name: name.trim(),
      specialty: specialty.trim(),
      hospital_affiliation: organization.trim(),
      city: location.trim(),
      relationship_status: status?.toLowerCase() === "inactive" ? "inactive" : "active",
      email: email.trim() || null,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
    };

    const { data, error } = await supabase
      .from("doctors")
      .insert(dbDoctor)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(transformDoctor(data));
  } catch (error: any) {
    console.error("POST /api/doctors error:", error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE doctor
router.put("/:id", async (req, res) => {
  try {
    const dbDoctor: any = {
      updated_at: new Date().toISOString(),
    };

    if (req.body.name !== undefined) dbDoctor.full_name = req.body.name.trim();
    if (req.body.specialty !== undefined) dbDoctor.specialty = req.body.specialty.trim();
    if (req.body.organization !== undefined) dbDoctor.hospital_affiliation = req.body.organization.trim();
    if (req.body.location !== undefined) dbDoctor.city = req.body.location.trim();
    if (req.body.status !== undefined) {
      dbDoctor.relationship_status = req.body.status.toLowerCase() === "inactive" ? "inactive" : "active";
    }
    if (req.body.email !== undefined) dbDoctor.email = req.body.email.trim() || null;
    if (req.body.phone !== undefined) dbDoctor.phone = req.body.phone.trim() || null;
    if (req.body.notes !== undefined) dbDoctor.notes = req.body.notes.trim() || null;

    const { data, error } = await supabase
      .from("doctors")
      .update(dbDoctor)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(transformDoctor(data));
  } catch (error: any) {
    console.error("PUT /api/doctors/:id error:", error);
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
    console.error("DELETE /api/doctors/:id error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;