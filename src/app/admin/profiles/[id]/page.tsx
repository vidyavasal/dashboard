import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { studentProfiles, trackerLeads } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import {
  getUniversityOptions,
  getCourseOptions,
  getStaffOptions,
} from "@/lib/lookups";
import { Card, StatusBadge } from "@/components/ui";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { profileStatusLabel } from "@/lib/lead-status";
import { formatDate } from "@/lib/format";
import { ProfileForm } from "../ProfileForm";
import { markAdmitted, regenerateLink } from "../actions";

export const metadata = { title: "Student profile" };

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;

  const [record] = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.id, id))
    .limit(1);
  if (!record) notFound();

  const [lead] = record.leadId
    ? await db
        .select({ id: trackerLeads.id, name: trackerLeads.name })
        .from(trackerLeads)
        .where(eq(trackerLeads.id, record.leadId))
        .limit(1)
    : [undefined];

  const [universityOptions, courses, staffOptions] = await Promise.all([
    getUniversityOptions(),
    getCourseOptions(),
    getStaffOptions(),
  ]);

  const profilePath = `/profile/${record.formToken}`;
  const initial = record.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <>
      <div className="mb-4">
        <Link
          href="/admin/profiles"
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          ← Student profiles
        </Link>
      </div>

      {/* Summary card */}
      <Card className="p-5 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
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
                  label={profileStatusLabel(record.status)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-sm text-text-secondary">
                <span>📱 {record.phone}</span>
                {record.email && <span>✉️ {record.email}</span>}
                {record.profileSubmittedAt && (
                  <span>
                    Student submitted: {formatDate(record.profileSubmittedAt)}
                  </span>
                )}
                {record.admissionDate && (
                  <span className="text-green-700 font-medium">
                    Admitted: {formatDate(record.admissionDate)}
                  </span>
                )}
                {lead && (
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    className="text-primary hover:underline"
                  >
                    View original lead →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {record.admittedStudentId ? (
            <Link
              href={`/admin/students/${record.admittedStudentId}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
            >
              Open admission →
            </Link>
          ) : (
            <form action={markAdmitted} className="flex items-end gap-2">
              <input type="hidden" name="id" value={record.id} />
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-1">
                  Admission date
                </span>
                <input
                  type="date"
                  name="admissionDate"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="h-9 px-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <button
                type="submit"
                className="h-9 inline-flex items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                🎓 Mark admitted
              </button>
            </form>
          )}
        </div>

        {/* Dynamic student link */}
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-surface/80 border border-border px-3.5 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            Student link
          </span>
          <code className="text-xs text-text-secondary truncate max-w-full sm:max-w-96">
            {profilePath}
          </code>
          <div className="flex items-center gap-3 ml-auto">
            <CopyLinkButton path={profilePath} label="Copy link" />
            <form action={regenerateLink}>
              <input type="hidden" name="id" value={record.id} />
              <button
                type="submit"
                className="text-sm text-text-secondary hover:text-text-primary"
                title="Old link stops working"
              >
                Regenerate
              </button>
            </form>
          </div>
        </div>
      </Card>

      <ProfileForm
        record={record}
        universityOptions={universityOptions}
        courses={courses}
        staffOptions={staffOptions}
      />
    </>
  );
}
