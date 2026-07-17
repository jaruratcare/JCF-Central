import type { Request, Response, NextFunction } from "express";
import { sbSelect, sbInsert, toCamel } from "../supabase";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export interface AppUser {
  id: string;
  name: string;
  email: string;
  deptId: string | null;
  roleId: string | null;
  status: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AppUser;
    }
  }
}

let cachedCeoOfficeDeptId: string | null = null;

/**
 * Resolves the "ceo_office" department id. Successful lookups are cached for
 * the process lifetime; a failed or not-yet-seeded lookup (null) is NOT
 * cached, so a later request can retry once the row exists / the DB call
 * succeeds, rather than permanently locking out CEO Office authorization.
 */
export async function getCeoOfficeDeptId(): Promise<string | null> {
  if (cachedCeoOfficeDeptId) return cachedCeoOfficeDeptId;
  const rows = await sbSelect("departments", { slug: "eq.ceo_office" });
  const id = (rows[0]?.id as string | undefined) ?? null;
  if (id) cachedCeoOfficeDeptId = id;
  return id;
}

export async function isCeoOffice(user: Pick<AppUser, "deptId">): Promise<boolean> {
  if (!user.deptId) return false;
  const ceoId = await getCeoOfficeDeptId();
  return ceoId !== null && user.deptId === ceoId;
}

const roleSlugCache = new Map<string, string>();

/** Resolves a role id to its slug (e.g. "member", "pod_lead"). Successful lookups are cached. */
export async function getRoleSlug(roleId: string | null): Promise<string | null> {
  if (!roleId) return null;
  const cached = roleSlugCache.get(roleId);
  if (cached) return cached;
  const rows = await sbSelect("roles", { id: `eq.${roleId}` });
  const slug = (rows[0]?.slug as string | undefined) ?? null;
  if (slug) roleSlugCache.set(roleId, slug);
  return slug;
}

/**
 * The base individual-contributor org role (whatever it's named — "member",
 * "associate", etc: the tier with the highest hierarchy_level) cannot create
 * projects — only pod leads and above. Kept in sync with isElevatedRole so
 * both use the same hierarchy-based definition instead of a fixed slug,
 * since seeded role slugs vary by org (ceo/director/manager/associate here).
 */
export async function isMemberRole(user: Pick<AppUser, "roleId">): Promise<boolean> {
  return !(await isElevatedRole(user));
}

const roleHierarchyCache = new Map<string, number>();

/** Resolves a role id to its hierarchy_level (1 = highest, e.g. CEO). Successful lookups are cached. */
async function getRoleHierarchyLevel(roleId: string | null): Promise<number | null> {
  if (!roleId) return null;
  const cached = roleHierarchyCache.get(roleId);
  if (cached !== undefined) return cached;
  const rows = await sbSelect("roles", { id: `eq.${roleId}` });
  const level = (rows[0]?.hierarchy_level as number | undefined) ?? null;
  if (level !== null) roleHierarchyCache.set(roleId, level);
  return level;
}

/**
 * True for any role above the base individual-contributor tier (the highest
 * hierarchy_level value, e.g. "associate"). Department managers, directors,
 * and CEOs are all "elevated" and get manage access over their department's
 * projects, mirroring the pod-lead-and-above rule used for project creation.
 */
let cachedMaxHierarchyLevel: number | null = null;

async function getMaxRoleHierarchyLevel(): Promise<number | null> {
  if (cachedMaxHierarchyLevel !== null) return cachedMaxHierarchyLevel;
  const rows = await sbSelect("roles", {});
  const levels = rows.map((r) => r.hierarchy_level as number).filter((n) => typeof n === "number");
  if (levels.length === 0) return null;
  cachedMaxHierarchyLevel = Math.max(...levels);
  return cachedMaxHierarchyLevel;
}

export async function isElevatedRole(user: Pick<AppUser, "roleId">): Promise<boolean> {
  const [level, maxLevel] = await Promise.all([getRoleHierarchyLevel(user.roleId), getMaxRoleHierarchyLevel()]);
  if (level === null || maxLevel === null) return false;
  return level < maxLevel;
}

/**
 * Verifies the Supabase access token against Supabase Auth, then loads (or
 * auto-provisions) the corresponding row in our `users` table. Department and
 * role start unset and must be assigned manually afterwards.
 */
export async function requireUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_KEY },
  });
  if (!authRes.ok) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }
  const authUser = (await authRes.json()) as { id: string; email?: string; user_metadata?: Record<string, unknown> };

  const existing = await sbSelect("users", { id: `eq.${authUser.id}` });
  let row = existing[0];
  if (!row) {
    const name =
      (authUser.user_metadata?.full_name as string | undefined) ||
      (authUser.user_metadata?.name as string | undefined) ||
      authUser.email?.split("@")[0] ||
      "Unknown";
    row = await sbInsert("users", {
      id: authUser.id,
      name,
      email: authUser.email ?? "",
      status: "active",
    });
  }

  const camel = toCamel(row) as unknown as AppUser;
  req.user = camel;
  next();
}

let cachedTechDeptId: string | null = null;

/** Resolves the "tech" department id. Successful lookups are cached. */
export async function getTechDeptId(): Promise<string | null> {
  if (cachedTechDeptId) return cachedTechDeptId;
  const rows = await sbSelect("departments", { slug: "eq.tech" });
  const id = (rows[0]?.id as string | undefined) ?? null;
  if (id) cachedTechDeptId = id;
  return id;
}

export async function isTechDepartment(user: Pick<AppUser, "deptId">): Promise<boolean> {
  if (!user.deptId) return false;
  const techId = await getTechDeptId();
  return techId !== null && user.deptId === techId;
}

/** Enforces that the authenticated user belongs to either the Tech department or CEO Office. */
export async function requireTechOrCeo(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [ceo, tech] = await Promise.all([
    isCeoOffice(user),
    isTechDepartment(user),
  ]);

  if (!ceo && !tech) {
    res.status(403).json({ error: "Access denied. Only Tech department and CEO Office members are allowed." });
    return;
  }

  next();
}
