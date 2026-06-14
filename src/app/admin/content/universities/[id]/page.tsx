import { notFound } from "next/navigation";
import { eq, asc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { universities, courses, courseFeeStructures } from "@/lib/db/external";
import { requireRole } from "@/lib/session";
import UniversityEditForm from "./UniversityEditForm";
import { decodeId } from "@/lib/ids";

export default async function EditUniversityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("owner", "staff");
  const { id: idToken } = await params;
  const id = decodeId(idToken);
  if (!id) notFound();

  const [uni] = await db
    .select()
    .from(universities)
    .where(eq(universities.id, id))
    .limit(1);
  if (!uni) notFound();

  const uniCourses = await db
    .select({
      id: courses.id,
      name: courses.name,
      slug: courses.slug,
      courseType: courses.courseType,
      deliveryMode: courses.deliveryMode,
      totalFee: sql<string>`(SELECT total_fee FROM ${courseFeeStructures} WHERE course_id = ${courses.id} LIMIT 1)`,
    })
    .from(courses)
    .where(eq(courses.universityId, id))
    .orderBy(asc(courses.name));

  return <UniversityEditForm university={uni} courses={uniCourses} />;
}
