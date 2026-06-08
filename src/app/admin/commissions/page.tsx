import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { universityCommissions } from "@/lib/db/schema";
import { universities } from "@/lib/db/shared";
import { requireRole } from "@/lib/session";
import { PageHeader, ButtonLink, Table, Th, Td } from "@/components/ui";
import { DeleteButton } from "@/components/DeleteButton";
import { formatMoney } from "@/lib/format";
import { deleteCommission } from "./actions";

export default async function CommissionsPage() {
  await requireRole("owner");

  const rows = await db
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
    .orderBy(asc(universities.name));

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
              <div className="flex items-center justify-end gap-3">
                <Link
                  href={`/admin/commissions/${r.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Edit
                </Link>
                <DeleteButton
                  id={r.id}
                  action={deleteCommission}
                  confirm={`Remove commission for ${r.universityName}?`}
                />
              </div>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
