import { desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { PageHeader, ButtonLink, Table, Th, Td } from "@/components/ui";
import { DeleteButton } from "@/components/DeleteButton";
import { formatMoney, formatDate } from "@/lib/format";
import { deleteExpense } from "./actions";

export default async function ExpensesPage() {
  await requireRole("owner");
  const rows = await db
    .select()
    .from(expenses)
    .orderBy(desc(expenses.expenseDate));

  const total = rows.reduce((s, r) => s + Number(r.amount ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle={`${rows.length} entries · ${formatMoney(total)} total`}
        action={
          <ButtonLink href="/admin/finance/expenses/new">
            + Add expense
          </ButtonLink>
        }
      />
      <Table
        isEmpty={rows.length === 0}
        head={
          <>
            <Th>Date</Th>
            <Th>Category</Th>
            <Th>Description</Th>
            <Th align="right">Amount</Th>
            <Th>Paid by</Th>
            <Th align="right">Actions</Th>
          </>
        }
      >
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-surface/50">
            <Td>{formatDate(r.expenseDate) || "—"}</Td>
            <Td>{r.category ?? "—"}</Td>
            <Td>{r.description ?? "—"}</Td>
            <Td align="right">{formatMoney(r.amount)}</Td>
            <Td>{r.paidBy ?? "—"}</Td>
            <Td align="right">
              <div className="flex items-center justify-end gap-3">
                <Link
                  href={`/admin/finance/expenses/${r.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Edit
                </Link>
                <DeleteButton
                  id={r.id}
                  action={deleteExpense}
                  confirm="Delete this expense?"
                />
              </div>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
