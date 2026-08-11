import { RequestHandler } from "express";
import { initialDocuments } from "../../../client/departments/carcinome/data/dummy-data";

let localDocuments = [...initialDocuments];

// GET /api/carcinome/documents
export const handleGetDocuments: RequestHandler = async (_req, res) => {
  res.json({ documents: localDocuments });
};

// POST /api/carcinome/documents
export const handleAddDocument: RequestHandler = async (req, res) => {
  const { patientId, name, fileType, size, url } = req.body;
  const newDoc = {
    id: `DOC-${Date.now().toString().slice(-4)}`,
    patientId,
    name,
    fileType: fileType || "pdf",
    uploadedAt: new Date().toISOString().slice(0, 10),
    uploadedBy: "Team Lead",
    size: size || "1 MB",
    url: url || null,
  };

  localDocuments.unshift(newDoc);
  res.json({ document: newDoc });
};
