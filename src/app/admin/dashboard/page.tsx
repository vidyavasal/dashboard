import { requireRole } from "@/lib/session";
import {
  getTotals,
  getPeriodReport,
  getExecPerformance,
} from "@/lib/db/reports";
import { PageHeader, Card, Table, Th, Td } from "@/components/ui";
import { formatMoney, monthLabel } from "@/lib/format";

function Kpi({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "bad";
}) {
  const valueCls =
    tone === "good"
      ? "text-green-600"
      : tone === "bad"
        ? "text-red-600"
        : "text-text-primary";
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-wide text-text-secondary">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold ${valueCls}`}>{value}</div>
    </Card>
  );
}

export default async function DashboardPage() {
  await requireRole("owner");
  const [totals, months, execs] = await Promise.all([
    getTotals(),
    getPeriodReport("month"),
    getExecPerformance(),
  ]);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="All-time business overview." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Kpi label="Admissions" value={String(totals.admissions)} />
        <Kpi label="Collected" value={formatMoney(totals.collected)} />
        <Kpi label="Gross profit" value={formatMoney(totals.grossProfit)} />
        <Kpi
          label="Net profit"
          value={formatMoney(totals.netProfit)}
          tone={totals.netProfit >= 0 ? "good" : "bad"}
        />
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Kpi label="Expenses" value={formatMoney(totals.expenses)} />
        <Kpi label="Salaries paid" value={formatMoney(totals.salaries)} />
        <Kpi label="Investments" value={formatMoney(totals.investments)} />
      </div>

      <h2 className="text-lg font-semibold text-text-primary mb-3">
        Monthly trend
      </h2>
      <div className="mb-8">
        <Table
          isEmpty={months.length === 0}
          head={
            <>
              <Th>Month</Th>
              <Th align="right">Admissions</Th>
              <Th align="right">Collected</Th>
              <Th align="right">Gross</Th>
              <Th align="right">Expenses</Th>
              <Th align="right">Salaries</Th>
              <Th align="right">Net</Th>
            </>
          }
        >
          {months.map((m) => (
            <tr key={m.period} className="hover:bg-surface/50">
              <Td className="font-medium">{monthLabel(m.period)}</Td>
              <Td align="right">{m.admissions}</Td>
              <Td align="right">{formatMoney(m.collected)}</Td>
              <Td align="right">{formatMoney(m.grossProfit)}</Td>
              <Td align="right">{formatMoney(m.expenses)}</Td>
              <Td align="right">{formatMoney(m.salaries)}</Td>
              <Td
                align="right"
                className={
                  m.netProfit >= 0
                    ? "font-semibold text-green-600"
                    : "font-semibold text-red-600"
                }
              >
                {formatMoney(m.netProfit)}
              </Td>
            </tr>
          ))}
        </Table>
      </div>

      <h2 className="text-lg font-semibold text-text-primary mb-3">
        Sales executive performance
      </h2>
      <Table
        isEmpty={execs.length === 0}
        head={
          <>
            <Th>Executive</Th>
            <Th align="right">Admissions</Th>
            <Th align="right">Collected</Th>
            <Th align="right">Gross profit</Th>
            <Th align="right">Incentive earned</Th>
          </>
        }
      >
        {execs.map((e) => (
          <tr key={e.staffId} className="hover:bg-surface/50">
            <Td className="font-medium">{e.name}</Td>
            <Td align="right">{e.admissions}</Td>
            <Td align="right">{formatMoney(e.collected)}</Td>
            <Td align="right">{formatMoney(e.grossProfit)}</Td>
            <Td align="right">{formatMoney(e.incentive)}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
