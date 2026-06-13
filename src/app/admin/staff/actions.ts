"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { staff } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { reqStr, str, num, pastDate } from "@/lib/parse";

export async function saveStaff(formData: FormData) {
  await requireRole("owner");

  const id = str(formData, "id");
  // Join date can never be in the future; new staff at most 1 month back.
  const joinDate = pastDate(formData, "joinDate", "Join date");
  if (!id && joinDate) {
    const min = new Date();
    min.setMonth(min.getMonth() - 1);
    if (new Date(joinDate + "T00:00:00") < min) {
      throw new Error("Join date must be today or within the last month.");
    }
  }
  const values = {
    name: reqStr(formData, "name"),
    role: str(formData, "role"),
    baseSalary: num(formData, "baseSalary"),
    joinDate,
    status: str(formData, "status") ?? "active",
    adminUserId: str(formData, "adminUserId"),
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(staff).set(values).where(eq(staff.id, id));
  } else {
    await db.insert(staff).values(values);
  }

  revalidatePath("/admin/staff");
  redirect("/admin/staff");
}

export async function deleteStaff(formData: FormData) {
  await requireRole("owner");
  const id = reqStr(formData, "id");
  await db.delete(staff).where(eq(staff.id, id));
  revalidatePath("/admin/staff");
}
