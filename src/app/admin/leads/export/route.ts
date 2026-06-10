import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { parseLeadFilters, queryLeadsForExport } from "@/lib/db/leads-query";
import { toCsv, csvResponse } from "@/lib/csv";
import {
  leadStatusLabel,
  leadSourceLabel,
  programLevelLabel,
} from "@/lib/lead-status";

/** Excel-compatible CSV export of the CURRENT filtered lead list. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse("Forbidden", { status: 403 });

  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const rows = await queryLeadsForExport(parseLeadFilters(sp));

  const csv = toCsv(
    [
      "Created",
      "Name",
      "Mobile",
      "Email",
      "Age",
      "Sex",
      "Looking for",
      "University",
      "Course",
      "Status",
      "Further status",
      "Source",
      "Assigned to",
      "Follow-up date",
      "Converted",
      "Notes",
    ],
    rows.map((r) => [
      r.createdAt?.toISOString().slice(0, 10),
      r.name,
      r.phone,
      r.email,
      r.age,
      r.sex,
      r.programLevel ? programLevelLabel(r.programLevel) : "",
      r.universityName,
      r.courseName,
      leadStatusLabel(r.status),
      r.subStatus,
      leadSourceLabel(r.source),
      r.assignedToName,
      r.followUpDate,
      r.convertedProfileId ? "yes" : "no",
      r.notes,
    ])
  );

  const today = new Date().toISOString().slice(0, 10);
  return csvResponse(csv, `leads-${today}.csv`);
}
