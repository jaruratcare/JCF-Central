import { RequestHandler } from "express";
import { initialOncologistOutreach, OncologistOutreach } from "../../../client/departments/carcinome/data/outreach-data";

// In-memory array synced with seed data / API operations
let localOutreachData: OncologistOutreach[] = [...initialOncologistOutreach];

// GET /api/carcinome/outreach
export const handleGetOutreach: RequestHandler = async (_req, res) => {
  res.json({ outreach: localOutreachData });
};

// POST /api/carcinome/outreach
export const handleAddOutreach: RequestHandler = async (req, res) => {
  const body = req.body;
  const newItem: OncologistOutreach = {
    id: body.id || `OOC-${(localOutreachData.length + 1).toString().padStart(3, "0")}`,
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

  localOutreachData.unshift(newItem);
  res.json({ item: newItem });
};

// PATCH /api/carcinome/outreach/:id
export const handleUpdateOutreach: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  localOutreachData = localOutreachData.map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );

  const updated = localOutreachData.find((item) => item.id === id);
  res.json({ item: updated });
};

// DELETE /api/carcinome/outreach/:id
export const handleDeleteOutreach: RequestHandler = async (req, res) => {
  const { id } = req.params;
  localOutreachData = localOutreachData.filter((item) => item.id !== id);
  res.json({ success: true, id });
};
