"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Invoice, InvoiceItem } from "@/lib/db/schema";
import { toNumber, formatMoney } from "@/lib/format";
import { invoiceNumber } from "@/lib/invoice";
import { saveInvoice } from "../actions";
import { todayStr } from "@/lib/dates";

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

interface ItemRow {
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
}

export default function InvoiceEditForm({
  invoice,
  idToken,
  items: initialItems,
}: {
  idToken: string;
  invoice: Invoice;
  items: InvoiceItem[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [type, setType] = useState(invoice.type);
  // partyType is set by the generator (student/staff/other) and not edited here.
  const partyType = invoice.partyType ?? "other";
  const [partyName, setPartyName] = useState(invoice.partyName ?? "");
  const [invoiceDate, setInvoiceDate] = useState(invoice.invoiceDate ?? "");
  const [dueDate, setDueDate] = useState(invoice.dueDate ?? "");
  const [tax, setTax] = useState(invoice.tax ?? "0");
  const [amountPaid, setAmountPaid] = useState(invoice.amountPaid ?? "0");
  const [status, setStatus] = useState(invoice.status ?? "draft");
  const [notes, setNotes] = useState(invoice.notes ?? "");

  const [items, setItems] = useState<ItemRow[]>(
    initialItems.length
      ? initialItems.map((i) => ({
          description: i.description ?? "",
          quantity: i.quantity ?? "1",
          unitPrice: i.unitPrice ?? "0",
          amount: i.amount ?? "0",
        }))
      : [{ description: "", quantity: "1", unitPrice: "0", amount: "0" }]
  );

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + toNumber(it.amount), 0),
    [items]
  );
  const total = subtotal + toNumber(tax);

  function updateItem(idx: number, patch: Partial<ItemRow>) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, ...patch };
        // Auto-fill amount from qty × unit price unless amount was edited.
        if (patch.quantity !== undefined || patch.unitPrice !== undefined) {
          next.amount = String(
            toNumber(next.quantity) * toNumber(next.unitPrice)
          );
        }
        return next;
      })
    );
  }

  function addItem() {
    setItems((p) => [
      ...p,
      { description: "", quantity: "1", unitPrice: "0", amount: "0" },
    ]);
  }
  function removeItem(idx: number) {
    setItems((p) => p.filter((_, i) => i !== idx));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await saveInvoice(
        invoice.id,
        {
          type,
          partyType,
          partyName,
          invoiceDate,
          dueDate,
          tax,
          amountPaid,
          status,
          notes,
        },
        items
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/invoices"
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ← Back
          </Link>
          <h1 className="text-lg font-bold text-gray-900">
            {invoiceNumber(invoice.seq)}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-green-600 text-sm font-medium">✓ Saved</span>
          )}
          <Link
            href={`/admin/invoices/${idToken}/print`}
            target="_blank"
            className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Print / PDF ↗
          </Link>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={inputCls}
            >
              <option value="student_fee">Student Fee</option>
              <option value="staff_salary">Salary Slip</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bill to (name)
            </label>
            <input
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice date
            </label>
            <input
              type="date"
              value={invoiceDate}
              max={todayStr()}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due date
            </label>
            <input
              type="date"
              value={dueDate}
              min={invoiceDate || undefined}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputCls}
            >
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-600">
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="px-3 py-2 font-medium w-20 text-right">Qty</th>
              <th className="px-3 py-2 font-medium w-32 text-right">
                Unit Price
              </th>
              <th className="px-3 py-2 font-medium w-32 text-right">Amount</th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2">
                  <input
                    value={it.description}
                    onChange={(e) =>
                      updateItem(idx, { description: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Item description"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={it.quantity}
                    onChange={(e) =>
                      updateItem(idx, { quantity: e.target.value })
                    }
                    className={`${inputCls} text-right`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={it.unitPrice}
                    onChange={(e) =>
                      updateItem(idx, { unitPrice: e.target.value })
                    }
                    className={`${inputCls} text-right`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={it.amount}
                    onChange={(e) => updateItem(idx, { amount: e.target.value })}
                    className={`${inputCls} text-right`}
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-3 py-2 border-t border-gray-100">
          <button
            type="button"
            onClick={addItem}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add line
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-full sm:w-80 bg-white border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Tax</span>
            <input
              type="number"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className="w-28 px-2 py-1 text-right border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex justify-between font-semibold border-t border-gray-100 pt-2">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Amount paid</span>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-28 px-2 py-1 text-right border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Balance</span>
            <span>{formatMoney(total - toNumber(amountPaid))}</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={inputCls}
          placeholder="Payment terms, thank-you note, etc."
        />
      </div>
    </div>
  );
}
