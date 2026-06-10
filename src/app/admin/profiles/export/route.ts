import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  parseProfileFilters,
  queryProfilesForExport,
} from "@/lib/db/profiles-query";
import { toCsv, csvResponse } from "@/lib/csv";
import { profileStatusLabel, programLevelLabel } from "@/lib/lead-status";

/** Excel-compatible CSV export of the CURRENT filtered profile list. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse("Forbidden", { status: 403 });

  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const rows = await queryProfilesForExport(parseProfileFilters(sp));

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
      "District",
      "State",
      "Profile submitted",
      "Admission date",
      "Assigned to",
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
      profileStatusLabel(r.status),
      r.district,
      r.state,
      r.profileSubmittedAt?.toISOString().slice(0, 10),
      r.admissionDate,
      r.assignedToName,
    ])
  );

  const today = new Date().toISOString().slice(0, 10);
  return csvResponse(csv, `student-profiles-${today}.csv`);
}
