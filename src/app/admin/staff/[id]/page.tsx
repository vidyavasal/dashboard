import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { staff } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { StaffForm } from "../StaffForm";

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("owner");
  const { id } = await params;
  const [record] = await db.select().from(staff).where(eq(staff.id, id)).limit(1);
  if (!record) notFound();

  return (
    <>
      <PageHeader title="Edit staff" subtitle={record.name} />
      <StaffForm record={record} />
    </>
  );
}
