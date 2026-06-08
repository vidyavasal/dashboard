import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

// ────────────────────────────────────────────────────────────────────────────
// Ported from the main marketing site (iode / Vidyavasal). Keeping the SAME
// COOKIE_NAME and ADMIN_JWT_SECRET means a login on the main site is also a
// valid login here (shared session). If you don't want shared login, set a
// different ADMIN_JWT_SECRET in this app's env.
// ────────────────────────────────────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "dev-secret-change-in-production"
);

const COOKIE_NAME = "iode_admin_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// ─── JWT ─────────────────────────────────────────────────────────────────────

export interface AdminJWTPayload {
  sub: string; // admin user id
  email: string;
  name?: string;
  role: string;
}

export async function signJWT(payload: AdminJWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<AdminJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AdminJWTPayload;
  } catch {
    return null;
  }
}

// ─── Password ────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export { COOKIE_NAME, COOKIE_MAX_AGE };
