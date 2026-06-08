// Shared invoice helpers (safe for both client and server — no DB imports).

/** Human invoice number derived from the DB identity column. e.g. INV-0042 */
export function invoiceNumber(seq: number): string {
  return `INV-${String(seq).padStart(4, "0")}`;
}

export const INVOICE_TYPE_LABELS: Record<string, string> = {
  student_fee: "Student Fee",
  staff_salary: "Salary Slip",
  other: "Invoice",
};

export const INVOICE_STATUSES = [
  "draft",
  "issued",
  "paid",
  "cancelled",
] as const;
