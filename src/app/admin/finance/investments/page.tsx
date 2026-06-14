import { count, desc, sum } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { investments } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { PageHeader, ButtonLink, Table, Th, Td } from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/format";
import { Pagination, parsePagination } from "@/components/Pagination";
import { encodeId } from "@/lib/ids";

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("owner");
  const { page, pageSize } = parsePagination(await searchParams);

  const [rows, [agg]] = await Promise.all([
    db
      .select()
      .from(investments)
      .orderBy(desc(investments.investmentDate))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ n: count(), sum: sum(investments.amount) }).from(investments),
  ]);
  const totalRows = agg.n;
  const total = Number(agg.sum ?? 0);

  return (
    <>
      <PageHeader
        title="Investments"
        subtitle={`${totalRows} entries · ${formatMoney(total)} total`}
        action={
          <ButtonLink href="/admin/finance/investments/new">
            + Add investment
          </ButtonLink>
        }
      />
      <Table
        isEmpty={rows.length === 0}
        head={
          <>
            <Th>Date</Th>
            <Th>Partner</Th>
            <Th align="right">Amount</Th>
            <Th>Note</Th>
            <Th align="right">Actions</Th>
          </>
        }
      >
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-surface/50">
            <Td>{formatDate(r.investmentDate) || "—"}</Td>
            <Td className="font-medium">{r.partner ?? "—"}</Td>
            <Td align="right">{formatMoney(r.amount)}</Td>
            <Td>{r.note ?? "—"}</Td>
            <Td align="right">
              <div className="flex items-center justify-end gap-3">
                <Link
                  href={`/admin/finance/investments/${encodeId(r.id)}`}
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
        basePath="/admin/finance/investments"
        params={{}}
        page={page}
        pageSize={pageSize}
        total={totalRows}
      />
    </>
  );
}
