import { and, count, desc, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { students, staff } from "./schema";
import { universities, courses } from "./external";

// Shared by the /admin/students (Admissions) list page AND its export route.

export interface StudentFilters {
  q?: string;
  universityId?: string;
  courseId?: string;
  paymentStatus?: string;
  salesExecutiveId?: string;
  from?: string; // admission date on/after
  to?: string; // admission date on/before
}

type SP = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() ? s.trim() : undefined;
}

export function parseStudentFilters(sp: SP): StudentFilters {
  return {
    q: first(sp.q),
    universityId: first(sp.universityId),
    courseId: first(sp.courseId),
    paymentStatus: first(sp.paymentStatus),
    salesExecutiveId: first(sp.salesExecutiveId),
    from: first(sp.from),
    to: first(sp.to),
  };
}

export function studentFilterParams(f: StudentFilters): Record<string, string | undefined> {
  return { ...f };
}

export function hasStudentFilters(f: StudentFilters): boolean {
  return Object.values(f).some(Boolean);
}

/** `pinnedStaffId` forces a sales exec to their own rows regardless of filters. */
function whereFor(f: StudentFilters, pinnedStaffId?: string | null): SQL | undefined {
  const conds: (SQL | undefined)[] = [];
  if (pinnedStaffId !== undefined) {
    // Sales user: pin to their staff id (an unlinked login sees nothing).
    conds.push(
      eq(
        students.salesExecutiveId,
        pinnedStaffId ?? "00000000-0000-0000-0000-000000000000"
      )
    );
  } else if (f.salesExecutiveId) {
    conds.push(eq(students.salesExecutiveId, f.salesExecutiveId));
  }
  if (f.q) {
    const like = `%${f.q}%`;
    conds.push(or(ilike(students.studentName, like), ilike(students.phone, like)));
  }
  if (f.universityId) conds.push(eq(students.universityId, f.universityId));
  if (f.courseId) conds.push(eq(students.courseId, f.courseId));
  if (f.paymentStatus) conds.push(eq(students.paymentStatus, f.paymentStatus));
  if (f.from) conds.push(gte(students.admissionDate, f.from));
  if (f.to) conds.push(lte(students.admissionDate, f.to));
  const real = conds.filter((c): c is SQL => !!c);
  return real.length ? and(...real) : undefined;
}

const studentRow = {
  id: students.id,
  admissionDate: students.admissionDate,
  studentName: students.studentName,
  phone: students.phone,
  universityName: universities.name,
  courseName: courses.name,
  collected: students.collectedFromStudent,
  universityFee: students.universityFee,
  commissionPercent: students.commissionPercent,
  commissionAmount: students.commissionAmount,
  iodeProfit: students.iodeProfit,
  incentive: students.incentive,
  execName: staff.name,
  paymentStatus: students.paymentStatus,
  notes: students.notes,
};

function baseQuery(where: SQL | undefined) {
  return db
    .select(studentRow)
    .from(students)
    .leftJoin(universities, eq(students.universityId, universities.id))
    .leftJoin(courses, eq(students.courseId, courses.id))
    .leftJoin(staff, eq(students.salesExecutiveId, staff.id))
    .where(where)
    .orderBy(desc(students.admissionDate));
}

export async function queryStudents(
  f: StudentFilters,
  page: number,
  pageSize: number,
  pinnedStaffId?: string | null
) {
  const where = whereFor(f, pinnedStaffId);
  const [rows, [{ n: total }]] = await Promise.all([
    baseQuery(where)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ n: count() }).from(students).where(where),
  ]);
  return { rows, total };
}

export async function queryStudentsForExport(
  f: StudentFilters,
  pinnedStaffId?: string | null
) {
  return baseQuery(whereFor(f, pinnedStaffId)).limit(10000);
}
