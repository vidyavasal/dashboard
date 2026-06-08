import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { students, salaries, staff } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { monthLabel, formatMoney } from "@/lib/format";
import {
  createManualInvoice,
  createInvoiceFromAdmission,
  createInvoiceFromSalary,
} from "../actions";

export default async function NewInvoicePage() {
  await requireRole("owner", "staff");

  const recentStudents = await db
    .select({
      id: students.id,
      name: students.studentName,
      collected: students.collectedFromStudent,
    })
    .from(students)
    .orderBy(desc(students.admissionDate))
    .limit(100);

  const recentSalaries = await db
    .select({
      id: salaries.id,
      month: salaries.month,
      total: salaries.totalPayable,
      staffName: staff.name,
    })
    .from(salaries)
    .leftJoin(staff, eq(salaries.staffId, staff.id))
    .orderBy(desc(salaries.month))
    .limit(100);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/invoices"
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← Back
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New Invoice</h1>
      </div>

      <div className="grid gap-4">
        {/* From admission */}
        <form
          action={createInvoiceFromAdmission}
          className="bg-white border border-gray-200 rounded-xl p-5"
        >
          <h2 className="text-sm font-semibold text-gray-800 mb-1">
            Student fee receipt
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            Prefills the bill from a saved admission.
          </p>
          <div className="flex gap-3">
            <select
              name="studentId"
              required
              defaultValue=""
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Select an admission…
              </option>
              {recentStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {formatMoney(s.collected)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              Generate
            </button>
          </div>
        </form>

        {/* From salary */}
        <form
          action={createInvoiceFromSalary}
          className="bg-white border border-gray-200 rounded-xl p-5"
        >
          <h2 className="text-sm font-semibold text-gray-800 mb-1">
            Staff salary slip
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            Prefills base + incentive + bonus from a payroll row.
          </p>
          <div className="flex gap-3">
            <select
              name="salaryId"
              required
              defaultValue=""
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Select a payroll row…
              </option>
              {recentSalaries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.staffName} — {monthLabel(s.month)} —{" "}
                  {formatMoney(s.total)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              Generate
            </button>
          </div>
        </form>

        {/* Manual */}
        <form
          action={createManualInvoice}
          className="bg-white border border-gray-200 rounded-xl p-5"
        >
          <h2 className="text-sm font-semibold text-gray-800 mb-1">
            Manual invoice
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            Start blank and add your own line items.
          </p>
          <div className="flex gap-3">
            <input
              name="partyName"
              placeholder="Bill to (name) — optional"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
