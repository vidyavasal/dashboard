import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { students, staff } from "@/lib/db/schema";
import { universities, courses as coursesTable } from "@/lib/db/external";
import { requireSession } from "@/lib/session";
import {
  getUniversityOptions,
  getCourseOptions,
  getStaffOptions,
  getCommissionDefaults,
  getStaffIdForUser,
} from "@/lib/lookups";
import { PageHeader, Card } from "@/components/ui";
import { CredentialVault } from "@/components/profiles/CredentialVault";
import { StudentDetails } from "./StudentDetails";
import { decodeId } from "@/lib/ids";

export const metadata = { title: "Admission details" };

export default async function StudentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id: idToken } = await params;
  const id = decodeId(idToken);
  if (!id) notFound();

  const [row] = await db
    .select({
      student: students,
      universityName: universities.name,
      courseName: coursesTable.name,
      execName: staff.name,
    })
    .from(students)
    .leftJoin(universities, eq(students.universityId, universities.id))
    .leftJoin(coursesTable, eq(students.courseId, coursesTable.id))
    .leftJoin(staff, eq(students.salesExecutiveId, staff.id))
    .where(eq(students.id, id))
    .limit(1);
  if (!row) notFound();
  const record = row.student;

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
      <PageHeader
        title={record.studentName}
        subtitle="Admission record (internal copy)."
      />
      <StudentDetails
        record={record}
        universityName={row.universityName}
        courseName={row.courseName}
        execName={row.execName}
        universityOptions={universityOptions}
        courses={courses}
        staffOptions={staffOptions}
        commissionDefaults={commissionDefaults}
        isOwner={session.role === "owner"}
      />

      <Card className="p-5 mt-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          University portal credentials
        </h2>
        <CredentialVault
          studentId={record.id}
          username={record.portalUsername}
          note={record.portalCredNote}
          hasPassword={!!record.portalPasswordEnc}
        />
      </Card>
    </>
  );
}
