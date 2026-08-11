import { RequestHandler } from "express";
import { initialNotes } from "../../../client/departments/carcinome/data/dummy-data";

let localNotes = [...initialNotes];

// GET /api/carcinome/notes
export const handleGetNotes: RequestHandler = async (_req, res) => {
  res.json({ notes: localNotes });
};

// POST /api/carcinome/notes
export const handleAddNote: RequestHandler = async (req, res) => {
  const { patientId, content, author, role } = req.body;
  const newNote = {
    id: `NTE-${Date.now().toString().slice(-4)}`,
    patientId,
    author: author || "Team Lead",
    role: role || "Operations Lead",
    content,
    createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
  };

  localNotes.unshift(newNote);
  res.json({ note: newNote });
};
