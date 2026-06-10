import { requireSession } from "@/lib/session";
import {
  getUniversityOptions,
  getCourseOptions,
  getStaffOptions,
} from "@/lib/lookups";
import { PageHeader } from "@/components/ui";
import { LeadForm } from "../LeadForm";

export const metadata = { title: "Add lead" };

export default async function NewLeadPage() {
  await requireSession();
  const [universityOptions, courses, staffOptions] = await Promise.all([
    getUniversityOptions(),
    getCourseOptions(),
    getStaffOptions(),
  ]);

  return (
    <>
      <PageHeader
        title="Add lead"
        subtitle="Manual lead entry — only name and mobile are mandatory."
      />
      <LeadForm
        universityOptions={universityOptions}
        courses={courses}
        staffOptions={staffOptions}
      />
    </>
  );
}
