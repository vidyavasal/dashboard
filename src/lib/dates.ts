// Local-time date helpers for form constraints (YYYY-MM-DD strings).
// Safe to import from client components.

function fmt(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Today as YYYY-MM-DD (local time). */
export function todayStr(): string {
  return fmt(new Date());
}

/** N days before today as YYYY-MM-DD. */
export function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmt(d);
}

/** N months before today as YYYY-MM-DD. */
export function monthsAgoStr(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return fmt(d);
}

/** Current month as YYYY-MM (for <input type="month">). */
export function thisMonthStr(): string {
  return todayStr().slice(0, 7);
}
