import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { trackerLeads, studentProfiles } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import {
  getUniversityOptions,
  getCourseOptions,
  getStaffOptions,
} from "@/lib/lookups";
import { PageHeader, Card } from "@/components/ui";
import { leadSourceLabel } from "@/lib/lead-status";
import { LeadForm } from "../LeadForm";
import { convertLead } from "../actions";

export const metadata = { title: "Edit lead" };

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;

  const [record] = await db
    .select()
    .from(trackerLeads)
    .where(eq(trackerLeads.id, id))
    .limit(1);
  if (!record) notFound();

  const [[profile], universityOptions, courses, staffOptions] =
    await Promise.all([
      db
        .select({ id: studentProfiles.id })
        .from(studentProfiles)
        .where(eq(studentProfiles.leadId, id))
        .limit(1),
      getUniversityOptions(),
      getCourseOptions(),
      getStaffOptions(),
    ]);

  return (
    <>
      <PageHeader
        title="Edit lead"
        subtitle={`Source: ${leadSourceLabel(record.source)}`}
        action={
          profile ? (
            <Link
              href={`/admin/profiles/${profile.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
            >
              Open student profile →
            </Link>
          ) : (
            <form action={convertLead}>
              <input type="hidden" name="id" value={record.id} />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                ✓ Convert to student profile
              </button>
            </form>
          )
        }
      />

      {profile && (
        <Card className="p-4 mb-4 bg-green-50 border-green-200 text-green-800 text-sm">
          This lead is converted. The student profile is a separate record —
          edits here do not change the profile.
        </Card>
      )}

      <LeadForm
        record={record}
        universityOptions={universityOptions}
        courses={courses}
        staffOptions={staffOptions}
      />
    </>
  );
}
