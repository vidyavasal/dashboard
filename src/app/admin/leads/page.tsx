import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getUniversityOptions, getCourseOptions } from "@/lib/lookups";
import {
  parseLeadFilters,
  leadFilterParams,
  hasLeadFilters,
  queryLeads,
  leadStatusCounts,
} from "@/lib/db/leads-query";
import { leadStatusLabel, programLevelLabel } from "@/lib/lead-status";
import {
  PageHeader,
  ButtonLink,
  Table,
  Th,
  Td,
  StatusBadge,
} from "@/components/ui";
import { Pagination, parsePagination } from "@/components/Pagination";
import { DeleteButton } from "@/components/DeleteButton";
import { formatDate } from "@/lib/format";
import { deleteLead, convertLead } from "./actions";
import { LeadFilters } from "./LeadFilters";

export const metadata = { title: "Leads" };

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const filters = parseLeadFilters(sp);
  const { page, pageSize } = parsePagination(sp);

  const [{ rows, total }, counts, universityOptions, courses] =
    await Promise.all([
      queryLeads(filters, page, pageSize),
      leadStatusCounts(filters),
      getUniversityOptions(),
      getCourseOptions(),
    ]);

  const params = leadFilterParams(filters);
  const canDelete = session.role !== "sales";

  const exportQs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) exportQs.set(k, v);

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle="Every enquiry from the public lead form, manual entry or CSV import. Convert a lead to open its student profile."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink href="/admin/leads/import" variant="ghost">
              Import CSV
            </ButtonLink>
            <ButtonLink
              href={`/admin/leads/export?${exportQs.toString()}`}
              variant="ghost"
            >
              ⬇ Export Excel
            </ButtonLink>
            <ButtonLink href="/admin/leads/new">+ Add lead</ButtonLink>
          </div>
        }
      />

      <LeadFilters
        filters={filters}
        counts={counts}
        universityOptions={universityOptions}
        courses={courses}
        hasActiveFilters={hasLeadFilters(filters)}
      />

      <Table
        isEmpty={rows.length === 0}
        empty="No leads match these filters."
        head={
          <>
            <Th>Created</Th>
            <Th>Name</Th>
            <Th>Mobile</Th>
            <Th>University</Th>
            <Th>Course</Th>
            <Th>Looking for</Th>
            <Th>Status</Th>
            <Th>Further status</Th>
            <Th>Assigned</Th>
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
              <StatusBadge status={r.status} label={leadStatusLabel(r.status)} />
            </Td>
            <Td className="max-w-36 truncate" title={r.subStatus ?? ""}>
              {r.subStatus ?? "—"}
            </Td>
            <Td>{r.assignedToName ?? "—"}</Td>
            <Td align="right">
              <div className="flex items-center justify-end gap-3">
                {r.convertedProfileId ? (
                  <Link
                    href={`/admin/profiles/${r.convertedProfileId}`}
                    className="text-sm text-green-700 hover:underline whitespace-nowrap"
                  >
                    Profile →
                  </Link>
                ) : (
                  <form action={convertLead}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="text-sm text-green-700 hover:underline"
                    >
                      Convert
                    </button>
                  </form>
                )}
                <Link
                  href={`/admin/leads/${r.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Edit
                </Link>
                {canDelete && (
                  <DeleteButton
                    id={r.id}
                    action={deleteLead}
                    confirm={`Delete lead ${r.name}?`}
                  />
                )}
              </div>
            </Td>
          </tr>
        ))}
      </Table>

      <Pagination
        basePath="/admin/leads"
        params={params}
        page={page}
        pageSize={pageSize}
        total={total}
      />
    </>
  );
}
