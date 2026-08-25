import { RequestHandler } from "express";
import { supabaseAdmin } from "../../supabaseClient";
import { initialNotes } from "../../../client/departments/carcinome/data/dummy-data";

const CARCINOME_DEPT_ID = "44e9a0b7-e3e1-43cf-adee-13fef2fe5c61";

export function parseNoteRow(row: any): any {
  let meta: any = {};
  if (row.metadata) {
    try {
      meta = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
    } catch {
      meta = {};
    }
  }
  return {
    id: meta.id || row.id,
    patientId: meta.patientId || row.title || "",
    author: meta.author || "Team Lead",
    role: meta.role || "Operations Lead",
    content: meta.content || "",
    createdAt: meta.createdAt || row.created_at,
    _dbId: row.id,
  };
}

// GET /api/carcinome/notes
export const handleGetNotes: RequestHandler = async (_req, res) => {
  if (!supabaseAdmin) {
    res.json({ notes: initialNotes });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("activity_logs")
    .select("*")
    .eq("department_id", CARCINOME_DEPT_ID)
    .eq("table_name", "patient_note")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (!data || data.length === 0) {
    const seededNotes: any[] = [];
    for (const note of initialNotes) {
      const dbRow = {
        department_id: CARCINOME_DEPT_ID,
        title: note.patientId,
        action: "ADD_NOTE",
        table_name: "patient_note",
        record_id: null,
        metadata: JSON.stringify(note),
      };
      const { data: ins } = await supabaseAdmin
        .from("activity_logs")
        .insert(dbRow)
        .select()
        .single();
      if (ins) seededNotes.push(parseNoteRow(ins));
    }
    res.json({ notes: seededNotes });
    return;
  }

  const notes = data.map(parseNoteRow);
  res.json({ notes });
};

// POST /api/carcinome/notes
export const handleAddNote: RequestHandler = async (req, res) => {
  const { patientId, content, author, role } = req.body;
  const noteId = `NTE-${Date.now().toString().slice(-4)}`;
  const newNote = {
    id: noteId,
    patientId,
    author: author || "Team Lead",
    role: role || "Operations Lead",
    content,
    createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
  };

  if (!supabaseAdmin) {
    res.json({ note: newNote });
    return;
  }

  const dbRow = {
    department_id: CARCINOME_DEPT_ID,
    title: patientId,
    action: "ADD_NOTE",
    table_name: "patient_note",
    record_id: null,
    metadata: JSON.stringify(newNote),
  };

  const { data: inserted, error } = await supabaseAdmin
    .from("activity_logs")
    .insert(dbRow)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ note: parseNoteRow(inserted) });
};

