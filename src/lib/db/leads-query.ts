import { and, count, desc, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { trackerLeads, studentProfiles, staff } from "./schema";
import { universities, courses } from "./external";

// Shared by the /admin/leads list page AND its export route so the exported
// file always matches the filters on screen.

export interface LeadFilters {
  q?: string;
  status?: string;
  subStatus?: string;
  universityId?: string;
  courseId?: string;
  programLevel?: string;
  source?: string;
  from?: string; // created on/after (YYYY-MM-DD)
  to?: string; // created on/before
}

type SP = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() ? s.trim() : undefined;
}

export function parseLeadFilters(sp: SP): LeadFilters {
  return {
    q: first(sp.q),
    status: first(sp.status),
    subStatus: first(sp.subStatus),
    universityId: first(sp.universityId),
    courseId: first(sp.courseId),
    programLevel: first(sp.programLevel),
    source: first(sp.source),
    from: first(sp.from),
    to: first(sp.to),
  };
}

/** Filters as flat params, for pagination links and the export URL. */
export function leadFilterParams(f: LeadFilters): Record<string, string | undefined> {
  return { ...f };
}

export function hasLeadFilters(f: LeadFilters): boolean {
  return Object.values(f).some(Boolean);
}

function whereFor(f: LeadFilters, opts?: { ignoreStatus?: boolean }): SQL | undefined {
  const conds: (SQL | undefined)[] = [];
  if (f.q) {
    const like = `%${f.q}%`;
    conds.push(
      or(
        ilike(trackerLeads.name, like),
        ilike(trackerLeads.phone, like),
        ilike(trackerLeads.email, like)
      )
    );
  }
  if (f.status && !opts?.ignoreStatus) conds.push(eq(trackerLeads.status, f.status));
  if (f.subStatus) conds.push(eq(trackerLeads.subStatus, f.subStatus));
  if (f.universityId) conds.push(eq(trackerLeads.universityId, f.universityId));
  if (f.courseId) conds.push(eq(trackerLeads.courseId, f.courseId));
  if (f.programLevel) conds.push(eq(trackerLeads.programLevel, f.programLevel));
  if (f.source) conds.push(eq(trackerLeads.source, f.source));
  if (f.from) conds.push(gte(trackerLeads.createdAt, new Date(`${f.from}T00:00:00`)));
  if (f.to) conds.push(lte(trackerLeads.createdAt, new Date(`${f.to}T23:59:59.999`)));
  const real = conds.filter((c): c is SQL => !!c);
  return real.length ? and(...real) : undefined;
}

const leadRow = {
  id: trackerLeads.id,
  name: trackerLeads.name,
  phone: trackerLeads.phone,
  email: trackerLeads.email,
  age: trackerLeads.age,
  sex: trackerLeads.sex,
  programLevel: trackerLeads.programLevel,
  status: trackerLeads.status,
  subStatus: trackerLeads.subStatus,
  source: trackerLeads.source,
  followUpDate: trackerLeads.followUpDate,
  notes: trackerLeads.notes,
  createdAt: trackerLeads.createdAt,
  universityName: universities.name,
  courseName: courses.name,
  assignedToName: staff.name,
  convertedProfileId: studentProfiles.id,
};

function baseQuery(where: SQL | undefined) {
  return db
    .select(leadRow)
    .from(trackerLeads)
    .leftJoin(universities, eq(trackerLeads.universityId, universities.id))
    .leftJoin(courses, eq(trackerLeads.courseId, courses.id))
    .leftJoin(staff, eq(trackerLeads.assignedToId, staff.id))
    .leftJoin(studentProfiles, eq(studentProfiles.leadId, trackerLeads.id))
    .where(where)
    .orderBy(desc(trackerLeads.createdAt));
}

export type LeadListRow = Awaited<ReturnType<typeof queryLeads>>["rows"][number];

export async function queryLeads(f: LeadFilters, page: number, pageSize: number) {
  const where = whereFor(f);
  const [rows, [{ n: total }]] = await Promise.all([
    baseQuery(where)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ n: count() }).from(trackerLeads).where(where),
  ]);
  return { rows, total };
}

/** All matching rows (capped) for the Excel/CSV export. */
export async function queryLeadsForExport(f: LeadFilters) {
  return baseQuery(whereFor(f)).limit(10000);
}

/** Per-status counts for the status tabs, honouring every other filter. */
export async function leadStatusCounts(f: LeadFilters): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: trackerLeads.status, n: count() })
    .from(trackerLeads)
    .where(whereFor(f, { ignoreStatus: true }))
    .groupBy(trackerLeads.status);
  const map: Record<string, number> = {};
  for (const r of rows) map[r.status ?? "new"] = r.n;
  return map;
}
