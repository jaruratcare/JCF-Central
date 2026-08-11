import { RequestHandler } from "express";
import { supabaseAdmin } from "../../supabaseClient";
import { initialMasterData } from "../../../client/departments/carcinome/data/dummy-data";

const CARCINOME_DEPT_ID = "44e9a0b7-e3e1-43cf-adee-13fef2fe5c61";

// In-memory fallback / cache synced with DB
let localMasterData = [...initialMasterData];

// GET /api/carcinome/master-data
export const handleGetMasterData: RequestHandler = async (_req, res) => {
  res.json({ masterData: localMasterData });
};

// POST /api/carcinome/master-data
export const handleAddMasterData: RequestHandler = async (req, res) => {
  const item = req.body;
  const newItem = {
    id: item.id || `md-custom-${Date.now().toString().slice(-4)}`,
    category: item.category,
    value: item.value,
    label: item.label,
    description: item.description || "",
    active: item.active ?? true,
  };

  localMasterData.push(newItem);
  res.json({ item: newItem });
};

// PATCH /api/carcinome/master-data/:id
export const handleToggleMasterData: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  localMasterData = localMasterData.map((m) =>
    m.id === id ? { ...m, active } : m
  );

  const updated = localMasterData.find((m) => m.id === id);
  res.json({ item: updated });
};
