import { RequestHandler } from "express";
import { supabaseAdmin } from "../../supabaseClient";
import { initialOncologistOutreach, OncologistOutreach } from "../../../client/departments/carcinome/data/outreach-data";

const CARCINOME_DEPT_ID = "44e9a0b7-e3e1-43cf-adee-13fef2fe5c61";

export function parseOutreachRow(row: any): OncologistOutreach {
  let extra: any = {};
  if (row.notes) {
    try {
      extra = typeof row.notes === "string" ? JSON.parse(row.notes) : row.notes;
    } catch {
      extra = {};
    }
  }
  return {
    id: extra.id || row.id,
    doctorName: extra.doctorName || row.contact_name || "",
    hospital: extra.hospital || row.organization || "",
    specialisation: extra.specialisation || "",
    contactNumber: extra.contactNumber || row.phone || "",
    email: extra.email || row.email || "",
    outreachStage: extra.outreachStage || "Initial",
    status: extra.status || "Awaiting Response",
    outreachDoneBy: extra.outreachDoneBy || "",
    lastOutreachDate: extra.lastOutreachDate || row.created_at?.split("T")[0] || "",
    notes: extra.notes || "",
    sourceSheet: extra.sourceSheet || "Custom",
  };
}

// GET /api/carcinome/outreach
export const handleGetOutreach: RequestHandler = async (_req, res) => {
  if (!supabaseAdmin) {
    res.json({ outreach: initialOncologistOutreach });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("outreach_contacts")
    .select("*")
    .eq("department_id", CARCINOME_DEPT_ID)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const oocRows = (data || []).filter((r: any) => r.organization?.startsWith("OOC-"));

  if (oocRows.length === 0) {
    const seededOutreach: any[] = [];
    for (const item of initialOncologistOutreach) {
      const dbRow = {
        department_id: CARCINOME_DEPT_ID,
        contact_name: item.doctorName,
        organization: item.id.startsWith("OOC-") ? item.id : `OOC-${item.id}`,
        phone: item.contactNumber || null,
        email: item.email || null,
        status: "active",
        notes: JSON.stringify({ ...item, id: item.id.startsWith("OOC-") ? item.id : `OOC-${item.id}` }),
      };
      const { data: ins } = await supabaseAdmin
        .from("outreach_contacts")
        .insert(dbRow)
        .select()
        .single();
      if (ins) seededOutreach.push(parseOutreachRow(ins));
    }
    res.json({ outreach: seededOutreach });
    return;
  }

  const outreach = oocRows.map(parseOutreachRow);
  res.json({ outreach });
};

// POST /api/carcinome/outreach
export const handleAddOutreach: RequestHandler = async (req, res) => {
  const body = req.body;
  const rawId = body.id || `OOC-${Date.now().toString().slice(-4)}`;
  const outreachId = rawId.startsWith("OOC-") ? rawId : `OOC-${rawId}`;
  const newItem: OncologistOutreach = {
    id: outreachId,
    doctorName: body.doctorName || "",
    hospital: body.hospital || "",
    specialisation: body.specialisation || "",
    contactNumber: body.contactNumber || "",
    email: body.email || "",
    outreachStage: body.outreachStage || "Initial",
    status: body.status || "Awaiting Response",
    outreachDoneBy: body.outreachDoneBy || "",
    lastOutreachDate: body.lastOutreachDate || new Date().toISOString().split("T")[0],
    notes: body.notes || "",
    sourceSheet: body.sourceSheet || "Custom",
  };

  if (!supabaseAdmin) {
    res.json({ item: newItem });
    return;
  }

  const dbRow = {
    department_id: CARCINOME_DEPT_ID,
    contact_name: newItem.doctorName,
    organization: outreachId,
    phone: newItem.contactNumber || null,
    email: newItem.email || null,
    status: "active",
    notes: JSON.stringify(newItem),
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

  res.json({ item: parseOutreachRow(inserted) });
};

// PATCH /api/carcinome/outreach/:id
export const handleUpdateOutreach: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase client not initialized" });
    return;
  }

  const { data: existingRows } = await supabaseAdmin
    .from("outreach_contacts")
    .select("*")
    .eq("department_id", CARCINOME_DEPT_ID)
    .eq("status", "active");

  const existingRow = (existingRows || []).filter((r: any) => r.organization?.startsWith("OOC-")).find((r: any) => {
    if (r.id === id || r.organization === id) return true;
    try {
      const parsed = typeof r.notes === "string" ? JSON.parse(r.notes) : r.notes;
      return parsed.id === id;
    } catch {
      return false;
    }
  });

  if (!existingRow) {
    res.status(404).json({ error: "Outreach item not found" });
    return;
  }

  const currentItem = parseOutreachRow(existingRow);
  const updatedItem = { ...currentItem, ...updates };

  const dbRow = {
    contact_name: updatedItem.doctorName,
    organization: updatedItem.id,
    phone: updatedItem.contactNumber || null,
    email: updatedItem.email || null,
    status: "active",
    notes: JSON.stringify(updatedItem),
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

  res.json({ item: parseOutreachRow(updated) });
};

// DELETE /api/carcinome/outreach/:id
export const handleDeleteOutreach: RequestHandler = async (req, res) => {
  const { id } = req.params;

  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase client not initialized" });
    return;
  }

  const { data: existingRows } = await supabaseAdmin
    .from("outreach_contacts")
    .select("id, organization, notes")
    .eq("department_id", CARCINOME_DEPT_ID)
    .eq("status", "active");

  const target = (existingRows || []).filter((r: any) => r.organization?.startsWith("OOC-")).find((r: any) => {
    if (r.id === id || r.organization === id) return true;
    try {
      const parsed = typeof r.notes === "string" ? JSON.parse(r.notes) : r.notes;
      return parsed.id === id;
    } catch {
      return false;
    }
  });

  if (!target) {
    res.status(404).json({ error: "Outreach item not found" });
    return;
  }

  const { error } = await supabaseAdmin
    .from("outreach_contacts")
    .delete()
    .eq("id", target.id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, id });
};

