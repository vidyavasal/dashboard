import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { students, salaries, staff } from "@/lib/db/schema";
import { universities } from "@/lib/db/external";
import { requireRole } from "@/lib/session";
import { PageHeader, Card } from "@/components/ui";
import { SearchSelect } from "@/components/SearchSelect";
import { PendingButton } from "@/components/PendingButton";
import { monthLabel, formatMoney, formatDate } from "@/lib/format";
import {
  createManualInvoice,
  createInvoiceFromAdmission,
  createInvoiceFromSalary,
} from "../actions";

export const metadata = { title: "New invoice" };

export default async function NewInvoicePage() {
  await requireRole("owner", "staff");

  // Searchable pickers handle long lists, so fetch generously.
  const [admissions, payrolls] = await Promise.all([
    db
      .select({
        id: students.id,
        name: students.studentName,
        phone: students.phone,
        admissionDate: students.admissionDate,
        collected: students.collectedFromStudent,
        universityName: universities.name,
      })
      .from(students)
      .leftJoin(universities, eq(students.universityId, universities.id))
      .orderBy(desc(students.admissionDate))
      .limit(2000),
    db
      .select({
        id: salaries.id,
        month: salaries.month,
        total: salaries.totalPayable,
        staffName: staff.name,
      })
      .from(salaries)
      .leftJoin(staff, eq(salaries.staffId, staff.id))
      .orderBy(desc(salaries.month))
      .limit(2000),
  ]);

  const admissionOptions = admissions.map((s) => ({
    value: s.id,
    label: [
      s.name,
      s.phone,
      s.universityName,
      s.admissionDate ? formatDate(s.admissionDate) : null,
      formatMoney(s.collected),
    ]
      .filter(Boolean)
      .join(" · "),
  }));

  const payrollOptions = payrolls.map((s) => ({
    value: s.id,
    label: `${s.staffName ?? "—"} · ${monthLabel(s.month)} · ${formatMoney(s.total)}`,
  }));

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="New invoice"
        subtitle="Generate from an admission or payroll row, or start a manual bill."
      />

      <div className="grid gap-4">
        {/* From admission */}
        <Card className="p-5">
          <form action={createInvoiceFromAdmission}>
            <h2 className="text-sm font-semibold text-text-primary mb-1">
              Student fee receipt
            </h2>
            <p className="text-xs text-text-secondary mb-3">
              Search by student name, mobile or university — prefills the bill
              from the saved admission.
            </p>
            <div className="flex gap-3 items-start">
              <SearchSelect
                name="studentId"
                required
                options={admissionOptions}
                placeholder="Search admissions…"
              />
              <PendingButton pendingText="Generating…">Generate</PendingButton>
            </div>
          </form>
        </Card>

        {/* From salary */}
        <Card className="p-5">
          <form action={createInvoiceFromSalary}>
            <h2 className="text-sm font-semibold text-text-primary mb-1">
              Staff salary slip
            </h2>
            <p className="text-xs text-text-secondary mb-3">
              Search by staff name or month — prefills base + incentive + bonus
              from the payroll row.
            </p>
            <div className="flex gap-3 items-start">
              <SearchSelect
                name="salaryId"
                required
                options={payrollOptions}
                placeholder="Search payroll rows…"
              />
              <PendingButton pendingText="Generating…">Generate</PendingButton>
            </div>
          </form>
        </Card>

        {/* Manual */}
        <Card className="p-5">
          <form action={createManualInvoice}>
            <h2 className="text-sm font-semibold text-text-primary mb-1">
              Manual invoice
            </h2>
            <p className="text-xs text-text-secondary mb-3">
              Start blank and add your own line items.
            </p>
            <div className="flex gap-3">
              <input
                name="partyName"
                placeholder="Bill to (name) — optional"
                className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <PendingButton pendingText="Creating…">Create</PendingButton>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
