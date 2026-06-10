import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getStaffIdForUser } from "@/lib/lookups";
import {
  parseStudentFilters,
  queryStudentsForExport,
} from "@/lib/db/students-query";
import { toCsv, csvResponse } from "@/lib/csv";

/**
 * Excel-compatible CSV export of the CURRENT filtered admissions list.
 * Sales execs get only their own rows and no profit/commission columns.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse("Forbidden", { status: 403 });

  const isOwner = session.role === "owner";
  let pinnedStaffId: string | null | undefined = undefined;
  if (session.role === "sales") {
    pinnedStaffId = await getStaffIdForUser(session.id);
  }

  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const rows = await queryStudentsForExport(parseStudentFilters(sp), pinnedStaffId);

  const header = [
    "Admission date",
    "Student",
    "Mobile",
    "University",
    "Course",
    "Collected",
    ...(isOwner
      ? ["University fee", "Commission %", "Commission amount", "IODE profit"]
      : []),
    "Incentive",
    ...(isOwner ? ["Sales exec"] : []),
    "Payment status",
    "Notes",
  ];

  const csv = toCsv(
    header,
    rows.map((r) => [
      r.admissionDate,
      r.studentName,
      r.phone,
      r.universityName,
      r.courseName,
      r.collected,
      ...(isOwner
        ? [r.universityFee, r.commissionPercent, r.commissionAmount, r.iodeProfit]
        : []),
      r.incentive,
      ...(isOwner ? [r.execName] : []),
      r.paymentStatus,
      r.notes,
    ])
  );

  const today = new Date().toISOString().slice(0, 10);
  return csvResponse(csv, `admissions-${today}.csv`);
}
