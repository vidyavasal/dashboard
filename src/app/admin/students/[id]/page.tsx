import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import {
  getUniversityOptions,
  getCourseOptions,
  getStaffOptions,
  getCommissionDefaults,
  getStaffIdForUser,
} from "@/lib/lookups";
import { PageHeader } from "@/components/ui";
import { StudentForm } from "../StudentForm";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const [record] = await db
    .select()
    .from(students)
    .where(eq(students.id, id))
    .limit(1);
  if (!record) notFound();

  // Sales execs may only open their own admissions.
  if (session.role === "sales") {
    const ownStaffId = await getStaffIdForUser(session.id);
    if (!ownStaffId || record.salesExecutiveId !== ownStaffId) {
      redirect("/admin/students?error=forbidden");
    }
  }

  const [universityOptions, courses, staffOptions, commissionDefaults] =
    await Promise.all([
      getUniversityOptions(),
      getCourseOptions(),
      getStaffOptions(),
      getCommissionDefaults(),
    ]);

  return (
    <>
      <PageHeader title="Edit admission" subtitle={record.studentName} />
      <StudentForm
        record={record}
        universityOptions={universityOptions}
        courses={courses}
        staffOptions={staffOptions}
        commissionDefaults={commissionDefaults}
        isOwner={session.role === "owner"}
      />
    </>
  );
}
