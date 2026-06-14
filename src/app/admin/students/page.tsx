import Link from "next/link";
import { requireSession } from "@/lib/session";
import {
  getStaffIdForUser,
  getUniversityOptions,
  getCourseOptions,
  getStaffOptions,
} from "@/lib/lookups";
import {
  parseStudentFilters,
  studentFilterParams,
  hasStudentFilters,
  queryStudents,
} from "@/lib/db/students-query";
import {
  PageHeader,
  ButtonLink,
  Table,
  Th,
  Td,
  StatusBadge,
  Card,
} from "@/components/ui";
import { StudentFilters } from "./StudentFilters";
import { Pagination, parsePagination } from "@/components/Pagination";
import { formatMoney, formatDate } from "@/lib/format";
import { encodeId } from "@/lib/ids";

export const metadata = { title: "Admissions" };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const filters = parseStudentFilters(sp);
  const { page, pageSize } = parsePagination(sp);

  // Sales execs see only their own admissions; owners/staff see all.
  let pinnedStaffId: string | null | undefined = undefined;
  if (session.role === "sales") {
    pinnedStaffId = await getStaffIdForUser(session.id);
  }

  const isOwner = session.role === "owner";

  const [{ rows, total }, universityOptions, courses, staffOptions] =
    await Promise.all([
      queryStudents(filters, page, pageSize, pinnedStaffId),
      getUniversityOptions(),
      getCourseOptions(),
      isOwner ? getStaffOptions() : Promise.resolve([]),
    ]);

  const params = studentFilterParams(filters);
  const exportQs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) exportQs.set(k, v);

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
          <div className="flex items-center gap-2">
            <ButtonLink
              href={`/admin/students/export?${exportQs.toString()}`}
              variant="ghost"
            >
              ⬇ Export Excel
            </ButtonLink>
            <ButtonLink href="/admin/students/new">+ Add admission</ButtonLink>
          </div>
        }
      />

      {session.role === "sales" && !pinnedStaffId && (
        <Card className="p-4 mb-4 bg-amber-50 border-amber-200 text-amber-800 text-sm">
          Your login isn&apos;t linked to a staff record yet, so no admissions
          are shown. Ask an owner to link your account under Staff.
        </Card>
      )}

      <StudentFilters
        filters={filters}
        universityOptions={universityOptions}
        courses={courses}
        staffOptions={staffOptions}
        isOwner={isOwner}
        hasActiveFilters={hasStudentFilters(filters)}
      />

      <Table
        isEmpty={rows.length === 0}
        empty="No admissions match these filters."
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
              <Link
                href={`/admin/students/${encodeId(r.id)}`}
                className="text-sm text-primary hover:underline whitespace-nowrap"
              >
                View details
              </Link>
            </Td>
          </tr>
        ))}
      </Table>

      <Pagination
        basePath="/admin/students"
        params={params}
        page={page}
        pageSize={pageSize}
        total={total}
      />
    </>
  );
}
