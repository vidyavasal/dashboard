import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { DeleteButton } from "@/components/DeleteButton";
import { formatMoney, formatDate } from "@/lib/format";
import { invoiceNumber, INVOICE_TYPE_LABELS } from "@/lib/invoice";
import { deleteInvoice } from "./actions";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  issued: "bg-blue-50 text-blue-700",
  paid: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

export default async function InvoicesPage() {
  await requireRole("owner", "staff");
  const rows = await db.select().from(invoices).orderBy(desc(invoices.seq));

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">
            {rows.length} invoices — receipts, salary slips and manual bills.
          </p>
        </div>
        <Link
          href="/admin/invoices/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New Invoice
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
              <th className="px-4 py-3 font-medium">No.</th>
              <th className="px-4 py-3 font-medium">Bill to</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">
                Type
              </th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">
                Date
              </th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  No invoices yet.
                </td>
              </tr>
            )}
            {rows.map((inv) => (
              <tr
                key={inv.id}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium text-gray-900">
                  {invoiceNumber(inv.seq)}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {inv.partyName ?? "—"}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-gray-500 text-xs">
                  {INVOICE_TYPE_LABELS[inv.type] ?? inv.type}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs">
                  {formatDate(inv.invoiceDate) || "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatMoney(inv.total)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      STATUS_STYLE[inv.status ?? "draft"]
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/invoices/${inv.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/invoices/${inv.id}/print`}
                      target="_blank"
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Print
                    </Link>
                    <DeleteButton
                      id={inv.id}
                      action={deleteInvoice}
                      confirm={`Delete ${invoiceNumber(inv.seq)}?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
