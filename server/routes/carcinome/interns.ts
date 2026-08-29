import { RequestHandler } from "express";
import { parseMasterDataRow } from "./masterdata";
import { supabaseAdmin } from "../../supabaseClient";

const CARCINOME_DEPT_ID = "44e9a0b7-e3e1-43cf-adee-13fef2fe5c61";
const INTERN_DEFAULT_PASSWORD = "12345678";

export async function findInternByEmail(email: string): Promise<{ name: string; gmail: string; id: string } | null> {
  if (!supabaseAdmin) return null;
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail) return null;

  const { data } = await supabaseAdmin
    .from("outreach_contacts")
    .select("*")
    .eq("department_id", CARCINOME_DEPT_ID)
    .eq("status", "active");

  const masterData = (data || [])
    .filter((r: any) => r.organization?.startsWith("md-"))
    .map(parseMasterDataRow);

  const match = masterData.find(
    (m: any) =>
      m.category === "Assignee" &&
      m.active &&
      typeof m.gmail === "string" &&
      m.gmail.toLowerCase().trim() === cleanEmail
  );

  if (!match) return null;
  return { name: match.label, gmail: match.gmail, id: match.id };
}

// POST /api/carcinome/interns/sync-accounts
// Provisions Supabase auth accounts for ALL active Assignees that have a gmail set.
// Returns a summary of created / already-existed / failed accounts.
export const handleSyncInternAccounts: RequestHandler = async (_req, res) => {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase not connected" });
    return;
  }

  const { data } = await supabaseAdmin
    .from("outreach_contacts")
    .select("*")
    .eq("department_id", CARCINOME_DEPT_ID)
    .eq("status", "active");

  const masterData = (data || [])
    .filter((r: any) => r.organization?.startsWith("md-"))
    .map(parseMasterDataRow);

  const assignees = masterData.filter(
    (m: any) => m.category === "Assignee" && m.active && typeof m.gmail === "string" && m.gmail.trim()
  );

  const results: { gmail: string; status: "created" | "reset" | "failed"; message?: string }[] = [];

  for (const assignee of assignees) {
    const email = (assignee.gmail as string).toLowerCase().trim();
    try {
      // Try creating
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: INTERN_DEFAULT_PASSWORD,
        email_confirm: true,
      });

      if (!createError) {
        results.push({ gmail: email, status: "created" });
        continue;
      }

      // Already exists — reset password
      if (createError.message?.toLowerCase().includes("already") || createError.status === 422) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existing = list?.users?.find((u: any) => u.email === email);
        if (existing) {
          await supabaseAdmin.auth.admin.updateUserById(existing.id, {
            password: INTERN_DEFAULT_PASSWORD,
            email_confirm: true,
          });
          results.push({ gmail: email, status: "reset" });
        } else {
          results.push({ gmail: email, status: "failed", message: "User not found after creation conflict" });
        }
        continue;
      }

      results.push({ gmail: email, status: "failed", message: createError.message });
    } catch (err: any) {
      results.push({ gmail: email, status: "failed", message: err?.message ?? "Unknown error" });
    }
  }

  console.log("[Intern Auth] Sync results:", results);
  res.json({ synced: results.length, results });
};

// GET /api/carcinome/interns/by-email?email=...
// Returns the Assignee master-data item whose gmail matches the queried email.
// Used by the login endpoint to detect carcinome interns.
export const handleGetInternByEmail: RequestHandler = async (req, res) => {
  const email = (req.query.email as string || "").toLowerCase().trim();

  if (!email) {
    res.status(400).json({ error: "email query parameter is required" });
    return;
  }

  const intern = await findInternByEmail(email);

  if (!intern) {
    res.status(404).json({ intern: null });
    return;
  }

  res.json({ intern });
};

