"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { investments } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { reqStr, str, num, pastDate } from "@/lib/parse";

export async function saveInvestment(formData: FormData) {
  await requireRole("owner");
  const id = str(formData, "id");
  const values = {
    investmentDate: pastDate(formData, "investmentDate", "Investment date"),
    partner: str(formData, "partner"),
    amount: num(formData, "amount"),
    note: str(formData, "note"),
  };
  if (id) {
    await db.update(investments).set(values).where(eq(investments.id, id));
  } else {
    await db.insert(investments).values(values);
  }
  revalidatePath("/admin/finance/investments");
  redirect("/admin/finance/investments");
}

export async function deleteInvestment(formData: FormData) {
  await requireRole("owner");
  const id = reqStr(formData, "id");
  await db.delete(investments).where(eq(investments.id, id));
  revalidatePath("/admin/finance/investments");
}
