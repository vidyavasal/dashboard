// Shared formatting helpers. Money is stored as `numeric` strings in Postgres
// (via Drizzle), so everything here accepts string | number | null.

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function toNumber(v: string | number | null | undefined): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/** ₹1,23,456 — whole rupees. */
export function formatMoney(v: string | number | null | undefined): string {
  return inr.format(toNumber(v));
}

/** ₹1,23,456.78 — paise precision. */
export function formatMoneyPrecise(
  v: string | number | null | undefined
): string {
  return inrPrecise.format(toNumber(v));
}

/** "8 Jun 2026" from a YYYY-MM-DD (or Date). Empty string for nullish. */
export function formatDate(v: string | Date | null | undefined): string {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(v + "T00:00:00") : v;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** YYYY-MM month key from a YYYY-MM-DD date string. */
export function monthKey(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  return dateStr.slice(0, 7);
}

/** Human label for a YYYY-MM month key, e.g. "Jun 2026". */
export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}
