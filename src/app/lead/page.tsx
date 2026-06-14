import type { Metadata } from "next";
import { getUniversityOptions, getCourseOptions } from "@/lib/lookups";
import { LeadBasicFields } from "@/components/leads/LeadBasicFields";
import { PendingButton } from "@/components/PendingButton";
import { submitLead } from "./actions";

// PUBLIC page — this is the link shared with students who visit the site.
// Auth middleware only guards /admin/*, so no session is required here.

export const metadata: Metadata = {
  title: "Enquiry — Vidyavasal",
  description: "Tell us what you are looking for and we will call you back.",
};

export default async function LeadFormPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const submitted = sp.submitted === "1";

  const [universityOptions, courses] = await Promise.all([
    getUniversityOptions(),
    getCourseOptions(),
  ]);

  return (
    <main className="min-h-screen bg-surface flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            Admission Enquiry
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Share your basic details — our team will call or WhatsApp you.
          </p>
        </div>

        {submitted ? (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-lg font-semibold text-text-primary">
              Thank you! We received your enquiry.
            </h2>
            <p className="text-sm text-text-secondary mt-2">
              Our team will contact you shortly on the mobile number you
              shared.
            </p>
            <a
              href="/lead"
              className="inline-block mt-5 text-sm text-primary hover:underline"
            >
              Submit another enquiry
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8">
            <form action={submitLead} className="space-y-5">
              <LeadBasicFields
                universityOptions={universityOptions}
                courses={courses}
              />
              <p className="text-xs text-text-secondary">
                Only name and mobile are required — everything else is
                optional.
              </p>
              <PendingButton
                pendingText="Submitting…"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover text-white px-4 py-2.5 text-sm font-medium transition-colors"
              >
                Submit enquiry
              </PendingButton>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
