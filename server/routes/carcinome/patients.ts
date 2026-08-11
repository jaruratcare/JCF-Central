import { RequestHandler } from "express";
import { supabaseAdmin } from "../../supabaseClient";

const CARCINOME_DEPT_ID = "44e9a0b7-e3e1-43cf-adee-13fef2fe5c61";

// Helper to parse DB row into Patient object
export function parsePatientRow(row: any): any {
  let extra: any = {};
  if (row.notes) {
    try {
      extra = typeof row.notes === "string" ? JSON.parse(row.notes) : row.notes;
    } catch {
      extra = {};
    }
  }

  const patientId = extra.id || row.organization || row.id;

  return {
    id: patientId,
    name: extra.name || row.contact_name || "",
    phone: extra.phone || row.phone || "",
    contactName: extra.contactName || null,
    allottedIntern: extra.allottedIntern || null,
    onboardingStatus: extra.onboardingStatus || "Active",
    services: extra.services || "At home chemotherapy infusion",
    location: extra.location || "Mumbai",
    age: extra.age ?? null,
    gender: extra.gender || "Female",
    assignedDoctor: extra.assignedDoctor || "",
    diagnosis: extra.diagnosis || "",
    medicine: extra.medicine || "",
    dischargeSummaryCopy: extra.dischargeSummaryCopy || null,
    supplier: extra.supplier || "",
    supplierContact: extra.supplierContact || "",
    assignedNurse: extra.assignedNurse || "",
    nurseContact: extra.nurseContact || "",
    infusionScheduleNotes: extra.infusionScheduleNotes || "",
    upcomingInfusionStatus: extra.upcomingInfusionStatus || "",
    confirmedDate: extra.confirmedDate || null,
    costOfInfusion: extra.costOfInfusion ?? null,
    infusionStatus: extra.infusionStatus || "Not Started",
    lastInfusionDate: extra.lastInfusionDate || null,
    dischargeSummaryStatus: extra.dischargeSummaryStatus || "Not Started",
    paymentStatus: extra.paymentStatus || "Pending",
    nextInfusionDate: extra.nextInfusionDate || null,
    coordinationNotes: extra.coordinationNotes || null,
    sessions: Array.isArray(extra.sessions) ? extra.sessions : [],
    _dbId: row.id,
  };
}

// GET /api/carcinome/patients
export const handleGetPatients: RequestHandler = async (_req, res) => {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase not connected" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("outreach_contacts")
    .select("*")
    .eq("department_id", CARCINOME_DEPT_ID)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const patients = (data || []).map(parsePatientRow);
  res.json({ patients });
};

// POST /api/carcinome/patients
export const handleAddPatient: RequestHandler = async (req, res) => {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase not connected" });
    return;
  }

  const patientData = req.body;
  const patientId = patientData.id || `CC2026${Date.now().toString().slice(-4)}`;

  const fullPatient = {
    ...patientData,
    id: patientId,
    sessions: patientData.sessions || [],
  };

  const dbRow = {
    department_id: CARCINOME_DEPT_ID,
    contact_name: fullPatient.name,
    organization: patientId,
    phone: fullPatient.phone || null,
    status: "active",
    notes: JSON.stringify(fullPatient),
  };

  const { data: inserted, error } = await supabaseAdmin
    .from("outreach_contacts")
    .insert(dbRow)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ patient: parsePatientRow(inserted) });
};

// PATCH /api/carcinome/patients/:id
export const handleUpdatePatient: RequestHandler = async (req, res) => {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase not connected" });
    return;
  }

  const id = String(req.params.id);
  const updates = req.body;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  let query = supabaseAdmin
    .from("outreach_contacts")
    .select("*")
    .eq("department_id", CARCINOME_DEPT_ID);

  if (isUuid) {
    query = query.eq("id", id);
  } else {
    query = query.eq("organization", id);
  }

  const { data: existingRows } = await query;

  if (!existingRows || existingRows.length === 0) {
    res.status(404).json({ error: "Patient record not found" });
    return;
  }

  const existingRow = existingRows[0];
  const currentPatient = parsePatientRow(existingRow);
  const updatedPatient = { ...currentPatient, ...updates };

  const dbRow = {
    contact_name: updatedPatient.name,
    organization: updatedPatient.id,
    phone: updatedPatient.phone || null,
    status: "active",
    notes: JSON.stringify(updatedPatient),
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await supabaseAdmin
    .from("outreach_contacts")
    .update(dbRow)
    .eq("id", existingRow.id)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ patient: parsePatientRow(updated) });
};

// DELETE /api/carcinome/patients/:id
export const handleDeletePatient: RequestHandler = async (req, res) => {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase not connected" });
    return;
  }

  const id = String(req.params.id);

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  let query = supabaseAdmin
    .from("outreach_contacts")
    .delete()
    .eq("department_id", CARCINOME_DEPT_ID);

  if (isUuid) {
    query = query.eq("id", id);
  } else {
    query = query.eq("organization", id);
  }

  const { error } = await query;

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, id });
};
