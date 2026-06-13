"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { getStaffIdForUser } from "@/lib/lookups";
import { reqStr, str, num, pastDate } from "@/lib/parse";

/**
 * Ensure the current user is allowed to write the admission identified by `id`
 * (sales execs may only touch their own rows). Returns the resolved staff id
 * a `sales` user must be pinned to (null for owners).
 */
async function authorizeWrite(id: string | null) {
  const session = await requireSession();
  if (session.role === "owner") return { session, ownStaffId: null as string | null };

  const ownStaffId = await getStaffIdForUser(session.id);
  if (!ownStaffId) {
    throw new Error("Your login is not linked to a staff record.");
  }
  if (id) {
    const [existing] = await db
      .select({ salesExecutiveId: students.salesExecutiveId })
      .from(students)
      .where(eq(students.id, id))
      .limit(1);
    if (!existing || existing.salesExecutiveId !== ownStaffId) {
      throw new Error("You can only edit your own admissions.");
    }
  }
  return { session, ownStaffId };
}

export async function saveStudent(formData: FormData) {
  const id = str(formData, "id");
  const { ownStaffId } = await authorizeWrite(id);

  const values = {
    admissionDate: pastDate(formData, "admissionDate", "Admission date"),
    studentName: reqStr(formData, "studentName"),
    phone: str(formData, "phone"),
    universityId: str(formData, "universityId"),
    courseId: str(formData, "courseId"),
    model: str(formData, "model"),
    universityFee: num(formData, "universityFee"),
    collectedFromStudent: num(formData, "collectedFromStudent"),
    commissionPercent: num(formData, "commissionPercent"),
    commissionAmount: num(formData, "commissionAmount"),
    iodeProfit: num(formData, "iodeProfit"),
    // Sales execs are pinned to themselves; owners pick the exec.
    salesExecutiveId: ownStaffId ?? str(formData, "salesExecutiveId"),
    incentive: num(formData, "incentive"),
    paymentStatus: str(formData, "paymentStatus") ?? "pending",
    notes: str(formData, "notes"),
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(students).set(values).where(eq(students.id, id));
  } else {
    await db.insert(students).values(values);
  }

  revalidatePath("/admin/students");
  redirect("/admin/students");
}

export async function deleteStudent(formData: FormData) {
  const id = reqStr(formData, "id");
  const { ownStaffId } = await authorizeWrite(id);
  // ownStaffId already proved ownership above for sales; owners pass through.
  const where = ownStaffId
    ? and(eq(students.id, id), eq(students.salesExecutiveId, ownStaffId))
    : eq(students.id, id);
  await db.delete(students).where(where);
  revalidatePath("/admin/students");
}
