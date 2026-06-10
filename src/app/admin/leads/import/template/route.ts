import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { toCsv, csvResponse } from "@/lib/csv";
import { LEAD_IMPORT_COLUMNS } from "@/lib/lead-status";

/** Downloadable CSV template for the lead importer, with one example row. */
export async function GET() {
  const session = await getSession();
  if (!session) return new NextResponse("Forbidden", { status: 403 });

  const csv = toCsv(
    [...LEAD_IMPORT_COLUMNS],
    [
      [
        "Asha K",
        "9876543210",
        "asha@example.com",
        "17",
        "female",
        "plus_one",
        "", // university — must match a university NAME exactly (or leave blank)
        "", // course — must match a course NAME exactly (or leave blank)
        "new",
        "Not contacted",
        "2026-06-15",
        "Asked about hostel",
      ],
    ]
  );

  return csvResponse(csv, "leads-import-template.csv");
}
