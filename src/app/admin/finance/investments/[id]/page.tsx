import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { investments } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { InvestmentForm } from "../InvestmentForm";

export default async function EditInvestmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("owner");
  const { id } = await params;
  const [record] = await db
    .select()
    .from(investments)
    .where(eq(investments.id, id))
    .limit(1);
  if (!record) notFound();
  return (
    <>
      <PageHeader title="Edit investment" />
      <InvestmentForm record={record} />
    </>
  );
}
