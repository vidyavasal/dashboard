"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  courses,
  courseFeeStructures,
  courseFeeBreakdowns,
  universities,
  type OtherFee,
} from "@/lib/db/external";
import { requireRole } from "@/lib/session";
import { encodeId } from "@/lib/ids";
import { revalidatePublicPaths } from "@/lib/revalidate";

// Public-site pages that show a course: its own page, its university page (which
// lists course cards), the courses listing and the homepage chips. Building the
// course detail path needs both the university slug and the course slug.
async function publicCoursePaths(courseId: string): Promise<string[]> {
  const [row] = await db
    .select({ slug: courses.slug, universityId: courses.universityId })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  const paths = ["/", "/courses"];
  if (row?.universityId) {
    const [uni] = await db
      .select({ slug: universities.slug })
      .from(universities)
      .where(eq(universities.id, row.universityId))
      .limit(1);
    if (uni?.slug) {
      paths.push(`/universities/${uni.slug}`);
      if (row.slug) paths.push(`/universities/${uni.slug}/${row.slug}`);
    }
  }
  return paths;
}

export interface BreakdownRowData {
  label: string;
  amount: string;
  periodType: "year" | "semester" | "one_time";
  periodNumber: number;
  note: string;
}

export interface OtherFeeRowData {
  label: string;
  amount: string;
  recurrence: OtherFee["recurrence"];
  included: boolean;
}

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
  specializations: string[];
  feeStructure: {
    feeOnRequest: boolean;
    paymentCycle: string;
    registrationFee: string;
    admissionFee: string;
    processingFee: string;
    courseFee: string;
    examFee: string;
    certificateFee: string;
    yearlyFee: string;
    totalFee: string;
    offerFee: string;
    startingFee: string;
    startingFeeUnit: string;
    feeNote: string;
    emiAvailable: boolean;
    otherFees: OtherFeeRowData[];
    breakdowns: BreakdownRowData[];
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
      specializations: data.specializations
        .map((s) => s.trim())
        .filter(Boolean),
      updatedAt: new Date(),
    })
    .where(eq(courses.id, id));

  // Upsert the single fee structure row for this course.
  const f = data.feeStructure;
  const otherFees: OtherFee[] = f.otherFees
    .filter((o) => o.label.trim() && o.amount.trim() !== "")
    .map((o) => ({
      label: o.label.trim(),
      amount: Number(o.amount) || 0,
      recurrence: o.recurrence,
      included: o.included,
    }));
  const feeValues = {
    feeOnRequest: f.feeOnRequest,
    paymentCycle: empty(f.paymentCycle),
    registrationFee: empty(f.registrationFee),
    admissionFee: empty(f.admissionFee),
    processingFee: empty(f.processingFee),
    courseFee: empty(f.courseFee),
    examFee: empty(f.examFee),
    certificateFee: empty(f.certificateFee),
    yearlyFee: empty(f.yearlyFee),
    totalFee: f.feeOnRequest ? null : empty(f.totalFee),
    offerFee: f.feeOnRequest ? null : empty(f.offerFee),
    startingFee: f.feeOnRequest ? null : empty(f.startingFee),
    startingFeeUnit: empty(f.startingFeeUnit),
    feeNote: empty(f.feeNote),
    emiAvailable: f.emiAvailable,
    otherFees: otherFees.length ? otherFees : null,
    updatedAt: new Date(),
  };
  const [existing] = await db
    .select({ id: courseFeeStructures.id })
    .from(courseFeeStructures)
    .where(eq(courseFeeStructures.courseId, id))
    .limit(1);
  let feeId: string;
  if (existing) {
    feeId = existing.id;
    await db
      .update(courseFeeStructures)
      .set(feeValues)
      .where(eq(courseFeeStructures.id, feeId));
  } else {
    const [created] = await db
      .insert(courseFeeStructures)
      .values({ courseId: id, ...feeValues })
      .returning({ id: courseFeeStructures.id });
    feeId = created.id;
  }

  // Replace installment rows (no transactions on neon-http; sequential ops).
  await db
    .delete(courseFeeBreakdowns)
    .where(eq(courseFeeBreakdowns.feeStructureId, feeId));
  const rows = f.breakdowns.filter(
    (r) => r.label.trim() && r.amount.trim() !== ""
  );
  if (rows.length) {
    await db.insert(courseFeeBreakdowns).values(
      rows.map((r, i) => ({
        feeStructureId: feeId,
        label: r.label.trim(),
        amount: r.amount,
        periodType: r.periodType,
        periodNumber: r.periodNumber,
        note: empty(r.note),
        sortOrder: i,
      }))
    );
  }

  revalidatePath("/admin/content/courses");
  revalidatePath(`/admin/content/courses/${encodeId(id)}`);
  await revalidatePublicPaths(await publicCoursePaths(id));
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
  await revalidatePublicPaths(await publicCoursePaths(created.id));
  redirect(`/admin/content/courses/${encodeId(created.id)}`);
}

export async function deleteCourse(formData: FormData) {
  await requireRole("owner", "staff");
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing id");
  // Resolve the public paths before the row is gone.
  const paths = await publicCoursePaths(id);
  await db.delete(courses).where(eq(courses.id, id));
  revalidatePath("/admin/content/courses");
  await revalidatePublicPaths(paths);
}
