import { asc, count, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { universityCommissions } from "@/lib/db/schema";
import { universities } from "@/lib/db/external";
import { requireRole } from "@/lib/session";
import { PageHeader, ButtonLink, Table, Th, Td } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { Pagination, parsePagination } from "@/components/Pagination";
import { encodeId } from "@/lib/ids";

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("owner");
  const { page, pageSize } = parsePagination(await searchParams);

  const [rows, [{ n: totalRows }]] = await Promise.all([
    db
      .select({
        id: universityCommissions.id,
        universityName: universities.name,
        commissionPercent: universityCommissions.commissionPercent,
        incentive: universityCommissions.incentivePerAdmission,
      })
      .from(universityCommissions)
      .leftJoin(
        universities,
        eq(universityCommissions.universityId, universities.id)
      )
      .orderBy(asc(universities.name))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ n: count() }).from(universityCommissions),
  ]);

  return (
    <>
      <PageHeader
        title="University Commissions"
        subtitle="Default commission % and incentive applied per admission."
        action={
          <ButtonLink href="/admin/commissions/new">+ Add / update</ButtonLink>
        }
      />
      <Table
        isEmpty={rows.length === 0}
        head={
          <>
            <Th>University</Th>
            <Th align="right">Commission %</Th>
            <Th align="right">Incentive / admission</Th>
            <Th align="right">Actions</Th>
          </>
        }
      >
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-surface/50">
            <Td className="font-medium">{r.universityName ?? "—"}</Td>
            <Td align="right">
              {r.commissionPercent ? `${r.commissionPercent}%` : "—"}
            </Td>
            <Td align="right">
              {r.incentive ? formatMoney(r.incentive) : "—"}
            </Td>
            <Td align="right">
              <Link
                href={`/admin/commissions/${encodeId(r.id)}`}
                className="text-sm text-primary hover:underline whitespace-nowrap"
              >
                View details
              </Link>
            </Td>
          </tr>
        ))}
      </Table>
      <Pagination
        basePath="/admin/commissions"
        params={{}}
        page={page}
        pageSize={pageSize}
        total={totalRows}
      />
    </>
  );
}
