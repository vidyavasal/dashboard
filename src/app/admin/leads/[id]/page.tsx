import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { trackerLeads, studentProfiles, staff } from "@/lib/db/schema";
import { universities, courses as coursesTable } from "@/lib/db/external";
import { requireSession } from "@/lib/session";
import {
  getUniversityOptions,
  getCourseOptions,
  getStaffOptions,
} from "@/lib/lookups";
import { Card, StatusBadge } from "@/components/ui";
import { PendingButton } from "@/components/PendingButton";
import { leadStatusLabel, leadSourceLabel } from "@/lib/lead-status";
import { formatDate } from "@/lib/format";
import { LeadDetails } from "./LeadDetails";
import { convertLead } from "../actions";
import { decodeId, encodeId } from "@/lib/ids";

export const metadata = { title: "Lead details" };

export default async function LeadDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id: idToken } = await params;
  const id = decodeId(idToken);
  if (!id) notFound();

  const [row] = await db
    .select({
      lead: trackerLeads,
      universityName: universities.name,
      courseName: coursesTable.name,
      assignedToName: staff.name,
      profileId: studentProfiles.id,
    })
    .from(trackerLeads)
    .leftJoin(universities, eq(trackerLeads.universityId, universities.id))
    .leftJoin(coursesTable, eq(trackerLeads.courseId, coursesTable.id))
    .leftJoin(staff, eq(trackerLeads.assignedToId, staff.id))
    .leftJoin(studentProfiles, eq(studentProfiles.leadId, trackerLeads.id))
    .where(eq(trackerLeads.id, id))
    .limit(1);
  if (!row) notFound();
  const record = row.lead;

  const [universityOptions, courses, staffOptions] = await Promise.all([
    getUniversityOptions(),
    getCourseOptions(),
    getStaffOptions(),
  ]);

  const initial = record.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <>
      {/* Summary header */}
      <Card className="p-5 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-primary-light text-primary grid place-items-center text-lg font-bold">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-text-primary truncate">
                  {record.name}
                </h1>
                <StatusBadge
                  status={record.status}
                  label={leadStatusLabel(record.status)}
                />
                {record.subStatus && (
                  <span className="text-xs text-text-secondary">
                    {record.subStatus}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-sm text-text-secondary">
                <span>📱 {record.phone}</span>
                {record.email && <span>✉️ {record.email}</span>}
                <span>
                  {leadSourceLabel(record.source)} ·{" "}
                  {record.createdAt ? formatDate(record.createdAt) : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {row.profileId ? (
              <Link
                href={`/admin/profiles/${encodeId(row.profileId)}`}
                className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                Open student profile →
              </Link>
            ) : (
              <form action={convertLead}>
                <input type="hidden" name="id" value={record.id} />
                <PendingButton variant="success" pendingText="Converting…">
                  ✓ Convert to student profile
                </PendingButton>
              </form>
            )}
          </div>
        </div>
        {row.profileId && (
          <p className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            This lead is converted. The student profile is a separate record —
            edits here do not change the profile.
          </p>
        )}
      </Card>

      <LeadDetails
        record={record}
        universityName={row.universityName}
        courseName={row.courseName}
        assignedToName={row.assignedToName}
        universityOptions={universityOptions}
        courses={courses}
        staffOptions={staffOptions}
      />
    </>
  );
}
