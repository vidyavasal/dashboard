import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { ExpenseForm } from "../ExpenseForm";
import { decodeId } from "@/lib/ids";

export default async function EditExpensePage({
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
    .from(expenses)
    .where(eq(expenses.id, id))
    .limit(1);
  if (!record) notFound();
  return (
    <>
      <PageHeader title="Edit expense" />
      <ExpenseForm record={record} />
    </>
  );
}
