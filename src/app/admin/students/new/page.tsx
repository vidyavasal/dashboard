import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import {
  getUniversityOptions,
  getCourseOptions,
  getStaffOptions,
  getCommissionDefaults,
} from "@/lib/lookups";
import { StudentForm } from "../StudentForm";

export default async function NewStudentPage() {
  const session = await requireSession();
  const [universityOptions, courses, staffOptions, commissionDefaults] =
    await Promise.all([
      getUniversityOptions(),
      getCourseOptions(),
      getStaffOptions(),
      getCommissionDefaults(),
    ]);

  return (
    <>
      <PageHeader
        title="Add admission"
        subtitle="Commission and profit auto-fill from the university — edit anything."
      />
      <StudentForm
        universityOptions={universityOptions}
        courses={courses}
        staffOptions={staffOptions}
        commissionDefaults={commissionDefaults}
        isOwner={session.role === "owner"}
      />
    </>
  );
}
