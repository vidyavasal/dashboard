import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPeriodReport } from "@/lib/db/reports";

type Grain = "month" | "week" | "year";
const GRAINS: Grain[] = ["month", "week", "year"];

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const raw = req.nextUrl.searchParams.get("grain");
  const grain: Grain = GRAINS.includes(raw as Grain) ? (raw as Grain) : "month";

  const rows = await getPeriodReport(grain);

  const header = [
    "Period",
    "Admissions",
    "Collected",
    "Gross Profit",
    "Expenses",
    "Salaries",
    "Net Profit",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.period,
        r.admissions,
        r.collected,
        r.grossProfit,
        r.expenses,
        r.salaries,
        r.netProfit,
      ]
        .map(csvCell)
        .join(",")
    );
  }
  const csv = lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="iode-report-${grain}.csv"`,
    },
  });
}
