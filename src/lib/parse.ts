// Helpers for turning FormData into values for Drizzle inserts. Numeric
// columns are stored as strings; empty inputs become null (not "0" or "").

export function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export function reqStr(fd: FormData, key: string): string {
  const s = str(fd, key);
  if (s === null) throw new Error(`Missing required field: ${key}`);
  return s;
}

/** Numeric column value: keep as string for Drizzle, or null when blank. */
export function num(fd: FormData, key: string): string | null {
  const s = str(fd, key);
  if (s === null) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? String(n) : null;
}

export function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

/**
 * Parse a hidden JSON-array field (used for the qualifications + documents
 * repeaters). Returns null when blank/invalid/empty so the JSONB column stays
 * null rather than storing "[]".
 */
export function jsonArray<T = unknown>(fd: FormData, key: string): T[] | null {
  const s = str(fd, key);
  if (s === null) return null;
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

/**
 * Date input (YYYY-MM-DD) that must NOT be in the future — server-side twin
 * of the `max={today}` HTML constraint, so it holds even if the client
 * validation is bypassed.
 */
export function pastDate(fd: FormData, key: string, label = key): string | null {
  const s = str(fd, key);
  if (s === null) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new Error(`Invalid date for ${label}.`);
  }
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (s > today) {
    throw new Error(`${label} cannot be in the future.`);
  }
  return s;
}
