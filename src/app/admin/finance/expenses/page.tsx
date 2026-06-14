import { count, desc, sum } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { PageHeader, ButtonLink, Table, Th, Td } from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/format";
import { Pagination, parsePagination } from "@/components/Pagination";
import { encodeId } from "@/lib/ids";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("owner");
  const { page, pageSize } = parsePagination(await searchParams);

  const [rows, [agg]] = await Promise.all([
    db
      .select()
      .from(expenses)
      .orderBy(desc(expenses.expenseDate))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ n: count(), sum: sum(expenses.amount) }).from(expenses),
  ]);
  const totalRows = agg.n;
  const total = Number(agg.sum ?? 0);

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle={`${totalRows} entries · ${formatMoney(total)} total`}
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
                  href={`/admin/finance/expenses/${encodeId(r.id)}`}
                  className="text-sm text-primary hover:underline"
                >
                  Edit
                </Link>
              </div>
            </Td>
          </tr>
        ))}
      </Table>
      <Pagination
        basePath="/admin/finance/expenses"
        params={{}}
        page={page}
        pageSize={pageSize}
        total={totalRows}
      />
    </>
  );
}
