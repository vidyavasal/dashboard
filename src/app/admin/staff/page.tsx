import { asc } from "drizzle-orm";
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
import { DeleteButton } from "@/components/DeleteButton";
import { formatMoney, formatDate } from "@/lib/format";
import { deleteStaff } from "./actions";
import Link from "next/link";

export default async function StaffPage() {
  await requireRole("owner");
  const rows = await db.select().from(staff).orderBy(asc(staff.name));

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
              <div className="flex items-center justify-end gap-3">
                <Link
                  href={`/admin/staff/${r.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Edit
                </Link>
                <DeleteButton
                  id={r.id}
                  action={deleteStaff}
                  confirm={`Delete ${r.name}?`}
                />
              </div>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
