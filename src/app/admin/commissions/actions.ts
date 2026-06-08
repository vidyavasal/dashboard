"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { universityCommissions } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { reqStr, num } from "@/lib/parse";

export async function saveCommission(formData: FormData) {
  await requireRole("owner");

  const universityId = reqStr(formData, "universityId");
  const values = {
    commissionPercent: num(formData, "commissionPercent"),
    incentivePerAdmission: num(formData, "incentivePerAdmission"),
    updatedAt: new Date(),
  };

  // Upsert keyed on university_id (it has a unique index).
  await db
    .insert(universityCommissions)
    .values({ universityId, ...values })
    .onConflictDoUpdate({
      target: universityCommissions.universityId,
      set: values,
    });

  revalidatePath("/admin/commissions");
  redirect("/admin/commissions");
}

export async function deleteCommission(formData: FormData) {
  await requireRole("owner");
  const id = reqStr(formData, "id");
  await db
    .delete(universityCommissions)
    .where(eq(universityCommissions.id, id));
  revalidatePath("/admin/commissions");
}
