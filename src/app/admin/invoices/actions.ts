"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  invoices,
  invoiceItems,
  students,
  staff,
  salaries,
} from "@/lib/db/schema";
import { universities, courses } from "@/lib/db/external";
import { requireRole } from "@/lib/session";
import { toNumber, monthLabel } from "@/lib/format";
import { encodeId } from "@/lib/ids";

const today = () => new Date().toISOString().slice(0, 10);

export interface InvoiceItemInput {
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
}

export interface InvoiceHeaderInput {
  type: string;
  partyType: string;
  partyName: string;
  invoiceDate: string;
  dueDate: string;
  tax: string;
  amountPaid: string;
  status: string;
  notes: string;
}

// ── Create flows ─────────────────────────────────────────────────────────────

export async function createManualInvoice(formData: FormData) {
  await requireRole("owner", "staff");
  const partyName = String(formData.get("partyName") ?? "").trim() || null;

  const [created] = await db
    .insert(invoices)
    .values({
      type: "other",
      partyType: "other",
      partyName,
      invoiceDate: today(),
      status: "draft",
      subtotal: "0",
      total: "0",
    })
    .returning({ id: invoices.id });

  revalidatePath("/admin/invoices");
  redirect(`/admin/invoices/${encodeId(created.id)}`);
}

export async function createInvoiceFromAdmission(formData: FormData) {
  await requireRole("owner", "staff");
  const studentId = String(formData.get("studentId") ?? "");
  if (!studentId) throw new Error("Pick an admission");

  const [s] = await db
    .select({
      id: students.id,
      name: students.studentName,
      collected: students.collectedFromStudent,
      universityName: universities.name,
      courseName: courses.name,
    })
    .from(students)
    .leftJoin(universities, eq(students.universityId, universities.id))
    .leftJoin(courses, eq(students.courseId, courses.id))
    .where(eq(students.id, studentId))
    .limit(1);
  if (!s) throw new Error("Admission not found");

  const amount = toNumber(s.collected);
  const desc = [s.courseName, s.universityName].filter(Boolean).join(" — ") ||
    "Course fee";

  const [created] = await db
    .insert(invoices)
    .values({
      type: "student_fee",
      partyType: "student",
      partyId: s.id,
      partyName: s.name,
      invoiceDate: today(),
      status: "draft",
      subtotal: String(amount),
      total: String(amount),
    })
    .returning({ id: invoices.id });

  await db.insert(invoiceItems).values({
    invoiceId: created.id,
    description: desc,
    quantity: "1",
    unitPrice: String(amount),
    amount: String(amount),
    sortOrder: 0,
  });

  revalidatePath("/admin/invoices");
  redirect(`/admin/invoices/${encodeId(created.id)}`);
}

export async function createInvoiceFromSalary(formData: FormData) {
  await requireRole("owner", "staff");
  const salaryId = String(formData.get("salaryId") ?? "");
  if (!salaryId) throw new Error("Pick a payroll row");

  const [row] = await db
    .select({
      id: salaries.id,
      month: salaries.month,
      base: salaries.baseSalary,
      incentive: salaries.incentive,
      bonus: salaries.bonus,
      total: salaries.totalPayable,
      staffId: staff.id,
      staffName: staff.name,
    })
    .from(salaries)
    .leftJoin(staff, eq(salaries.staffId, staff.id))
    .where(eq(salaries.id, salaryId))
    .limit(1);
  if (!row) throw new Error("Payroll row not found");

  const items = [
    { description: `Base salary (${monthLabel(row.month)})`, amount: toNumber(row.base) },
    { description: "Incentive", amount: toNumber(row.incentive) },
    { description: "Bonus", amount: toNumber(row.bonus) },
  ].filter((i) => i.amount !== 0);

  const total = toNumber(row.total);

  const [created] = await db
    .insert(invoices)
    .values({
      type: "staff_salary",
      partyType: "staff",
      partyId: row.staffId,
      partyName: row.staffName,
      invoiceDate: today(),
      status: "draft",
      subtotal: String(total),
      total: String(total),
    })
    .returning({ id: invoices.id });

  await db.insert(invoiceItems).values(
    items.map((it, idx) => ({
      invoiceId: created.id,
      description: it.description,
      quantity: "1",
      unitPrice: String(it.amount),
      amount: String(it.amount),
      sortOrder: idx,
    }))
  );

  revalidatePath("/admin/invoices");
  redirect(`/admin/invoices/${encodeId(created.id)}`);
}

// ── Save / status / delete ───────────────────────────────────────────────────

export async function saveInvoice(
  id: string,
  header: InvoiceHeaderInput,
  items: InvoiceItemInput[]
) {
  await requireRole("owner", "staff");

  const clean = items
    .map((it, idx) => ({
      invoiceId: id,
      description: it.description.trim() || null,
      quantity: it.quantity || "1",
      unitPrice: it.unitPrice || "0",
      amount: String(toNumber(it.amount)),
      sortOrder: idx,
    }))
    .filter((it) => it.description || toNumber(it.amount) !== 0);

  const subtotal = clean.reduce((s, it) => s + toNumber(it.amount), 0);
  const tax = toNumber(header.tax);
  const total = subtotal + tax;

  await db
    .update(invoices)
    .set({
      type: header.type,
      partyType: header.partyType || null,
      partyName: header.partyName.trim() || null,
      invoiceDate: header.invoiceDate || null,
      dueDate: header.dueDate || null,
      subtotal: String(subtotal),
      tax: String(tax),
      total: String(total),
      amountPaid: String(toNumber(header.amountPaid)),
      status: header.status,
      notes: header.notes.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, id));

  // Replace line items.
  await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
  if (clean.length > 0) {
    await db.insert(invoiceItems).values(clean);
  }

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${encodeId(id)}`);
}

export async function updateInvoiceStatus(formData: FormData) {
  await requireRole("owner", "staff");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) throw new Error("Missing id/status");
  await db
    .update(invoices)
    .set({ status, updatedAt: new Date() })
    .where(eq(invoices.id, id));
  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${encodeId(id)}`);
}

export async function deleteInvoice(formData: FormData) {
  await requireRole("owner", "staff");
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing id");
  await db.delete(invoices).where(eq(invoices.id, id));
  revalidatePath("/admin/invoices");
}
