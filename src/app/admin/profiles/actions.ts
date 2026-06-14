"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { studentProfiles, students, universityCommissions } from "@/lib/db/schema";
import { requireSession, requireRole } from "@/lib/session";
import { reqStr, str, pastDate } from "@/lib/parse";
import { profileFieldsFromForm } from "@/lib/profile-fields";
import { generateFormToken } from "@/lib/token";
import { PROFILE_STATUS_VALUES } from "@/lib/lead-status";
import { encodeId } from "@/lib/ids";

export async function saveProfile(formData: FormData) {
  await requireSession();
  const id = reqStr(formData, "id");

  const status = str(formData, "status") ?? "profile_pending";

  await db
    .update(studentProfiles)
    .set({
      name: reqStr(formData, "name"),
      phone: reqStr(formData, "phone"),
      ...profileFieldsFromForm(formData),
      notes: str(formData, "notes"),
      assignedToId: str(formData, "assignedToId"),
      status: PROFILE_STATUS_VALUES.includes(status)
        ? status
        : "profile_pending",
      updatedAt: new Date(),
    })
    .where(eq(studentProfiles.id, id));

  revalidatePath("/admin/profiles");
  // Return to the profile details page after editing.
  redirect(`/admin/profiles/${encodeId(id)}`);
}

/** Quick status / assignee change from the profile details page. */
export async function updateProfileStatus(formData: FormData) {
  await requireSession();
  const id = reqStr(formData, "id");
  const status = str(formData, "status") ?? "profile_pending";

  await db
    .update(studentProfiles)
    .set({
      status: PROFILE_STATUS_VALUES.includes(status)
        ? status
        : "profile_pending",
      assignedToId: str(formData, "assignedToId"),
      updatedAt: new Date(),
    })
    .where(eq(studentProfiles.id, id));

  revalidatePath("/admin/profiles");
  revalidatePath(`/admin/profiles/${encodeId(id)}`);
}

export async function deleteProfile(formData: FormData) {
  await requireRole("owner", "staff");
  const id = reqStr(formData, "id");
  await db.delete(studentProfiles).where(eq(studentProfiles.id, id));
  revalidatePath("/admin/profiles");
  redirect("/admin/profiles");
}

/** Save the per-student university application portal link (e.g. the
 * apply.glaonline.com dashboard URL) used by the filling-mode copy view. */
export async function savePortalLink(formData: FormData) {
  await requireSession();
  const id = reqStr(formData, "id");
  const url = str(formData, "universityPortalUrl");
  await db
    .update(studentProfiles)
    .set({ universityPortalUrl: url, updatedAt: new Date() })
    .where(eq(studentProfiles.id, id));
  revalidatePath(`/admin/profiles/${encodeId(id)}/fill`);
  revalidatePath(`/admin/profiles/${encodeId(id)}`);
}

/** Invalidate a leaked/lost link by issuing a fresh token. */
export async function regenerateLink(formData: FormData) {
  await requireSession();
  const id = reqStr(formData, "id");
  await db
    .update(studentProfiles)
    .set({ formToken: generateFormToken(), updatedAt: new Date() })
    .where(eq(studentProfiles.id, id));
  revalidatePath(`/admin/profiles/${encodeId(id)}`);
}

/**
 * Mark a profile as ADMITTED: write a COPY into tracker_students (the
 * internal admissions ledger) with commission % + incentive auto-filled from
 * the university's commission settings, then link it back. The profile stays
 * as the student-facing record; money fields are completed on the admission.
 */
export async function markAdmitted(formData: FormData) {
  await requireSession();
  const id = reqStr(formData, "id");
  const admissionDate =
    pastDate(formData, "admissionDate", "Admission date") ??
    new Date().toISOString().slice(0, 10);

  const [profile] = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.id, id))
    .limit(1);
  if (!profile) throw new Error("Profile not found.");

  // Idempotent: if an admission copy already exists, just finish the linkage.
  if (profile.admittedStudentId) {
    redirect(`/admin/students/${encodeId(profile.admittedStudentId)}`);
  }

  // Auto-fill commission % + incentive from the university settings.
  let commissionPercent: string | null = null;
  let incentive: string | null = null;
  if (profile.universityId) {
    const [comm] = await db
      .select({
        commissionPercent: universityCommissions.commissionPercent,
        incentive: universityCommissions.incentivePerAdmission,
      })
      .from(universityCommissions)
      .where(eq(universityCommissions.universityId, profile.universityId))
      .limit(1);
    commissionPercent = comm?.commissionPercent ?? null;
    incentive = comm?.incentive ?? null;
  }

  const [admission] = await db
    .insert(students)
    .values({
      admissionDate,
      studentName: profile.name,
      phone: profile.phone,
      universityId: profile.universityId,
      courseId: profile.courseId,
      commissionPercent,
      incentive,
      salesExecutiveId: profile.assignedToId,
      paymentStatus: "pending",
      notes: `From student profile (lead portal).${profile.notes ? ` ${profile.notes}` : ""}`,
    })
    .returning({ id: students.id });

  await db
    .update(studentProfiles)
    .set({
      status: "admitted",
      admissionDate,
      admittedStudentId: admission.id,
      updatedAt: new Date(),
    })
    .where(eq(studentProfiles.id, id));

  revalidatePath("/admin/profiles");
  revalidatePath("/admin/students");
  // Land on the admission so fee/collected can be completed (commission &
  // profit recompute there).
  redirect(`/admin/students/${encodeId(admission.id)}`);
}
