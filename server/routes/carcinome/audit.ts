import { RequestHandler } from "express";
import { supabaseAdmin } from "../../supabaseClient";

const CARCINOME_DEPT_ID = "44e9a0b7-e3e1-43cf-adee-13fef2fe5c61";

// GET /api/carcinome/audit-logs
export const handleGetAuditLogs: RequestHandler = async (_req, res) => {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase not connected" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("activity_logs")
    .select("*")
    .eq("department_id", CARCINOME_DEPT_ID)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const auditLogs = (data || []).map((a: any) => {
    let meta: any = {};
    if (a.metadata) {
      try {
        meta = typeof a.metadata === "string" ? JSON.parse(a.metadata) : a.metadata;
      } catch {
        meta = {};
      }
    }

    return {
      id: meta.id || a.id,
      timestamp: meta.timestamp || a.created_at,
      actor: meta.actor || "Team Lead",
      role: meta.role || "Team Lead",
      action: a.action || "UPDATE",
      targetType: a.table_name || "Patient",
      targetId: meta.targetId || "",
      targetName: a.title || "",
      details: meta.details || a.title || "",
      changes: meta.changes || null,
      _dbId: a.id,
    };
  });

  res.json({ auditLogs });
};

// POST /api/carcinome/audit-logs
export const handleAddAuditLog: RequestHandler = async (req, res) => {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase not connected" });
    return;
  }

  const entry = req.body;
  const logId = entry.id || `LOG-${Date.now().toString().slice(-5)}`;

  const meta = {
    id: logId,
    targetId: entry.targetId || "",
    timestamp: entry.timestamp || new Date().toISOString().replace("T", " ").slice(0, 16),
    actor: entry.actor || "Team Lead",
    role: entry.role || "Team Lead",
    details: entry.details || "",
    changes: entry.changes || null,
  };

  const dbRow = {
    department_id: CARCINOME_DEPT_ID,
    title: entry.targetName || entry.details || "Activity Log",
    action: entry.action || "UPDATE",
    table_name: entry.targetType || "Patient",
    record_id: null,
    metadata: meta,
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

  res.json({
    auditLog: {
      id: logId,
      timestamp: meta.timestamp,
      actor: meta.actor,
      role: meta.role,
      action: inserted.action,
      targetType: inserted.table_name,
      targetId: meta.targetId,
      targetName: inserted.title,
      details: meta.details,
      changes: meta.changes,
      _dbId: inserted.id,
    },
  });
};
