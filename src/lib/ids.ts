import { createCipheriv, createDecipheriv, createHash } from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Opaque record ids for URLs.
//
// Database rows use UUIDs; exposing them raw in URLs leaks record identity
// across systems and looks untrustworthy. `encodeId` encrypts the 16-byte
// UUID with a key derived from ADMIN_JWT_SECRET into a short base64url token
// (22 chars), and `decodeId` reverses it. Deterministic, so links stay
// stable. Tampered/garbage tokens decode to null → the page 404s.
//
// decodeId also accepts a raw UUID, so any pre-existing bookmarked links
// keep working.
//
// Server-only (uses node:crypto + the secret) — do not import from client
// components; pages pass already-encoded strings down as props.
// ─────────────────────────────────────────────────────────────────────────────

const KEY = createHash("sha256")
  .update(process.env.ADMIN_JWT_SECRET ?? "iode-tracker-dev")
  .digest()
  .subarray(0, 16);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuidToBytes(uuid: string): Buffer {
  return Buffer.from(uuid.replace(/-/g, ""), "hex");
}

function bytesToUuid(buf: Buffer): string {
  const h = buf.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** UUID -> short opaque URL token. */
export function encodeId(uuid: string): string {
  // A UUID is exactly one AES block, so ECB-without-padding is a clean
  // 1:1 mapping here (single block — no pattern leakage concerns).
  const cipher = createCipheriv("aes-128-ecb", KEY, null);
  cipher.setAutoPadding(false);
  const out = Buffer.concat([cipher.update(uuidToBytes(uuid)), cipher.final()]);
  return out.toString("base64url");
}

/** Opaque token (or legacy raw UUID) -> UUID, or null if invalid. */
export function decodeId(token: string): string | null {
  if (UUID_RE.test(token)) return token.toLowerCase();
  try {
    const buf = Buffer.from(token, "base64url");
    if (buf.length !== 16) return null;
    const decipher = createDecipheriv("aes-128-ecb", KEY, null);
    decipher.setAutoPadding(false);
    const out = Buffer.concat([decipher.update(buf), decipher.final()]);
    return bytesToUuid(out);
  } catch {
    return null;
  }
}
