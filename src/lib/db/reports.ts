import { sql, eq, desc } from "drizzle-orm";
import { db } from "./index";
import { students, expenses, salaries, staff, investments } from "./schema";
import { universities } from "./shared";
import { toNumber } from "@/lib/format";

// ============================================================================
// Reporting / aggregation queries. Nothing here is stored — every figure is
// derived live from the ledgers so it can never go stale.
//
//   gross profit = Σ tracker_students.iode_profit
//   net profit   = gross − expenses − salaries (total payable)
// ============================================================================

export interface PeriodRow {
  period: string; // "YYYY-MM" (month), "YYYY-Www" (week) or "YYYY" (year)
  admissions: number;
  collected: number;
  grossProfit: number;
  expenses: number;
  salaries: number;
  netProfit: number;
}

type Grain = "month" | "week" | "year";

const GRAIN_FMT: Record<Grain, string> = {
  month: "YYYY-MM",
  week: "IYYY-\"W\"IW",
  year: "YYYY",
};

/**
 * Period rollup combining admissions (collected + gross profit), expenses and
 * salaries into one row per period. Salaries roll up by their `month` string,
 * so they only line up exactly on the "month" grain; for week/year they are
 * bucketed by the month value's relevant prefix.
 */
export async function getPeriodReport(grain: Grain): Promise<PeriodRow[]> {
  const fmt = GRAIN_FMT[grain];

  // Admissions grouped by period of admission_date.
  const adm = await db
    .select({
      period: sql<string>`to_char(${students.admissionDate}, ${sql.raw(`'${fmt}'`)})`,
      admissions: sql<string>`count(*)`,
      collected: sql<string>`coalesce(sum(${students.collectedFromStudent}), 0)`,
      grossProfit: sql<string>`coalesce(sum(${students.iodeProfit}), 0)`,
    })
    .from(students)
    .where(sql`${students.admissionDate} is not null`)
    .groupBy(sql`1`);

  // Expenses grouped by period of expense_date.
  const exp = await db
    .select({
      period: sql<string>`to_char(${expenses.expenseDate}, ${sql.raw(`'${fmt}'`)})`,
      total: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(sql`${expenses.expenseDate} is not null`)
    .groupBy(sql`1`);

  // Salaries are keyed by a YYYY-MM string. Bucket to the requested grain.
  const salPeriodExpr =
    grain === "year"
      ? sql<string>`substring(${salaries.month} from 1 for 4)`
      : sql<string>`${salaries.month}`; // month grain matches; week ~ month
  const sal = await db
    .select({
      period: salPeriodExpr,
      total: sql<string>`coalesce(sum(${salaries.totalPayable}), 0)`,
    })
    .from(salaries)
    .groupBy(sql`1`);

  const map = new Map<string, PeriodRow>();
  const ensure = (period: string) => {
    let r = map.get(period);
    if (!r) {
      r = {
        period,
        admissions: 0,
        collected: 0,
        grossProfit: 0,
        expenses: 0,
        salaries: 0,
        netProfit: 0,
      };
      map.set(period, r);
    }
    return r;
  };

  for (const a of adm) {
    const r = ensure(a.period);
    r.admissions = toNumber(a.admissions);
    r.collected = toNumber(a.collected);
    r.grossProfit = toNumber(a.grossProfit);
  }
  for (const e of exp) {
    ensure(e.period).expenses = toNumber(e.total);
  }
  for (const s of sal) {
    ensure(s.period).salaries = toNumber(s.total);
  }

  const rows = [...map.values()];
  for (const r of rows) {
    r.netProfit = r.grossProfit - r.expenses - r.salaries;
  }
  rows.sort((a, b) => (a.period < b.period ? 1 : -1)); // newest first
  return rows;
}

export interface ExecPerformance {
  staffId: string;
  name: string;
  admissions: number;
  collected: number;
  grossProfit: number;
  incentive: number;
}

/** Per sales-exec performance across all time (or scope later if needed). */
export async function getExecPerformance(): Promise<ExecPerformance[]> {
  const rows = await db
    .select({
      staffId: staff.id,
      name: staff.name,
      admissions: sql<string>`count(${students.id})`,
      collected: sql<string>`coalesce(sum(${students.collectedFromStudent}), 0)`,
      grossProfit: sql<string>`coalesce(sum(${students.iodeProfit}), 0)`,
      incentive: sql<string>`coalesce(sum(${students.incentive}), 0)`,
    })
    .from(staff)
    .leftJoin(students, eq(students.salesExecutiveId, staff.id))
    .groupBy(staff.id, staff.name)
    .orderBy(desc(sql`coalesce(sum(${students.iodeProfit}), 0)`));

  return rows.map((r) => ({
    staffId: r.staffId,
    name: r.name,
    admissions: toNumber(r.admissions),
    collected: toNumber(r.collected),
    grossProfit: toNumber(r.grossProfit),
    incentive: toNumber(r.incentive),
  }));
}

export interface UniversityBreakdown {
  universityId: string | null;
  name: string | null;
  admissions: number;
  collected: number;
  grossProfit: number;
}

/** Per-university admissions breakdown. */
export async function getUniversityBreakdown(): Promise<UniversityBreakdown[]> {
  const rows = await db
    .select({
      universityId: students.universityId,
      name: universities.name,
      admissions: sql<string>`count(*)`,
      collected: sql<string>`coalesce(sum(${students.collectedFromStudent}), 0)`,
      grossProfit: sql<string>`coalesce(sum(${students.iodeProfit}), 0)`,
    })
    .from(students)
    .leftJoin(universities, eq(students.universityId, universities.id))
    .groupBy(students.universityId, universities.name)
    .orderBy(desc(sql`coalesce(sum(${students.iodeProfit}), 0)`));

  return rows.map((r) => ({
    universityId: r.universityId,
    name: r.name,
    admissions: toNumber(r.admissions),
    collected: toNumber(r.collected),
    grossProfit: toNumber(r.grossProfit),
  }));
}

export interface Totals {
  admissions: number;
  collected: number;
  grossProfit: number;
  expenses: number;
  salaries: number;
  investments: number;
  netProfit: number;
}

/** All-time headline totals for the dashboard KPI cards. */
export async function getTotals(): Promise<Totals> {
  const [a] = await db
    .select({
      admissions: sql<string>`count(*)`,
      collected: sql<string>`coalesce(sum(${students.collectedFromStudent}), 0)`,
      grossProfit: sql<string>`coalesce(sum(${students.iodeProfit}), 0)`,
    })
    .from(students);
  const [e] = await db
    .select({ total: sql<string>`coalesce(sum(${expenses.amount}), 0)` })
    .from(expenses);
  const [s] = await db
    .select({ total: sql<string>`coalesce(sum(${salaries.totalPayable}), 0)` })
    .from(salaries);
  const [i] = await db
    .select({ total: sql<string>`coalesce(sum(${investments.amount}), 0)` })
    .from(investments);

  const grossProfit = toNumber(a?.grossProfit);
  const expensesTotal = toNumber(e?.total);
  const salariesTotal = toNumber(s?.total);

  return {
    admissions: toNumber(a?.admissions),
    collected: toNumber(a?.collected),
    grossProfit,
    expenses: expensesTotal,
    salaries: salariesTotal,
    investments: toNumber(i?.total),
    netProfit: grossProfit - expensesTotal - salariesTotal,
  };
}
