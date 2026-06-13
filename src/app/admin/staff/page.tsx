import { asc, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { staff } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import {
  PageHeader,
  ButtonLink,
  Table,
  Th,
  Td,
  StatusBadge,
} from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/format";
import { Pagination, parsePagination } from "@/components/Pagination";
import Link from "next/link";
import { encodeId } from "@/lib/ids";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("owner");
  const { page, pageSize } = parsePagination(await searchParams);
  const [rows, [{ n: totalRows }]] = await Promise.all([
    db
      .select()
      .from(staff)
      .orderBy(asc(staff.name))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ n: count() }).from(staff),
  ]);

  return (
    <>
      <PageHeader
        title="Staff"
        subtitle="Your team — sales executives, lead managers and more."
        action={<ButtonLink href="/admin/staff/new">+ Add staff</ButtonLink>}
      />
      <Table
        isEmpty={rows.length === 0}
        head={
          <>
            <Th>Name</Th>
            <Th>Role</Th>
            <Th align="right">Base salary</Th>
            <Th>Join date</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </>
        }
      >
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-surface/50">
            <Td className="font-medium">{r.name}</Td>
            <Td>{r.role ?? "—"}</Td>
            <Td align="right">
              {r.baseSalary ? formatMoney(r.baseSalary) : "—"}
            </Td>
            <Td>{formatDate(r.joinDate) || "—"}</Td>
            <Td>
              <StatusBadge status={r.status} />
            </Td>
            <Td align="right">
              <Link
                href={`/admin/staff/${encodeId(r.id)}`}
                className="text-sm text-primary hover:underline whitespace-nowrap"
              >
                View details
              </Link>
            </Td>
          </tr>
        ))}
      </Table>
      <Pagination
        basePath="/admin/staff"
        params={{}}
        page={page}
        pageSize={pageSize}
        total={totalRows}
      />
    </>
  );
}
