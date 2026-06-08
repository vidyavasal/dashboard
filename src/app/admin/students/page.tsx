import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { students, staff } from "@/lib/db/schema";
import { universities, courses } from "@/lib/db/shared";
import { requireSession } from "@/lib/session";
import { getStaffIdForUser } from "@/lib/lookups";
import {
  PageHeader,
  ButtonLink,
  Table,
  Th,
  Td,
  StatusBadge,
  Card,
} from "@/components/ui";
import { DeleteButton } from "@/components/DeleteButton";
import { formatMoney, formatDate } from "@/lib/format";
import { deleteStudent } from "./actions";

export default async function StudentsPage() {
  const session = await requireSession();

  // Sales execs see only their own admissions; owners see all.
  let ownStaffId: string | null = null;
  if (session.role === "sales") {
    ownStaffId = await getStaffIdForUser(session.id);
  }

  const base = db
    .select({
      id: students.id,
      admissionDate: students.admissionDate,
      studentName: students.studentName,
      universityName: universities.name,
      courseName: courses.name,
      collected: students.collectedFromStudent,
      iodeProfit: students.iodeProfit,
      incentive: students.incentive,
      execName: staff.name,
      paymentStatus: students.paymentStatus,
    })
    .from(students)
    .leftJoin(universities, eq(students.universityId, universities.id))
    .leftJoin(courses, eq(students.courseId, courses.id))
    .leftJoin(staff, eq(students.salesExecutiveId, staff.id))
    .orderBy(desc(students.admissionDate));

  const rows =
    session.role === "sales"
      ? await base.where(
          eq(students.salesExecutiveId, ownStaffId ?? "00000000-0000-0000-0000-000000000000")
        )
      : await base;

  const isOwner = session.role === "owner";

  return (
    <>
      <PageHeader
        title="Admissions"
        subtitle={
          isOwner
            ? "All student admissions."
            : "Your admissions. Profit/finance columns are owner-only."
        }
        action={
          <ButtonLink href="/admin/students/new">+ Add admission</ButtonLink>
        }
      />

      {session.role === "sales" && !ownStaffId && (
        <Card className="p-4 mb-4 bg-amber-50 border-amber-200 text-amber-800 text-sm">
          Your login isn&apos;t linked to a staff record yet, so no admissions
          are shown. Ask an owner to link your account under Staff.
        </Card>
      )}

      <Table
        isEmpty={rows.length === 0}
        head={
          <>
            <Th>Date</Th>
            <Th>Student</Th>
            <Th>University</Th>
            <Th>Course</Th>
            <Th align="right">Collected</Th>
            {isOwner && <Th align="right">IODE profit</Th>}
            <Th align="right">Incentive</Th>
            {isOwner && <Th>Exec</Th>}
            <Th>Payment</Th>
            <Th align="right">Actions</Th>
          </>
        }
      >
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-surface/50">
            <Td>{formatDate(r.admissionDate) || "—"}</Td>
            <Td className="font-medium">{r.studentName}</Td>
            <Td>{r.universityName ?? "—"}</Td>
            <Td>{r.courseName ?? "—"}</Td>
            <Td align="right">{formatMoney(r.collected)}</Td>
            {isOwner && <Td align="right">{formatMoney(r.iodeProfit)}</Td>}
            <Td align="right">{formatMoney(r.incentive)}</Td>
            {isOwner && <Td>{r.execName ?? "—"}</Td>}
            <Td>
              <StatusBadge status={r.paymentStatus} />
            </Td>
            <Td align="right">
              <div className="flex items-center justify-end gap-3">
                <Link
                  href={`/admin/students/${r.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Edit
                </Link>
                <DeleteButton
                  id={r.id}
                  action={deleteStudent}
                  confirm={`Delete admission for ${r.studentName}?`}
                />
              </div>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
