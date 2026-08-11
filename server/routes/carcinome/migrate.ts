import { RequestHandler } from "express";
import { supabaseAdmin } from "../../supabaseClient";
import { patients as initialPatients, initialTasks, initialAuditLogs } from "../../../client/departments/carcinome/data/dummy-data";

const CARCINOME_DEPT_ID = "44e9a0b7-e3e1-43cf-adee-13fef2fe5c61";

export const handleMigrate: RequestHandler = async (_req, res) => {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase admin client not initialised." });
    return;
  }

  const results: string[] = [];

  // 1. Seed Patients & Sessions into outreach_contacts
  for (const patient of initialPatients) {
    const dbRow = {
      department_id: CARCINOME_DEPT_ID,
      contact_name: patient.name,
      organization: patient.id,
      phone: patient.phone || null,
      status: "active",
      notes: JSON.stringify(patient),
    };

    const { data: existing } = await supabaseAdmin
      .from("outreach_contacts")
      .select("id")
      .eq("department_id", CARCINOME_DEPT_ID)
      .eq("organization", patient.id);

    if (existing && existing.length > 0) {
      await supabaseAdmin
        .from("outreach_contacts")
        .update(dbRow)
        .eq("id", existing[0].id);
    } else {
      await supabaseAdmin.from("outreach_contacts").insert(dbRow);
    }
  }
  results.push(`✓ Seeded ${initialPatients.length} patients and sessions into Supabase (outreach_contacts)`);

  // 2. Seed Tasks into tasks table
  for (const task of initialTasks) {
    const extra = {
      id: task.id,
      desc: task.description || "",
      patientId: task.patientId || "",
      patientName: task.patientName || "",
      assignee: task.assignee || "Komal",
      category: task.category || "General",
    };

    const dbRow = {
      department_id: CARCINOME_DEPT_ID,
      title: task.title,
      description: JSON.stringify(extra),
      status: task.status === "Completed" ? "completed" : task.status === "In Progress" ? "in_progress" : "todo",
      priority: (task.priority || "medium").toLowerCase(),
      due_date: task.dueDate || null,
    };

    const { data: existing } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("department_id", CARCINOME_DEPT_ID);

    const target = (existing || []).find((t: any) => {
      try {
        const parsed = JSON.parse(t.description);
        return parsed.id === task.id;
      } catch {
        return false;
      }
    });

    if (target) {
      await supabaseAdmin.from("tasks").update(dbRow).eq("id", target.id);
    } else {
      await supabaseAdmin.from("tasks").insert(dbRow);
    }
  }
  results.push(`✓ Seeded ${initialTasks.length} tasks into Supabase (tasks)`);

  // 3. Seed Audit Logs into activity_logs table
  for (const log of initialAuditLogs) {
    const meta = {
      id: log.id,
      targetId: log.targetId || "",
      timestamp: log.timestamp,
      actor: log.actor || "Team Lead",
      role: log.role || "Team Lead",
      details: log.details || "",
      changes: log.changes || null,
    };

    const dbRow = {
      department_id: CARCINOME_DEPT_ID,
      title: log.targetName || log.details || "Activity Log",
      action: log.action || "UPDATE",
      table_name: log.targetType || "Patient",
      record_id: null,
      metadata: meta,
    };

    const { data: existing } = await supabaseAdmin
      .from("activity_logs")
      .select("*")
      .eq("department_id", CARCINOME_DEPT_ID);

    const target = (existing || []).find((a: any) => {
      try {
        const parsed = typeof a.metadata === "string" ? JSON.parse(a.metadata) : a.metadata;
        return parsed?.id === log.id;
      } catch {
        return false;
      }
    });

    if (target) {
      await supabaseAdmin.from("activity_logs").update(dbRow).eq("id", target.id);
    } else {
      await supabaseAdmin.from("activity_logs").insert(dbRow);
    }
  }
  results.push(`✓ Seeded ${initialAuditLogs.length} audit logs into Supabase (activity_logs)`);

  res.json({ results });
};
