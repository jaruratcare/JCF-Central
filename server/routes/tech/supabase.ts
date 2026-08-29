/**
 * Thin Supabase PostgREST client over HTTPS.
 * Replit's sandbox blocks outbound TCP to external Postgres hosts,
 * so we use the Supabase REST API (port 443) instead of direct Drizzle.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use Tech API routes");
}

const BASE = `${SUPABASE_URL}/rest/v1`;

const headers = () => ({
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
});

type Row = Record<string, unknown>;

/** SELECT with optional PostgREST query params */
export async function sbSelect(table: string, params: Record<string, string> = {}): Promise<Row[]> {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE}/${table}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(`Supabase GET ${table}: ${res.status} ${await res.text()}`);
  return res.json() as Promise<Row[]>;
}

/** INSERT one row, returns the inserted row */
export async function sbInsert(table: string, row: Row): Promise<Row> {
  const res = await fetch(`${BASE}/${table}`, {
    method: "POST",
    headers: { ...headers(), "Prefer": "return=representation" },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Supabase POST ${table}: ${res.status} ${await res.text()}`);
  const rows = await res.json() as Row[];
  return rows[0]!;
}

/** UPDATE matching rows, returns first updated row */
export async function sbUpdate(table: string, filter: Record<string, string>, data: Row): Promise<Row | null> {
  const qs = new URLSearchParams(filter).toString();
  const res = await fetch(`${BASE}/${table}?${qs}`, {
    method: "PATCH",
    headers: { ...headers(), "Prefer": "return=representation" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase PATCH ${table}: ${res.status} ${await res.text()}`);
  const rows = await res.json() as Row[];
  return rows[0] ?? null;
}

/** DELETE matching rows */
export async function sbDelete(table: string, filter: Record<string, string>): Promise<void> {
  const qs = new URLSearchParams(filter).toString();
  const res = await fetch(`${BASE}/${table}?${qs}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Supabase DELETE ${table}: ${res.status} ${await res.text()}`);
}

/** Convert PostgREST snake_case row to camelCase for our API responses */
export function toCamel(row: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = v;
  }
  return out;
}

/** Convert camelCase body to snake_case for PostgREST */
export function toSnake(obj: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(obj)) {
    const snake = k.replace(/([A-Z])/g, "_$1").toLowerCase();
    out[snake] = v;
  }
  return out;
}
