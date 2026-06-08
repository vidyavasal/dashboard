// ────────────────────────────────────────────────────────────────────────────
// Role model for the tracker. We reuse the main site's `admin_users.role`.
//
//   owner → full access (finance: salaries, expenses, investments, profit,
//           dashboard, reports — plus everything below).
//   staff → hired admin: content (universities/courses/blog) + admissions +
//           invoicing. NO finance.
//   sales → admissions only, their own records.
//
// IMPORTANT back-compat: the existing owner logins in `admin_users` have
// role = "admin". So "admin" (and any unknown value) maps to OWNER, never to
// the limited `staff` role — otherwise the real owners would lose finance.
// Give a hired user limited access by setting their `admin_users.role` to
// "staff" (or "sales").
//
// This file must stay free of Node-only / DB imports so middleware can use it.
// ────────────────────────────────────────────────────────────────────────────

export type Role = "owner" | "staff" | "sales";

/** Normalise a raw `admin_users.role` value into our role model. */
export function normalizeRole(raw: string | null | undefined): Role {
  const r = (raw ?? "").toLowerCase();
  if (r === "sales") return "sales";
  if (r === "staff") return "staff";
  // "admin", "owner", and anything else → owner (full access, back-compat).
  return "owner";
}

export function isOwner(role: Role): boolean {
  return role === "owner";
}

/** Content + invoicing are available to owners and hired staff, not sales. */
export function canManageContent(role: Role): boolean {
  return role === "owner" || role === "staff";
}
