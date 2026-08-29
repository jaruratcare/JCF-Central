import { RequestHandler } from "express";
import { supabaseAdmin } from "../../supabaseClient";
import { initialDocuments } from "../../../client/departments/carcinome/data/dummy-data";

const CARCINOME_DEPT_ID = "44e9a0b7-e3e1-43cf-adee-13fef2fe5c61";

export function parseDocumentRow(row: any): any {
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
    patientId: meta.patientId || "",
    name: meta.name || row.title || "",
    fileType: meta.fileType || "pdf",
    uploadedAt: meta.uploadedAt || row.created_at?.slice(0, 10),
    uploadedBy: meta.uploadedBy || "Team Lead",
    size: meta.size || "1 MB",
    url: meta.url || null,
    _dbId: row.id,
  };
}

// GET /api/carcinome/documents
export const handleGetDocuments: RequestHandler = async (_req, res) => {
  if (!supabaseAdmin) {
    res.json({ documents: initialDocuments });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("activity_logs")
    .select("*")
    .eq("department_id", CARCINOME_DEPT_ID)
    .eq("table_name", "patient_document")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (!data || data.length === 0) {
    const seededDocs: any[] = [];
    for (const doc of initialDocuments) {
      const dbRow = {
        department_id: CARCINOME_DEPT_ID,
        title: doc.name,
        action: "UPLOAD_DOCUMENT",
        table_name: "patient_document",
        record_id: null,
        metadata: JSON.stringify(doc),
      };
      const { data: ins } = await supabaseAdmin
        .from("activity_logs")
        .insert(dbRow)
        .select()
        .single();
      if (ins) seededDocs.push(parseDocumentRow(ins));
    }
    res.json({ documents: seededDocs });
    return;
  }

  const documents = data.map(parseDocumentRow);
  res.json({ documents });
};

// POST /api/carcinome/documents
export const handleAddDocument: RequestHandler = async (req, res) => {
  const { patientId, name, fileType, size, url } = req.body;
  const docId = `DOC-${Date.now().toString().slice(-4)}`;
  const newDoc = {
    id: docId,
    patientId,
    name,
    fileType: fileType || "pdf",
    uploadedAt: new Date().toISOString().slice(0, 10),
    uploadedBy: "Team Lead",
    size: size || "1 MB",
    url: url || null,
  };

  if (!supabaseAdmin) {
    res.json({ document: newDoc });
    return;
  }

  const dbRow = {
    department_id: CARCINOME_DEPT_ID,
    title: name,
    action: "UPLOAD_DOCUMENT",
    table_name: "patient_document",
    record_id: null,
    metadata: JSON.stringify(newDoc),
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

  res.json({ document: parseDocumentRow(inserted) });
};

