import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verifyJWT } from "./auth";
import { normalizeRole, type Role } from "./roles";

export interface Session {
  id: string;
  email: string;
  name?: string;
  role: Role;
}

/**
 * Read the auth cookie and return the current session, or null if not logged
 * in / token invalid. Safe to call from server components and server actions.
 */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload) return null;

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: normalizeRole(payload.role),
  };
}

/** Require a logged-in user. Redirects to /admin/login otherwise. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

/**
 * Require a specific role. Redirects unauthenticated users to login and
 * insufficiently-privileged users to /admin (the dashboard they can see).
 */
export async function requireRole(role: Role): Promise<Session> {
  const session = await requireSession();
  if (role === "owner" && session.role !== "owner") {
    redirect("/admin?error=forbidden");
  }
  return session;
}
