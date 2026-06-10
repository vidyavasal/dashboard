import { randomBytes } from "crypto";

/** URL-safe token for the per-student dynamic profile link. */
export function generateFormToken(): string {
  return randomBytes(24).toString("base64url"); // 32 chars
}
