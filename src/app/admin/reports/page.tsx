import Link from "next/link";
import { requireRole } from "@/lib/session";
import { getPeriodReport, getUniversityBreakdown } from "@/lib/db/reports";
import { PageHeader, ButtonLink, Table, Th, Td } from "@/components/ui";
import { formatMoney, monthLabel } from "@/lib/format";

type Grain = "month" | "week" | "year";
const GRAINS: Grain[] = ["month", "week", "year"];

function periodLabel(grain: Grain, period: string) {
  return grain === "month" ? monthLabel(period) : period;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ grain?: string }>;
}) {
  await requireRole("owner");
  const { grain: rawGrain } = await searchParams;
  const grain: Grain = GRAINS.includes(rawGrain as Grain)
    ? (rawGrain as Grain)
    : "month";

  const [periods, byUniversity] = await Promise.all([
    getPeriodReport(grain),
    getUniversityBreakdown(),
  ]);

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Profit & loss by period, plus per-university breakdown."
        action={
          <ButtonLink href={`/admin/reports/export?grain=${grain}`}>
            Export CSV
          </ButtonLink>
        }
      />

      <div className="flex items-center gap-2 mb-4">
        {GRAINS.map((g) => (
          <Link
            key={g}
            href={`/admin/reports?grain=${g}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
              g === grain
                ? "bg-primary text-white"
                : "bg-white border border-border text-text-primary hover:bg-surface"
            }`}
          >
            {g}ly
          </Link>
        ))}
      </div>

      <div className="mb-8">
        <Table
          isEmpty={periods.length === 0}
          head={
            <>
              <Th>Period</Th>
              <Th align="right">Admissions</Th>
              <Th align="right">Collected</Th>
              <Th align="right">Gross</Th>
              <Th align="right">Expenses</Th>
              <Th align="right">Salaries</Th>
              <Th align="right">Net profit</Th>
            </>
          }
        >
          {periods.map((p) => (
            <tr key={p.period} className="hover:bg-surface/50">
              <Td className="font-medium">{periodLabel(grain, p.period)}</Td>
              <Td align="right">{p.admissions}</Td>
              <Td align="right">{formatMoney(p.collected)}</Td>
              <Td align="right">{formatMoney(p.grossProfit)}</Td>
              <Td align="right">{formatMoney(p.expenses)}</Td>
              <Td align="right">{formatMoney(p.salaries)}</Td>
              <Td
                align="right"
                className={
                  p.netProfit >= 0
                    ? "font-semibold text-green-600"
                    : "font-semibold text-red-600"
                }
              >
                {formatMoney(p.netProfit)}
              </Td>
            </tr>
          ))}
        </Table>
      </div>

      <h2 className="text-lg font-semibold text-text-primary mb-3">
        By university
      </h2>
      <Table
        isEmpty={byUniversity.length === 0}
        head={
          <>
            <Th>University</Th>
            <Th align="right">Admissions</Th>
            <Th align="right">Collected</Th>
            <Th align="right">Gross profit</Th>
          </>
        }
      >
        {byUniversity.map((u) => (
          <tr key={u.universityId ?? "none"} className="hover:bg-surface/50">
            <Td className="font-medium">{u.name ?? "Unassigned"}</Td>
            <Td align="right">{u.admissions}</Td>
            <Td align="right">{formatMoney(u.collected)}</Td>
            <Td align="right">{formatMoney(u.grossProfit)}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
