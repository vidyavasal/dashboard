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
