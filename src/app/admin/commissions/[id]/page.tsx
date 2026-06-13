import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { universityCommissions } from "@/lib/db/schema";
import { universities } from "@/lib/db/external";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { getUniversityOptions } from "@/lib/lookups";
import { CommissionDetails } from "./CommissionDetails";
import { decodeId } from "@/lib/ids";

export const metadata = { title: "Commission details" };

export default async function CommissionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("owner");
  const { id: idToken } = await params;
  const id = decodeId(idToken);
  if (!id) notFound();
  const [row] = await db
    .select({
      commission: universityCommissions,
      universityName: universities.name,
    })
    .from(universityCommissions)
    .leftJoin(universities, eq(universityCommissions.universityId, universities.id))
    .where(eq(universityCommissions.id, id))
    .limit(1);
  if (!row) notFound();

  const universityOptions = await getUniversityOptions();

  return (
    <>
      <PageHeader
        title={row.universityName ?? "Commission"}
        subtitle="Default commission settings for this university."
      />
      <CommissionDetails
        record={row.commission}
        universityName={row.universityName}
        universityOptions={universityOptions}
      />
    </>
  );
}
