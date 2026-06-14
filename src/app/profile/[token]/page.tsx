import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { studentProfiles } from "@/lib/db/schema";
import { getUniversityOptions, getCourseOptions } from "@/lib/lookups";
import { ProfileFields } from "@/components/profiles/ProfileFields";
import { PendingButton } from "@/components/PendingButton";
import { submitProfile } from "./actions";

// PUBLIC page — the per-student dynamic link shared after a lead converts.
// The unguessable token in the URL is the only credential needed.

export const metadata: Metadata = {
  title: "Complete your admission profile — Vidyavasal",
  robots: { index: false, follow: false },
};

// Editable from the link ONLY while pending. After the student submits, the
// link becomes view-only (staff take over from the admin panel).
const STUDENT_EDITABLE_STATUSES = ["profile_pending"];

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const submitted = sp.submitted === "1";

  const [profile] = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.formToken, token))
    .limit(1);
  if (!profile) notFound();

  const editable = STUDENT_EDITABLE_STATUSES.includes(profile.status ?? "");

  const [universityOptions, courses] = await Promise.all([
    getUniversityOptions(),
    getCourseOptions(),
  ]);

  return (
    <main className="min-h-screen bg-surface flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            Admission profile
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Hi {profile.name} — please complete your details below. Our team
            will use this for your admission.
          </p>
        </div>

        {submitted && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-4 mb-4 text-sm text-center">
            ✅ Profile submitted successfully! Our team will take it from here.
          </div>
        )}

        {editable ? (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8">
            <form action={submitProfile} className="space-y-5">
              <input type="hidden" name="token" value={token} />
              <ProfileFields
                record={profile}
                universityOptions={universityOptions}
                courses={courses}
              />
              <PendingButton
                pendingText="Saving…"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover text-white px-4 py-2.5 text-sm font-medium transition-colors"
              >
                Save my profile
              </PendingButton>
            </form>
          </div>
        ) : profile.status === "admitted" ? (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
            <div className="text-4xl mb-3">🎓</div>
            <h2 className="text-lg font-semibold text-text-primary">
              Your admission is confirmed!
            </h2>
            <p className="text-sm text-text-secondary mt-2">
              Congratulations. If anything needs updating, please contact our
              team.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-3 mb-5 text-sm text-center">
              ✅ Your profile has been submitted and is under review. You can
              view your details below, but they can no longer be edited from
              this link. Please contact our team for any changes.
            </div>
            {/* Read-only: a disabled fieldset locks every control inside. */}
            <fieldset disabled className="space-y-5 opacity-90">
              <ProfileFields
                record={profile}
                universityOptions={universityOptions}
                courses={courses}
              />
            </fieldset>
          </div>
        )}
      </div>
    </main>
  );
}
