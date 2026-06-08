import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { universities, courses } from "@/lib/db/external";
import { staff, universityCommissions } from "@/lib/db/schema";

/** Active universities for dropdowns. */
export async function getUniversityOptions() {
  const rows = await db
    .select({ id: universities.id, name: universities.name })
    .from(universities)
    .orderBy(asc(universities.name));
  return rows.map((r) => ({ value: r.id, label: r.name }));
}

/** Courses for dropdowns. Optionally scoped to a university. */
export async function getCourseOptions(universityId?: string) {
  const base = db
    .select({
      id: courses.id,
      name: courses.name,
      universityId: courses.universityId,
    })
    .from(courses)
    .orderBy(asc(courses.name));
  const rows = universityId
    ? await base.where(eq(courses.universityId, universityId))
    : await base;
  return rows;
}

/** Staff for dropdowns (sales execs etc). */
export async function getStaffOptions() {
  const rows = await db
    .select({ id: staff.id, name: staff.name })
    .from(staff)
    .orderBy(asc(staff.name));
  return rows.map((r) => ({ value: r.id, label: r.name }));
}

/**
 * The tracker_staff.id linked to a given admin_users.id, or null if no staff
 * row is linked. Used to scope a `sales` user to their own admissions.
 */
export async function getStaffIdForUser(
  adminUserId: string
): Promise<string | null> {
  const [row] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(eq(staff.adminUserId, adminUserId))
    .limit(1);
  return row?.id ?? null;
}

/** Map of universityId -> default commission % + incentive per admission. */
export async function getCommissionDefaults(): Promise<
  Record<string, { commissionPercent: string | null; incentive: string | null }>
> {
  const rows = await db
    .select({
      universityId: universityCommissions.universityId,
      commissionPercent: universityCommissions.commissionPercent,
      incentive: universityCommissions.incentivePerAdmission,
    })
    .from(universityCommissions);
  const map: Record<
    string,
    { commissionPercent: string | null; incentive: string | null }
  > = {};
  for (const r of rows) {
    map[r.universityId] = {
      commissionPercent: r.commissionPercent,
      incentive: r.incentive,
    };
  }
  return map;
}
