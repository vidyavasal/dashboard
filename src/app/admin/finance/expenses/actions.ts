"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { reqStr, str, num, pastDate } from "@/lib/parse";

export async function saveExpense(formData: FormData) {
  await requireRole("owner");
  const id = str(formData, "id");
  const values = {
    expenseDate: pastDate(formData, "expenseDate", "Expense date"),
    category: str(formData, "category"),
    description: str(formData, "description"),
    amount: num(formData, "amount"),
    paidBy: str(formData, "paidBy"),
    updatedAt: new Date(),
  };
  if (id) {
    await db.update(expenses).set(values).where(eq(expenses.id, id));
  } else {
    await db.insert(expenses).values(values);
  }
  revalidatePath("/admin/finance/expenses");
  redirect("/admin/finance/expenses");
}

export async function deleteExpense(formData: FormData) {
  await requireRole("owner");
  const id = reqStr(formData, "id");
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidatePath("/admin/finance/expenses");
}
