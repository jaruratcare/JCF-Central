import { RequestHandler } from "express";
import { supabaseAdmin } from "../../supabaseClient";
import {
  patients as initialPatients,
  initialTasks,
  initialAuditLogs,
  initialMasterData,
  initialNotes,
  initialDocuments,
} from "../../../client/departments/carcinome/data/dummy-data";
import { initialOncologistOutreach } from "../../../client/departments/carcinome/data/outreach-data";

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
      status: task.status === "Completed" ? "done" : task.status === "In Progress" ? "in_progress" : "todo",
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

  // 4. Seed Master Data into outreach_contacts table
  for (const item of initialMasterData) {
    const dbRow = {
      department_id: CARCINOME_DEPT_ID,
      contact_name: item.label,
      organization: item.id,
      phone: item.category,
      status: "active",
      notes: JSON.stringify(item),
    };

    const { data: existing } = await supabaseAdmin
      .from("outreach_contacts")
      .select("id")
      .eq("department_id", CARCINOME_DEPT_ID)
      .eq("status", "active")
      .eq("organization", item.id);

    if (existing && existing.length > 0) {
      await supabaseAdmin
        .from("outreach_contacts")
        .update(dbRow)
        .eq("id", existing[0].id);
    } else {
      await supabaseAdmin.from("outreach_contacts").insert(dbRow);
    }
  }
  results.push(`✓ Seeded ${initialMasterData.length} master data options into Supabase (outreach_contacts)`);

  // 5. Seed Patient Notes into activity_logs table
  for (const note of initialNotes) {
    const dbRow = {
      department_id: CARCINOME_DEPT_ID,
      title: note.patientId,
      action: "ADD_NOTE",
      table_name: "patient_note",
      record_id: null,
      metadata: JSON.stringify(note),
    };

    const { data: existing } = await supabaseAdmin
      .from("activity_logs")
      .select("*")
      .eq("department_id", CARCINOME_DEPT_ID)
      .eq("table_name", "patient_note");

    const target = (existing || []).find((a: any) => {
      try {
        const parsed = typeof a.metadata === "string" ? JSON.parse(a.metadata) : a.metadata;
        return parsed?.id === note.id;
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
  results.push(`✓ Seeded ${initialNotes.length} patient notes into Supabase (activity_logs)`);

  // 6. Seed Patient Documents into activity_logs table
  for (const doc of initialDocuments) {
    const dbRow = {
      department_id: CARCINOME_DEPT_ID,
      title: doc.name,
      action: "UPLOAD_DOCUMENT",
      table_name: "patient_document",
      record_id: null,
      metadata: JSON.stringify(doc),
    };

    const { data: existing } = await supabaseAdmin
      .from("activity_logs")
      .select("*")
      .eq("department_id", CARCINOME_DEPT_ID)
      .eq("table_name", "patient_document");

    const target = (existing || []).find((a: any) => {
      try {
        const parsed = typeof a.metadata === "string" ? JSON.parse(a.metadata) : a.metadata;
        return parsed?.id === doc.id;
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
  results.push(`✓ Seeded ${initialDocuments.length} patient documents into Supabase (activity_logs)`);

  // 7. Seed Oncologist Outreach into outreach_contacts table
  for (const item of initialOncologistOutreach) {
    const oocId = item.id.startsWith("OOC-") ? item.id : `OOC-${item.id}`;
    const dbRow = {
      department_id: CARCINOME_DEPT_ID,
      contact_name: item.doctorName,
      organization: oocId,
      phone: item.contactNumber || null,
      email: item.email || null,
      status: "active",
      notes: JSON.stringify({ ...item, id: oocId }),
    };

    const { data: existing } = await supabaseAdmin
      .from("outreach_contacts")
      .select("*")
      .eq("department_id", CARCINOME_DEPT_ID)
      .eq("status", "active");

    const target = (existing || []).find((r: any) => {
      if (r.id === oocId || r.organization === oocId) return true;
      try {
        const parsed = typeof r.notes === "string" ? JSON.parse(r.notes) : r.notes;
        return parsed?.id === oocId;
      } catch {
        return false;
      }
    });

    if (target) {
      await supabaseAdmin.from("outreach_contacts").update(dbRow).eq("id", target.id);
    } else {
      await supabaseAdmin.from("outreach_contacts").insert(dbRow);
    }
  }
  results.push(`✓ Seeded ${initialOncologistOutreach.length} oncologist outreach items into Supabase (outreach_contacts)`);

  res.json({ results });
};

