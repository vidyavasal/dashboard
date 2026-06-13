import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { salaries } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { getStaffOptions } from "@/lib/lookups";
import { SalaryForm } from "../SalaryForm";
import { decodeId } from "@/lib/ids";

export default async function EditSalaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("owner");
  const { id: idToken } = await params;
  const id = decodeId(idToken);
  if (!id) notFound();
  const [record] = await db
    .select()
    .from(salaries)
    .where(eq(salaries.id, id))
    .limit(1);
  if (!record) notFound();
  const staffOptions = await getStaffOptions();
  return (
    <>
      <PageHeader title="Edit payroll" />
      <SalaryForm
        record={record}
        staffOptions={staffOptions}
        defaultMonth={record.month}
      />
    </>
  );
}
