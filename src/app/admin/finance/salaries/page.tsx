import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { salaries, staff } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import {
  PageHeader,
  ButtonLink,
  Table,
  Th,
  Td,
  StatusBadge,
} from "@/components/ui";
import { DeleteButton } from "@/components/DeleteButton";
import { formatMoney, monthLabel } from "@/lib/format";
import { deleteSalary, togglePaid } from "./actions";

export default async function SalariesPage() {
  await requireRole("owner");

  const rows = await db
    .select({
      id: salaries.id,
      staffName: staff.name,
      month: salaries.month,
      baseSalary: salaries.baseSalary,
      incentive: salaries.incentive,
      bonus: salaries.bonus,
      totalPayable: salaries.totalPayable,
      paid: salaries.paid,
    })
    .from(salaries)
    .leftJoin(staff, eq(salaries.staffId, staff.id))
    .orderBy(desc(salaries.month));

  return (
    <>
      <PageHeader
        title="Salaries"
        subtitle="Monthly payroll — base + auto incentive + bonus."
        action={
          <ButtonLink href="/admin/finance/salaries/new">
            + Add payroll
          </ButtonLink>
        }
      />
      <Table
        isEmpty={rows.length === 0}
        head={
          <>
            <Th>Staff</Th>
            <Th>Month</Th>
            <Th align="right">Base</Th>
            <Th align="right">Incentive</Th>
            <Th align="right">Bonus</Th>
            <Th align="right">Total</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </>
        }
      >
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-surface/50">
            <Td className="font-medium">{r.staffName ?? "—"}</Td>
            <Td>{monthLabel(r.month)}</Td>
            <Td align="right">{formatMoney(r.baseSalary)}</Td>
            <Td align="right">{formatMoney(r.incentive)}</Td>
            <Td align="right">{formatMoney(r.bonus)}</Td>
            <Td align="right" className="font-semibold">
              {formatMoney(r.totalPayable)}
            </Td>
            <Td>
              <form action={togglePaid}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="paid" value={r.paid ? "0" : "1"} />
                <button type="submit" className="cursor-pointer">
                  <StatusBadge status={r.paid ? "paid" : "pending"} />
                </button>
              </form>
            </Td>
            <Td align="right">
              <div className="flex items-center justify-end gap-3">
                <Link
                  href={`/admin/finance/salaries/${r.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Edit
                </Link>
                <DeleteButton
                  id={r.id}
                  action={deleteSalary}
                  confirm={`Delete payroll for ${r.staffName} (${r.month})?`}
                />
              </div>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
