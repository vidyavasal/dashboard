import { and, count, desc, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { studentProfiles, staff } from "./schema";
import { universities, courses } from "./external";

// Shared by the /admin/profiles list page AND its export route.

export interface ProfileFilters {
  q?: string;
  status?: string;
  universityId?: string;
  courseId?: string;
  programLevel?: string;
  from?: string; // created on/after
  to?: string; // created on/before
  afrom?: string; // admission date on/after
  ato?: string; // admission date on/before
}

type SP = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() ? s.trim() : undefined;
}

export function parseProfileFilters(sp: SP): ProfileFilters {
  return {
    q: first(sp.q),
    status: first(sp.status),
    universityId: first(sp.universityId),
    courseId: first(sp.courseId),
    programLevel: first(sp.programLevel),
    from: first(sp.from),
    to: first(sp.to),
    afrom: first(sp.afrom),
    ato: first(sp.ato),
  };
}

export function profileFilterParams(f: ProfileFilters): Record<string, string | undefined> {
  return { ...f };
}

export function hasProfileFilters(f: ProfileFilters): boolean {
  return Object.values(f).some(Boolean);
}

function whereFor(f: ProfileFilters): SQL | undefined {
  const conds: (SQL | undefined)[] = [];
  if (f.q) {
    const like = `%${f.q}%`;
    conds.push(
      or(
        ilike(studentProfiles.name, like),
        ilike(studentProfiles.phone, like),
        ilike(studentProfiles.email, like)
      )
    );
  }
  if (f.status) conds.push(eq(studentProfiles.status, f.status));
  if (f.universityId) conds.push(eq(studentProfiles.universityId, f.universityId));
  if (f.courseId) conds.push(eq(studentProfiles.courseId, f.courseId));
  if (f.programLevel) conds.push(eq(studentProfiles.programLevel, f.programLevel));
  if (f.from) conds.push(gte(studentProfiles.createdAt, new Date(`${f.from}T00:00:00`)));
  if (f.to) conds.push(lte(studentProfiles.createdAt, new Date(`${f.to}T23:59:59.999`)));
  if (f.afrom) conds.push(gte(studentProfiles.admissionDate, f.afrom));
  if (f.ato) conds.push(lte(studentProfiles.admissionDate, f.ato));
  const real = conds.filter((c): c is SQL => !!c);
  return real.length ? and(...real) : undefined;
}

const profileRow = {
  id: studentProfiles.id,
  name: studentProfiles.name,
  phone: studentProfiles.phone,
  email: studentProfiles.email,
  age: studentProfiles.age,
  sex: studentProfiles.sex,
  programLevel: studentProfiles.programLevel,
  status: studentProfiles.status,
  formToken: studentProfiles.formToken,
  district: studentProfiles.district,
  state: studentProfiles.state,
  profileSubmittedAt: studentProfiles.profileSubmittedAt,
  admissionDate: studentProfiles.admissionDate,
  admittedStudentId: studentProfiles.admittedStudentId,
  leadId: studentProfiles.leadId,
  createdAt: studentProfiles.createdAt,
  universityName: universities.name,
  courseName: courses.name,
  assignedToName: staff.name,
};

function baseQuery(where: SQL | undefined) {
  return db
    .select(profileRow)
    .from(studentProfiles)
    .leftJoin(universities, eq(studentProfiles.universityId, universities.id))
    .leftJoin(courses, eq(studentProfiles.courseId, courses.id))
    .leftJoin(staff, eq(studentProfiles.assignedToId, staff.id))
    .where(where)
    .orderBy(desc(studentProfiles.createdAt));
}

export async function queryProfiles(f: ProfileFilters, page: number, pageSize: number) {
  const where = whereFor(f);
  const [rows, [{ n: total }]] = await Promise.all([
    baseQuery(where)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ n: count() }).from(studentProfiles).where(where),
  ]);
  return { rows, total };
}

export async function queryProfilesForExport(f: ProfileFilters) {
  return baseQuery(whereFor(f)).limit(10000);
}

/** Per-status counts for the status tabs (other filters ignored on purpose —
 * the tabs act as the top-level pipeline view). */
export async function profileStatusCounts(): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: studentProfiles.status, n: count() })
    .from(studentProfiles)
    .groupBy(studentProfiles.status);
  const map: Record<string, number> = {};
  for (const r of rows) map[r.status ?? "profile_pending"] = r.n;
  return map;
}
