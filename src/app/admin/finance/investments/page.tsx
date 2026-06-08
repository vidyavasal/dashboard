import { desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { investments } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { PageHeader, ButtonLink, Table, Th, Td } from "@/components/ui";
import { DeleteButton } from "@/components/DeleteButton";
import { formatMoney, formatDate } from "@/lib/format";
import { deleteInvestment } from "./actions";

export default async function InvestmentsPage() {
  await requireRole("owner");
  const rows = await db
    .select()
    .from(investments)
    .orderBy(desc(investments.investmentDate));

  const total = rows.reduce((s, r) => s + Number(r.amount ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Investments"
        subtitle={`${rows.length} entries · ${formatMoney(total)} total`}
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
                  href={`/admin/finance/investments/${r.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Edit
                </Link>
                <DeleteButton
                  id={r.id}
                  action={deleteInvestment}
                  confirm="Delete this investment?"
                />
              </div>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
