import { RequestHandler } from "express";
import { supabaseAdmin } from "../../supabaseClient";
import { initialMasterData } from "../../../client/departments/carcinome/data/dummy-data";

const INTERN_DEFAULT_PASSWORD = "12345678";

/**
 * Ensures a Supabase auth user exists for the given gmail with the default password.
 * - If the user doesn't exist → creates them (email_confirm: true).
 * - If the user already exists → updates their password to the default.
 * Always resolves — never throws — so master-data save is never blocked.
 */
async function provisionInternAuthUser(gmail: string): Promise<void> {
  if (!supabaseAdmin) return;

  const email = gmail.toLowerCase().trim();

  // Try creating first
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: INTERN_DEFAULT_PASSWORD,
    email_confirm: true,
  });

  if (!createError) {
    console.log(`[Intern Auth] Created Supabase user for ${email}`);
    return;
  }

  // If user already exists, look them up and update the password
  if (createError.message?.toLowerCase().includes("already") || createError.status === 422) {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list?.users?.find((u: any) => u.email === email);
    if (existing) {
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: INTERN_DEFAULT_PASSWORD,
        email_confirm: true,
      });
      console.log(`[Intern Auth] Reset password for existing user ${email}`);
    }
    return;
  }

  console.warn(`[Intern Auth] Could not provision user for ${email}:`, createError.message);
}

const CARCINOME_DEPT_ID = "44e9a0b7-e3e1-43cf-adee-13fef2fe5c61";

export function parseMasterDataRow(row: any): any {
  let extra: any = {};
  if (row.notes) {
    try {
      extra = typeof row.notes === "string" ? JSON.parse(row.notes) : row.notes;
    } catch {
      extra = {};
    }
  }
  return {
    id: extra.id || row.organization || row.id,
    category: extra.category || row.phone || "General",
    value: extra.value || row.contact_name,
    label: extra.label || row.contact_name,
    description: extra.description || "",
    active: extra.active ?? true,
    gmail: extra.gmail || undefined,
  };
}

// GET /api/carcinome/master-data
export const handleGetMasterData: RequestHandler = async (_req, res) => {
  if (!supabaseAdmin) {
    res.json({ masterData: initialMasterData });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("outreach_contacts")
    .select("*")
    .eq("department_id", CARCINOME_DEPT_ID)
    .eq("status", "active");

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const mdRows = (data || []).filter((r: any) => r.organization?.startsWith("md-"));

  if (mdRows.length === 0) {
    const seededItems: any[] = [];
    for (const item of initialMasterData) {
      const dbRow = {
        department_id: CARCINOME_DEPT_ID,
        contact_name: item.label,
        organization: item.id,
        phone: item.category,
        status: "active",
        notes: JSON.stringify(item),
      };
      const { data: ins } = await supabaseAdmin
        .from("outreach_contacts")
        .insert(dbRow)
        .select()
        .single();
      if (ins) seededItems.push(parseMasterDataRow(ins));
    }
    res.json({ masterData: seededItems });
    return;
  }

  const masterData = mdRows.map(parseMasterDataRow);
  res.json({ masterData });
};

// POST /api/carcinome/master-data
export const handleAddMasterData: RequestHandler = async (req, res) => {
  const item = req.body;
  const itemId = item.id || `md-custom-${Date.now().toString().slice(-4)}`;
  const newItem: any = {
    id: itemId,
    category: item.category,
    value: item.value,
    label: item.label,
    description: item.description || "",
    active: item.active ?? true,
  };

  if (item.category === "Assignee" && item.gmail) {
    newItem.gmail = item.gmail.toLowerCase().trim();
    provisionInternAuthUser(newItem.gmail).catch(console.warn);
  }

  if (!supabaseAdmin) {
    res.json({ item: newItem });
    return;
  }

  const dbRow = {
    department_id: CARCINOME_DEPT_ID,
    contact_name: newItem.label,
    organization: newItem.id,
    phone: newItem.category,
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

  res.json({ item: parseMasterDataRow(inserted) });
};

// PATCH /api/carcinome/master-data/:id
export const handleUpdateMasterData: RequestHandler = async (req, res) => {
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
    .eq("status", "active")
    .eq("organization", id);

  if (!existingRows || existingRows.length === 0) {
    res.status(404).json({ error: "Master data item not found" });
    return;
  }

  const existingRow = existingRows[0];
  const currentItem = parseMasterDataRow(existingRow);
  const updatedItem = { ...currentItem, ...updates };

  if (updatedItem.category === "Assignee" && updates.gmail !== undefined) {
    updatedItem.gmail = updates.gmail ? updates.gmail.toLowerCase().trim() : undefined;
    if (updatedItem.gmail) {
      provisionInternAuthUser(updatedItem.gmail).catch(console.warn);
    }
  }

  const dbRow = {
    contact_name: updatedItem.label,
    organization: updatedItem.id,
    phone: updatedItem.category,
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

  res.json({ item: parseMasterDataRow(updated) });
};

// DELETE /api/carcinome/master-data/:id
export const handleDeleteMasterData: RequestHandler = async (req, res) => {
  const { id } = req.params;

  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase client not initialized" });
    return;
  }

  const { error } = await supabaseAdmin
    .from("outreach_contacts")
    .delete()
    .eq("department_id", CARCINOME_DEPT_ID)
    .eq("status", "active")
    .eq("organization", id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, id });
};


