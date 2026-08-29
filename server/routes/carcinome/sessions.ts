import { RequestHandler } from "express";
import { supabaseAdmin } from "../../supabaseClient";
import { parsePatientRow } from "./patients";

const CARCINOME_DEPT_ID = "44e9a0b7-e3e1-43cf-adee-13fef2fe5c61";

// Helper to fetch & update patient sessions array
async function modifyPatientSessions(patientId: string, modifierFn: (sessions: any[], patient: any) => void) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId);
  
  let query = supabaseAdmin
    .from("outreach_contacts")
    .select("*")
    .eq("department_id", CARCINOME_DEPT_ID);

  if (isUuid) {
    query = query.eq("id", patientId);
  } else {
    query = query.eq("organization", patientId);
  }

  const { data: rows, error: qErr } = await query;

  if (qErr || !rows || rows.length === 0) {
    throw new Error(`Patient ${patientId} not found (${qErr?.message || "empty"})`);
  }

  const row = rows[0];
  const patient = parsePatientRow(row);
  const sessions = patient.sessions || [];

  modifierFn(sessions, patient);

  patient.sessions = sessions;
  if (sessions.length > 0) {
    patient.lastInfusionDate = sessions[sessions.length - 1].date;
    patient.nextInfusionDate = sessions[sessions.length - 1].date;
  }

  const dbRow = {
    contact_name: patient.name,
    organization: patient.id,
    phone: patient.phone || null,
    status: "active",
    notes: JSON.stringify(patient),
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await supabaseAdmin
    .from("outreach_contacts")
    .update(dbRow)
    .eq("id", row.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return parsePatientRow(updated);
}

// POST /api/carcinome/sessions
export const handleAddSession: RequestHandler = async (req, res) => {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase not connected" });
    return;
  }

  const { patientId, session } = req.body;
  if (!patientId || !session) {
    res.status(400).json({ error: "Missing patientId or session" });
    return;
  }

  try {
    const updatedPatient = await modifyPatientSessions(patientId, (sessions) => {
      sessions.push({ ...session, id: `SES-${Date.now()}` });
    });
    res.json({ patient: updatedPatient });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/carcinome/sessions/by-index or /:id
export const handleUpdateSession: RequestHandler = async (req, res) => {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase not connected" });
    return;
  }

  const { session, patientId, sessionIndex } = req.body;
  const targetId = patientId || req.params.id;

  if (!targetId) {
    res.status(400).json({ error: "Missing patientId" });
    return;
  }

  try {
    const updatedPatient = await modifyPatientSessions(targetId, (sessions) => {
      if (sessionIndex !== undefined && sessions[sessionIndex]) {
        sessions[sessionIndex] = { ...sessions[sessionIndex], ...session };
      } else {
        const idParam = req.params.id;
        const idx = sessions.findIndex((s: any) => s.id === idParam);
        if (idx !== -1) {
          sessions[idx] = { ...sessions[idx], ...session };
        }
      }
    });
    res.json({ patient: updatedPatient });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/carcinome/sessions/by-index or /:id
export const handleDeleteSession: RequestHandler = async (req, res) => {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase not connected" });
    return;
  }

  const { patientId, sessionIndex } = req.body;
  const targetId = patientId || req.params.id;

  if (!targetId) {
    res.status(400).json({ error: "Missing patientId" });
    return;
  }

  try {
    const updatedPatient = await modifyPatientSessions(targetId, (sessions) => {
      if (sessionIndex !== undefined && sessionIndex >= 0) {
        sessions.splice(sessionIndex, 1);
      } else {
        const idParam = req.params.id;
        const idx = sessions.findIndex((s: any) => s.id === idParam);
        if (idx !== -1) sessions.splice(idx, 1);
      }
    });
    res.json({ patient: updatedPatient });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
