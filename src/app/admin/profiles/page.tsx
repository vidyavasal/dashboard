import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getUniversityOptions, getCourseOptions } from "@/lib/lookups";
import {
  parseProfileFilters,
  profileFilterParams,
  hasProfileFilters,
  queryProfiles,
  profileStatusCounts,
} from "@/lib/db/profiles-query";
import { profileStatusLabel, programLevelLabel } from "@/lib/lead-status";
import {
  PageHeader,
  ButtonLink,
  Table,
  Th,
  Td,
  StatusBadge,
} from "@/components/ui";
import { Pagination, parsePagination } from "@/components/Pagination";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { formatDate } from "@/lib/format";
import { ProfileFilters } from "./ProfileFilters";
import { encodeId } from "@/lib/ids";

export const metadata = { title: "Student profiles" };

export default async function ProfilesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireSession();
  const sp = await searchParams;
  const filters = parseProfileFilters(sp);
  const { page, pageSize } = parsePagination(sp);

  const [{ rows, total }, counts, universityOptions, courses] =
    await Promise.all([
      queryProfiles(filters, page, pageSize),
      profileStatusCounts(),
      getUniversityOptions(),
      getCourseOptions(),
    ]);

  const params = profileFilterParams(filters);

  const exportQs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) exportQs.set(k, v);

  return (
    <>
      <PageHeader
        title="Student profiles"
        subtitle="Converted leads. Share each profile's dynamic link with the student to fill their data, or edit it here. Mark admitted to copy into Admissions."
        action={
          <ButtonLink
            href={`/admin/profiles/export?${exportQs.toString()}`}
            variant="ghost"
          >
            ⬇ Export Excel
          </ButtonLink>
        }
      />

      <ProfileFilters
        filters={filters}
        counts={counts}
        universityOptions={universityOptions}
        courses={courses}
        hasActiveFilters={hasProfileFilters(filters)}
      />

      <Table
        isEmpty={rows.length === 0}
        empty="No student profiles match these filters."
        head={
          <>
            <Th>Created</Th>
            <Th>Name</Th>
            <Th>Mobile</Th>
            <Th>University</Th>
            <Th>Course</Th>
            <Th>Looking for</Th>
            <Th>Status</Th>
            <Th>Admitted on</Th>
            <Th align="right">Actions</Th>
          </>
        }
      >
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-surface/50">
            <Td className="whitespace-nowrap">
              {r.createdAt ? formatDate(r.createdAt) : "—"}
            </Td>
            <Td className="font-medium">{r.name}</Td>
            <Td className="whitespace-nowrap">{r.phone}</Td>
            <Td className="max-w-44 truncate" title={r.universityName ?? ""}>
              {r.universityName ?? "—"}
            </Td>
            <Td className="max-w-44 truncate" title={r.courseName ?? ""}>
              {r.courseName ?? "—"}
            </Td>
            <Td>{r.programLevel ? programLevelLabel(r.programLevel) : "—"}</Td>
            <Td>
              <StatusBadge
                status={r.status}
                label={profileStatusLabel(r.status)}
              />
            </Td>
            <Td className="whitespace-nowrap">
              {formatDate(r.admissionDate) || "—"}
            </Td>
            <Td align="right">
              <div className="flex items-center justify-end gap-3">
                <CopyLinkButton path={`/profile/${r.formToken}`} />
                {r.admittedStudentId && (
                  <Link
                    href={`/admin/students/${encodeId(r.admittedStudentId)}`}
                    className="text-sm text-green-700 hover:underline whitespace-nowrap"
                  >
                    Admission →
                  </Link>
                )}
                <Link
                  href={`/admin/profiles/${encodeId(r.id)}`}
                  className="text-sm text-primary hover:underline whitespace-nowrap"
                >
                  View details
                </Link>
              </div>
            </Td>
          </tr>
        ))}
      </Table>

      <Pagination
        basePath="/admin/profiles"
        params={params}
        page={page}
        pageSize={pageSize}
        total={total}
      />
    </>
  );
}
