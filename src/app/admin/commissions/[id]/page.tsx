import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { universityCommissions } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { getUniversityOptions } from "@/lib/lookups";
import { CommissionForm } from "../CommissionForm";

export default async function EditCommissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("owner");
  const { id } = await params;
  const [record] = await db
    .select()
    .from(universityCommissions)
    .where(eq(universityCommissions.id, id))
    .limit(1);
  if (!record) notFound();

  const universityOptions = await getUniversityOptions();

  return (
    <>
      <PageHeader title="Edit commission" />
      <CommissionForm record={record} universityOptions={universityOptions} />
    </>
  );
}
