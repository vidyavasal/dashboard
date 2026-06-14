import { notFound } from "next/navigation";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices, invoiceItems } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { formatMoney, formatDate, toNumber } from "@/lib/format";
import { invoiceNumber, INVOICE_TYPE_LABELS } from "@/lib/invoice";
import PrintButton from "./PrintButton";
import { decodeId, encodeId } from "@/lib/ids";

// Update with the real registered business details before going live.
const BUSINESS = {
  name: "Vidyavasal",
  tagline: "University Admissions & Distance Education",
  address: "Kerala, India",
  email: "info@vidyavasal.com",
};

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("owner", "staff");
  const { id: idToken } = await params;
  const id = decodeId(idToken);
  if (!id) notFound();

  const [inv] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);
  if (!inv) notFound();

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, id))
    .orderBy(asc(invoiceItems.sortOrder));

  const balance = toNumber(inv.total) - toNumber(inv.amountPaid);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto p-8">
        <div className="print:hidden mb-6 flex items-center justify-between">
          <Link
            href={`/admin/invoices/${encodeId(inv.id)}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to edit
          </Link>
          <PrintButton />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 pb-6 mb-6">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {BUSINESS.name}
            </div>
            <div className="text-sm text-gray-500">{BUSINESS.tagline}</div>
            <div className="text-xs text-gray-400 mt-2">
              {BUSINESS.address}
              <br />
              {BUSINESS.email}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {INVOICE_TYPE_LABELS[inv.type] ?? "Invoice"}
            </div>
            <div className="text-sm text-gray-600">
              {invoiceNumber(inv.seq)}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Date: {formatDate(inv.invoiceDate) || "—"}
              {inv.dueDate && (
                <>
                  <br />
                  Due: {formatDate(inv.dueDate)}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bill to */}
        <div className="mb-6">
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
            Bill to
          </div>
          <div className="text-sm font-medium text-gray-900">
            {inv.partyName ?? "—"}
          </div>
        </div>

        {/* Items */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-y border-gray-200 text-left text-gray-500">
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 font-medium text-right w-16">Qty</th>
              <th className="py-2 font-medium text-right w-32">Unit Price</th>
              <th className="py-2 font-medium text-right w-32">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-gray-100">
                <td className="py-2 text-gray-800">{it.description ?? "—"}</td>
                <td className="py-2 text-right text-gray-600">
                  {it.quantity ?? "1"}
                </td>
                <td className="py-2 text-right text-gray-600">
                  {formatMoney(it.unitPrice)}
                </td>
                <td className="py-2 text-right text-gray-800">
                  {formatMoney(it.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 text-sm space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatMoney(inv.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>{formatMoney(inv.tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1">
              <span>Total</span>
              <span>{formatMoney(inv.total)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Paid</span>
              <span>{formatMoney(inv.amountPaid)}</span>
            </div>
            <div className="flex justify-between font-medium text-gray-900">
              <span>Balance due</span>
              <span>{formatMoney(balance)}</span>
            </div>
          </div>
        </div>

        {inv.notes && (
          <div className="mt-8 text-xs text-gray-500 border-t border-gray-100 pt-4">
            {inv.notes}
          </div>
        )}

        <div className="mt-10 text-center text-xs text-gray-400">
          This is a computer-generated document.
        </div>
      </div>
    </div>
  );
}
