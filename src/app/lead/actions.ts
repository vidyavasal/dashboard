"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { trackerLeads } from "@/lib/db/schema";
import { reqStr, str } from "@/lib/parse";

/** Public lead-form submit — no auth. Name + mobile are mandatory. */
export async function submitLead(formData: FormData) {
  const ageRaw = str(formData, "age");
  const age = ageRaw ? parseInt(ageRaw, 10) : null;

  await db.insert(trackerLeads).values({
    name: reqStr(formData, "name"),
    phone: reqStr(formData, "phone"),
    email: str(formData, "email"),
    age: Number.isFinite(age as number) ? age : null,
    sex: str(formData, "sex"),
    programLevel: str(formData, "programLevel"),
    universityId: str(formData, "universityId"),
    courseId: str(formData, "courseId"),
    status: "new",
    source: "web_form",
  });

  redirect("/lead?submitted=1");
}
