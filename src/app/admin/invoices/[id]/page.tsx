import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices, invoiceItems } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import InvoiceEditForm from "./InvoiceEditForm";
import { decodeId } from "@/lib/ids";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("owner", "staff");
  const { id: idToken } = await params;
  const id = decodeId(idToken);
  if (!id) notFound();

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);
  if (!invoice) notFound();

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, id))
    .orderBy(asc(invoiceItems.sortOrder));

  return <InvoiceEditForm invoice={invoice} items={items} idToken={idToken} />;
}
