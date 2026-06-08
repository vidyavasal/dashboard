// ────────────────────────────────────────────────────────────────────────────
// Role model for the tracker. We reuse the main site's `admin_users.role`
// column. The main site historically uses "admin" for full-access logins, so
// we treat "admin" as "owner" for backwards-compat.
//
//   owner → full access (finance: salaries, expenses, investments, profit)
//   sales → admissions only (their own tracker_students rows)
//
// Both `roles.ts` (imported by middleware) and the rest of the app share this,
// so it must stay free of Node-only / DB imports to run on any runtime.
// ────────────────────────────────────────────────────────────────────────────

export type Role = "owner" | "sales";

/** Normalise a raw `admin_users.role` value into our two-role model. */
export function normalizeRole(raw: string | null | undefined): Role {
  const r = (raw ?? "").toLowerCase();
  if (r === "sales") return "sales";
  // "admin", "owner", and anything else map to owner (full access).
  return "owner";
}

export function isOwner(role: Role): boolean {
  return role === "owner";
}
