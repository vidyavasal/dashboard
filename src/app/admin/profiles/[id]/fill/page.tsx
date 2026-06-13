import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { studentProfiles } from "@/lib/db/schema";
import { universities, courses as coursesTable } from "@/lib/db/external";
import { requireSession } from "@/lib/session";
import { Card } from "@/components/ui";
import { CopyField } from "@/components/profiles/CopyField";
import { CredentialVault } from "@/components/profiles/CredentialVault";
import { PendingButton } from "@/components/PendingButton";
import { decodeId, encodeId } from "@/lib/ids";
import { savePortalLink } from "../../actions";

export const metadata = { title: "Fill university portal" };

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Split a YYYY-MM-DD (or Date) into the day / month-name / year the portal
 * wants as three separate selects. */
function splitDob(dob: unknown): { day: string; month: string; year: string } {
  if (!dob) return { day: "", month: "", year: "" };
  const s = dob instanceof Date ? dob.toISOString().slice(0, 10) : String(dob);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return { day: "", month: "", year: "" };
  const monthIdx = parseInt(m[2], 10) - 1;
  return {
    day: String(parseInt(m[3], 10)),
    month: MONTHS[monthIdx] ?? "",
    year: m[1],
  };
}

function Section({
  title,
  step,
  children,
}: {
  title: string;
  step?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 mb-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {title}
        {step && (
          <span className="text-[11px] font-normal text-text-secondary">
            ({step})
          </span>
        )}
      </h2>
      <div>{children}</div>
    </Card>
  );
}

export default async function ProfileFillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id: idToken } = await params;
  const id = decodeId(idToken);
  if (!id) notFound();

  const [row] = await db
    .select({
      profile: studentProfiles,
      universityName: universities.name,
      courseName: coursesTable.name,
    })
    .from(studentProfiles)
    .leftJoin(universities, eq(studentProfiles.universityId, universities.id))
    .leftJoin(coursesTable, eq(studentProfiles.courseId, coursesTable.id))
    .where(eq(studentProfiles.id, id))
    .limit(1);
  if (!row) notFound();

  const p = row.profile;
  const dob = splitDob(p.dob);
  const isPg = (p.programLevel ?? "").toLowerCase().includes("pg");
  const quals = p.qualifications ?? [];
  const back = `/admin/profiles/${encodeId(id)}`;

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <Link href={back} className="text-sm text-primary hover:underline">
            ← Back to profile
          </Link>
          <h1 className="text-xl font-bold text-text-primary mt-1">
            Fill university portal — {p.name}
          </h1>
          <p className="text-sm text-text-secondary">
            {row.universityName ?? "—"} ·{" "}
            {p.programLevel ? p.programLevel.toUpperCase() : "—"} layout. Open the
            portal, then Copy each field and paste it in.
          </p>
        </div>
        {p.universityPortalUrl && (
          <a
            href={p.universityPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white px-3.5 py-2 text-sm font-medium transition-colors"
          >
            Open university portal ↗
          </a>
        )}
      </div>

      {/* Portal link editor */}
      <Card className="p-4 mb-4">
        <form action={savePortalLink} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={p.id} />
          <label className="flex-1 min-w-64 block">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-1">
              University application link
            </span>
            <input
              type="url"
              name="universityPortalUrl"
              defaultValue={p.universityPortalUrl ?? ""}
              placeholder="https://apply.glaonline.com/dashboard.aspx?type=…"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <PendingButton pendingText="Saving…">Save link</PendingButton>
        </form>
      </Card>

      <Section title="Student details" step="Step 1">
        <CopyField label="Program / Specialization" value={row.courseName} required />
        <CopyField label="Specialization Type" value={p.specializationType} />
        <CopyField label="Select Specialization" value={p.specialization} />
        <CopyField label="Name" value={p.name} required />
        <div className="grid grid-cols-3 gap-3 py-2 border-b border-border/60">
          <CopyField label="DOB — Day" value={dob.day} required />
          <CopyField label="Month" value={dob.month} required />
          <CopyField label="Year" value={dob.year} required />
        </div>
        <CopyField label="Gender" value={p.sex} required />
        <CopyField label="Area Type" value={p.areaType} required />
        <CopyField label="Father's Name" value={p.fatherName} />
        <CopyField label="Mother's Name" value={p.motherName} />
        <CopyField label="Annual Income" value={p.annualIncome} required />
        <CopyField label="Nationality" value={p.nationality} />
        <CopyField label="Religion" value={p.religion} />
        <CopyField label="Blood Group" value={p.bloodGroup} />
        <CopyField label="Category" value={p.category} required />
        <CopyField label="Aadhaar Number" value={p.aadhaarNumber} mono />
        <CopyField label="ABC Id" value={p.abcId} mono />
        <CopyField label="Student Occupation" value={p.studentOccupation} required />
        <CopyField label="Occupation Details" value={p.studentOccupationDetails} />
        <CopyField label="Contact Person" value={p.contactPerson} required />
        <CopyField label="Contact Mobile No" value={p.contactMobile} required />
        <CopyField label="Contact Email ID" value={p.contactEmail} required />
        <CopyField label="Contact Occupation" value={p.contactOccupation} />
        <CopyField label="Occupation Details" value={p.contactOccupationDetails} />
      </Section>

      <Section title="Permanent Address">
        <CopyField label="Address" value={p.address} />
        <CopyField label="City" value={p.permCity} />
        <CopyField label="District" value={p.district} />
        <CopyField label="State" value={p.state} />
        <CopyField label="Country" value={p.permCountry} />
        <CopyField label="Pincode" value={p.pincode} mono />
      </Section>

      <Section title="Correspondence Address">
        {p.corrSameAsPermanent ? (
          <p className="text-sm text-text-secondary italic py-1">
            ✓ Same as permanent address — tick the “Same as Permanent” box in
            the portal.
          </p>
        ) : (
          <>
            <CopyField label="Address" value={p.corrAddress} />
            <CopyField label="City" value={p.corrCity} />
            <CopyField label="District" value={p.corrDistrict} />
            <CopyField label="State" value={p.corrState} />
            <CopyField label="Country" value={p.corrCountry} />
            <CopyField label="Pincode" value={p.corrPincode} mono />
          </>
        )}
      </Section>

      <Section title="Qualification details" step="Step 3">
        {quals.length === 0 ? (
          <p className="text-sm text-text-secondary/60 italic py-1">
            No qualification rows captured yet
            {isPg ? " (PG: include graduation + PG)." : "."}
          </p>
        ) : (
          quals.map((q, i) => (
            <div key={i} className="mb-4 last:mb-0">
              <div className="text-xs font-semibold text-text-primary mb-1 uppercase tracking-wide">
                {q.level}
              </div>
              <CopyField label="Board / University" value={q.board} />
              <CopyField label="Result Status" value={q.resultStatus} />
              <CopyField label="Percentage" value={q.percentage} />
              <CopyField label="CGPA" value={q.cgpa} />
              <CopyField label="Year" value={q.year} />
            </div>
          ))
        )}
      </Section>

      <Section title="University portal credentials">
        <CredentialVault
          profileId={p.id}
          username={p.portalUsername}
          note={p.portalCredNote}
          hasPassword={!!p.portalPasswordEnc}
        />
      </Section>
    </div>
  );
}
