import { sql, desc, eq, gte } from "drizzle-orm";
import { db } from "./index";
import { visitors, pageViews, leads, universities, courses } from "./external";

// ============================================================================
// Read-only analytics queries over the MAIN SITE's visitor tracking tables
// (visitors / page_views / leads). Surfaced in /admin/analytics.
// ============================================================================

const sinceDays = (days: number) =>
  sql`now() - ${sql.raw(`interval '${days} days'`)}`;

export interface AnalyticsTotals {
  visitors: number;
  visits: number; // sum of visit_count (sessions)
  pageViews: number;
  feeViews: number;
  leads: number;
  newVisitors30d: number;
  returningRate: number; // % of visitors with visitCount > 1
  leadConversion: number; // leads / visitors %
}

export async function getAnalyticsTotals(): Promise<AnalyticsTotals> {
  const [[v], [pv], [fv], [ld], [ret], [nv]] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)::int`,
        visits: sql<number>`coalesce(sum(${visitors.visitCount}),0)::int`,
      })
      .from(visitors),
    db.select({ count: sql<number>`count(*)::int` }).from(pageViews),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(pageViews)
      .where(eq(pageViews.event, "view_fee")),
    db.select({ count: sql<number>`count(*)::int` }).from(leads),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(visitors)
      .where(sql`${visitors.visitCount} > 1`),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(visitors)
      .where(gte(visitors.firstSeen, sinceDays(30))),
  ]);

  const totalVisitors = v?.count ?? 0;
  return {
    visitors: totalVisitors,
    visits: v?.visits ?? 0,
    pageViews: pv?.count ?? 0,
    feeViews: fv?.count ?? 0,
    leads: ld?.count ?? 0,
    newVisitors30d: nv?.count ?? 0,
    returningRate: totalVisitors ? Math.round(((ret?.count ?? 0) / totalVisitors) * 100) : 0,
    leadConversion: totalVisitors
      ? Math.round(((ld?.count ?? 0) / totalVisitors) * 1000) / 10
      : 0,
  };
}

/** Daily visitor + view trend for the last N days. */
export async function getDailyTrend(days = 30) {
  return db
    .select({
      day: sql<string>`to_char(${pageViews.createdAt}, 'YYYY-MM-DD')`,
      views: sql<number>`count(*)::int`,
      visitors: sql<number>`count(distinct ${pageViews.visitorId})::int`,
    })
    .from(pageViews)
    .where(gte(pageViews.createdAt, sinceDays(days)))
    .groupBy(sql`1`)
    .orderBy(sql`1`);
}

/** Most-viewed universities (joins entity → universities). */
export async function getTopUniversities(limit = 10) {
  return db
    .select({
      id: universities.id,
      name: universities.name,
      slug: universities.slug,
      views: sql<number>`count(*)::int`,
      visitors: sql<number>`count(distinct ${pageViews.visitorId})::int`,
    })
    .from(pageViews)
    .innerJoin(universities, eq(pageViews.entityId, universities.id))
    .where(eq(pageViews.entityType, "university"))
    .groupBy(universities.id, universities.name, universities.slug)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

/** Most-viewed courses, incl. fee-page views. */
export async function getTopCourses(limit = 10) {
  return db
    .select({
      id: courses.id,
      name: courses.name,
      views: sql<number>`count(*)::int`,
      feeViews: sql<number>`count(*) filter (where ${pageViews.event} = 'view_fee')::int`,
      visitors: sql<number>`count(distinct ${pageViews.visitorId})::int`,
    })
    .from(pageViews)
    .innerJoin(courses, eq(pageViews.entityId, courses.id))
    .where(eq(pageViews.entityType, "course"))
    .groupBy(courses.id, courses.name)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

export async function getTrafficSources(limit = 10) {
  return db
    .select({
      source: sql<string>`coalesce(nullif(${visitors.utmSource}, ''), 'direct/organic')`,
      visitors: sql<number>`count(*)::int`,
      leads: sql<number>`(select count(*) from ${leads} l where l.utm_source is not distinct from ${visitors.utmSource})::int`,
    })
    .from(visitors)
    .groupBy(sql`1`)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

export async function getGeoBreakdown(limit = 10) {
  return db
    .select({
      country: sql<string>`coalesce(${visitors.country}, '—')`,
      visitors: sql<number>`count(*)::int`,
    })
    .from(visitors)
    .groupBy(sql`1`)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

export async function getDeviceBreakdown() {
  return db
    .select({
      device: sql<string>`coalesce(${visitors.device}, 'unknown')`,
      visitors: sql<number>`count(*)::int`,
    })
    .from(visitors)
    .groupBy(sql`1`)
    .orderBy(desc(sql`count(*)`));
}

/** Recent leads with their attributed university/course. */
export async function getRecentLeads(limit = 25) {
  return db
    .select({
      id: leads.id,
      name: leads.name,
      phone: leads.phone,
      email: leads.email,
      source: leads.source,
      status: leads.status,
      universityName: universities.name,
      courseName: courses.name,
      utmSource: leads.utmSource,
      createdAt: leads.createdAt,
      visitorId: leads.visitorId,
    })
    .from(leads)
    .leftJoin(universities, eq(leads.universityId, universities.id))
    .leftJoin(courses, eq(leads.courseId, courses.id))
    .orderBy(desc(leads.createdAt))
    .limit(limit);
}

/** "Who visited" — a single lead's full page-view history. */
export async function getLeadJourney(visitorId: string) {
  const [profile] = await db
    .select()
    .from(visitors)
    .where(eq(visitors.id, visitorId))
    .limit(1);

  const history = await db
    .select({
      event: pageViews.event,
      path: pageViews.path,
      entityType: pageViews.entityType,
      createdAt: pageViews.createdAt,
    })
    .from(pageViews)
    .where(eq(pageViews.visitorId, visitorId))
    .orderBy(desc(pageViews.createdAt))
    .limit(100);

  const leadRows = await db
    .select()
    .from(leads)
    .where(eq(leads.visitorId, visitorId))
    .orderBy(desc(leads.createdAt));

  return { profile: profile ?? null, history, leads: leadRows };
}

/** Lead funnel: visitors → fee views → leads → (converted). */
export async function getLeadFunnel() {
  const [[vis], [fee], [allLeads], [converted]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(visitors),
    db
      .select({ n: sql<number>`count(distinct ${pageViews.visitorId})::int` })
      .from(pageViews)
      .where(eq(pageViews.event, "view_fee")),
    db.select({ n: sql<number>`count(*)::int` }).from(leads),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(leads)
      .where(eq(leads.status, "converted")),
  ]);
  return {
    visitors: vis?.n ?? 0,
    feeViewers: fee?.n ?? 0,
    leads: allLeads?.n ?? 0,
    converted: converted?.n ?? 0,
  };
}
