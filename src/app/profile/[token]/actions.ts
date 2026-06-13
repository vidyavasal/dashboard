"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { studentProfiles } from "@/lib/db/schema";
import { reqStr, str } from "@/lib/parse";
import { profileFieldsFromForm } from "@/lib/profile-fields";

// PUBLIC action — the token IS the authorisation. A student can update their
// profile while it is still in the data-collection stages; once it reaches
// admission processing the form locks (staff edit from the admin panel).

const STUDENT_EDITABLE_STATUSES = [
  "profile_pending",
  "profile_submitted",
  "docs_pending",
];

export async function submitProfile(formData: FormData) {
  const token = reqStr(formData, "token");

  const [profile] = await db
    .select({ id: studentProfiles.id, status: studentProfiles.status })
    .from(studentProfiles)
    .where(eq(studentProfiles.formToken, token))
    .limit(1);
  if (!profile) throw new Error("Invalid link.");
  if (!STUDENT_EDITABLE_STATUSES.includes(profile.status ?? "")) {
    throw new Error("This profile can no longer be edited from this link.");
  }

  const ageRaw = str(formData, "age");
  const age = ageRaw ? parseInt(ageRaw, 10) : null;

  await db
    .update(studentProfiles)
    .set({
      name: reqStr(formData, "name"),
      phone: reqStr(formData, "phone"),
      age: Number.isFinite(age as number) ? age : null,
      ...profileFieldsFromForm(formData),
      profileSubmittedAt: new Date(),
      // First submission moves the pipeline forward; later edits keep status.
      ...(profile.status === "profile_pending"
        ? { status: "profile_submitted" }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(studentProfiles.id, profile.id));

  revalidatePath("/admin/profiles");
  redirect(`/profile/${token}?submitted=1`);
}
