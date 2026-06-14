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

// The student may only edit while the profile is still PENDING. Once they
// submit (status → profile_submitted) the link becomes view-only; from then on
// changes are made by staff in the admin panel.
const STUDENT_EDITABLE_STATUSES = ["profile_pending"];

/** Server-side data-quality checks (twins of the HTML field constraints). */
function validatePublicProfile(fd: FormData) {
  const mobile = /^[6-9]\d{9}$/;
  const phone = str(fd, "phone");
  if (phone && !mobile.test(phone)) {
    throw new Error("Enter a valid 10-digit mobile number.");
  }
  const contactMobile = str(fd, "contactMobile");
  if (contactMobile && !mobile.test(contactMobile)) {
    throw new Error("Enter a valid 10-digit contact mobile number.");
  }
  const aadhaar = str(fd, "aadhaarNumber");
  if (aadhaar && !/^\d{12}$/.test(aadhaar)) {
    throw new Error("Aadhaar must be a 12-digit number.");
  }
  const dob = str(fd, "dob");
  if (dob) {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 16);
    if (new Date(dob) > cutoff) {
      throw new Error("Student must be at least 16 years old.");
    }
  }
}

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

  validatePublicProfile(formData);

  await db
    .update(studentProfiles)
    .set({
      name: reqStr(formData, "name"),
      phone: reqStr(formData, "phone"),
      ...profileFieldsFromForm(formData),
      profileSubmittedAt: new Date(),
      // Submitting locks the link to view-only.
      status: "profile_submitted",
      updatedAt: new Date(),
    })
    .where(eq(studentProfiles.id, profile.id));

  revalidatePath("/admin/profiles");
  redirect(`/profile/${token}?submitted=1`);
}
