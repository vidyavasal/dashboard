"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { salaries, students } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { reqStr, str, num, bool } from "@/lib/parse";
import { toNumber } from "@/lib/format";

/** Sum of a staff member's admission incentives for a YYYY-MM month. */
export async function incentiveForMonth(
  staffId: string,
  month: string
): Promise<number> {
  const [row] = await db
    .select({
      total: sql<string>`coalesce(sum(${students.incentive}), 0)`,
    })
    .from(students)
    .where(
      and(
        eq(students.salesExecutiveId, staffId),
        sql`to_char(${students.admissionDate}, 'YYYY-MM') = ${month}`
      )
    );
  return toNumber(row?.total);
}

export async function saveSalary(formData: FormData) {
  await requireRole("owner");

  const id = str(formData, "id");
  const staffId = reqStr(formData, "staffId");
  const month = reqStr(formData, "month"); // YYYY-MM

  const base = toNumber(num(formData, "baseSalary"));
  const bonus = toNumber(num(formData, "bonus"));
  // Auto-incentive is authoritative — recomputed from admissions at save time.
  const incentive = await incentiveForMonth(staffId, month);
  const totalPayable = base + incentive + bonus;

  const values = {
    baseSalary: String(base),
    incentive: String(incentive),
    bonus: String(bonus),
    totalPayable: String(totalPayable),
    paid: bool(formData, "paid"),
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(salaries).set(values).where(eq(salaries.id, id));
  } else {
    // Upsert on (staff_id, month) — one payroll row per staff per month.
    await db
      .insert(salaries)
      .values({ staffId, month, ...values })
      .onConflictDoUpdate({
        target: [salaries.staffId, salaries.month],
        set: values,
      });
  }

  revalidatePath("/admin/finance/salaries");
  redirect("/admin/finance/salaries");
}

export async function deleteSalary(formData: FormData) {
  await requireRole("owner");
  const id = reqStr(formData, "id");
  await db.delete(salaries).where(eq(salaries.id, id));
  revalidatePath("/admin/finance/salaries");
}

export async function togglePaid(formData: FormData) {
  await requireRole("owner");
  const id = reqStr(formData, "id");
  const paid = bool(formData, "paid");
  await db
    .update(salaries)
    .set({ paid, updatedAt: new Date() })
    .where(eq(salaries.id, id));
  revalidatePath("/admin/finance/salaries");
}
