import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { staff } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { StaffDetails } from "./StaffDetails";
import { decodeId } from "@/lib/ids";

export const metadata = { title: "Staff details" };

export default async function StaffDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("owner");
  const { id: idToken } = await params;
  const id = decodeId(idToken);
  if (!id) notFound();
  const [record] = await db.select().from(staff).where(eq(staff.id, id)).limit(1);
  if (!record) notFound();

  return (
    <>
      <PageHeader title={record.name} subtitle={record.role ?? "Staff member"} />
      <StaffDetails record={record} />
    </>
  );
}
