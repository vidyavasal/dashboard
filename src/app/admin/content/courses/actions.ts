"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, courseFeeStructures } from "@/lib/db/external";
import { requireRole } from "@/lib/session";
import { encodeId } from "@/lib/ids";

export interface CourseFormData {
  name: string;
  shortName: string;
  slug: string;
  courseType: string;
  deliveryMode: string;
  durationYears: string;
  totalSemesters: string;
  eligibility: string;
  description: string;
  content: string;
  bannerImage: string;
  isOnline: boolean;
  isDistance: boolean;
  feeStructure: {
    registrationFee: string;
    admissionFee: string;
    courseFee: string;
    examFee: string;
    yearlyFee: string;
    totalFee: string;
    emiAvailable: boolean;
  };
}

const empty = (v: string) => (v.trim() === "" ? null : v.trim());

export async function saveCourse(id: string, data: CourseFormData) {
  await requireRole("owner", "staff");

  await db
    .update(courses)
    .set({
      name: data.name.trim(),
      shortName: empty(data.shortName),
      slug: empty(data.slug),
      courseType: empty(data.courseType),
      deliveryMode: empty(data.deliveryMode),
      durationYears: empty(data.durationYears),
      totalSemesters: data.totalSemesters
        ? parseInt(data.totalSemesters, 10)
        : null,
      eligibility: empty(data.eligibility),
      description: empty(data.description),
      content: empty(data.content),
      bannerImage: empty(data.bannerImage),
      isOnline: data.isOnline,
      isDistance: data.isDistance,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, id));

  // Upsert the single fee structure row for this course.
  const f = data.feeStructure;
  const feeValues = {
    registrationFee: empty(f.registrationFee),
    admissionFee: empty(f.admissionFee),
    courseFee: empty(f.courseFee),
    examFee: empty(f.examFee),
    yearlyFee: empty(f.yearlyFee),
    totalFee: empty(f.totalFee),
    emiAvailable: f.emiAvailable,
  };
  const [existing] = await db
    .select({ id: courseFeeStructures.id })
    .from(courseFeeStructures)
    .where(eq(courseFeeStructures.courseId, id))
    .limit(1);
  if (existing) {
    await db
      .update(courseFeeStructures)
      .set(feeValues)
      .where(eq(courseFeeStructures.courseId, id));
  } else {
    await db
      .insert(courseFeeStructures)
      .values({ courseId: id, ...feeValues });
  }

  revalidatePath("/admin/content/courses");
  revalidatePath(`/admin/content/courses/${encodeId(id)}`);
}

export async function createCourse(formData: FormData) {
  await requireRole("owner", "staff");
  const universityId = String(formData.get("universityId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  if (!universityId) throw new Error("University is required");
  if (!name) throw new Error("Name is required");

  const slug =
    (slugRaw ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")) || null;

  const [created] = await db
    .insert(courses)
    .values({ universityId, name, slug })
    .returning({ id: courses.id });

  revalidatePath("/admin/content/courses");
  redirect(`/admin/content/courses/${encodeId(created.id)}`);
}

export async function deleteCourse(formData: FormData) {
  await requireRole("owner", "staff");
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing id");
  await db.delete(courses).where(eq(courses.id, id));
  revalidatePath("/admin/content/courses");
}
