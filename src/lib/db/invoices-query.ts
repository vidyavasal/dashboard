import { and, count, desc, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices } from "./schema";

// Shared by the /admin/invoices list page (filters + pagination).

export interface InvoiceFiltersT {
  q?: string; // party name, or an invoice number like "INV-0012"
  type?: string;
  status?: string;
  from?: string; // invoice date on/after
  to?: string; // invoice date on/before
}

type SP = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() ? s.trim() : undefined;
}

export function parseInvoiceFilters(sp: SP): InvoiceFiltersT {
  return {
    q: first(sp.q),
    type: first(sp.type),
    status: first(sp.status),
    from: first(sp.from),
    to: first(sp.to),
  };
}

export function invoiceFilterParams(f: InvoiceFiltersT): Record<string, string | undefined> {
  return { ...f };
}

export function hasInvoiceFilters(f: InvoiceFiltersT): boolean {
  return Object.values(f).some(Boolean);
}

function whereFor(f: InvoiceFiltersT): SQL | undefined {
  const conds: (SQL | undefined)[] = [];
  if (f.q) {
    // "INV-0012" / "#12" / "12" also matches the sequence number.
    const seqDigits = f.q.replace(/\D/g, "");
    const seq = seqDigits ? parseInt(seqDigits, 10) : NaN;
    conds.push(
      or(
        ilike(invoices.partyName, `%${f.q}%`),
        Number.isFinite(seq) ? eq(invoices.seq, seq) : undefined
      )
    );
  }
  if (f.type) conds.push(eq(invoices.type, f.type));
  if (f.status) conds.push(eq(invoices.status, f.status));
  if (f.from) conds.push(gte(invoices.invoiceDate, f.from));
  if (f.to) conds.push(lte(invoices.invoiceDate, f.to));
  const real = conds.filter((c): c is SQL => !!c);
  return real.length ? and(...real) : undefined;
}

export async function queryInvoices(f: InvoiceFiltersT, page: number, pageSize: number) {
  const where = whereFor(f);
  const [rows, [{ n: total }]] = await Promise.all([
    db
      .select()
      .from(invoices)
      .where(where)
      .orderBy(desc(invoices.seq))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ n: count() }).from(invoices).where(where),
  ]);
  return { rows, total };
}
