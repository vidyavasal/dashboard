import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, courseFeeStructures, universities } from "@/lib/db/external";
import { requireRole } from "@/lib/session";
import CourseEditForm from "./CourseEditForm";
import { decodeId } from "@/lib/ids";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("owner", "staff");
  const { id: idToken } = await params;
  const id = decodeId(idToken);
  if (!id) notFound();

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);
  if (!course) notFound();

  const [fee] = await db
    .select()
    .from(courseFeeStructures)
    .where(eq(courseFeeStructures.courseId, id))
    .limit(1);

  const [uni] = course.universityId
    ? await db
        .select({ name: universities.name })
        .from(universities)
        .where(eq(universities.id, course.universityId))
        .limit(1)
    : [{ name: null as string | null }];

  return (
    <CourseEditForm
      course={{
        ...course,
        feeStructure: fee ?? null,
        universityName: uni?.name ?? null,
      }}
    />
  );
}
