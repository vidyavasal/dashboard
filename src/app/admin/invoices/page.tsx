import Link from "next/link";
import { requireRole } from "@/lib/session";
import {
  parseInvoiceFilters,
  invoiceFilterParams,
  hasInvoiceFilters,
  queryInvoices,
} from "@/lib/db/invoices-query";
import {
  PageHeader,
  ButtonLink,
  Table,
  Th,
  Td,
  StatusBadge,
} from "@/components/ui";
import { Pagination, parsePagination } from "@/components/Pagination";
import { formatMoney, formatDate } from "@/lib/format";
import { invoiceNumber, INVOICE_TYPE_LABELS } from "@/lib/invoice";
import { encodeId } from "@/lib/ids";
import { InvoiceFilters } from "./InvoiceFilters";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("owner", "staff");
  const sp = await searchParams;
  const filters = parseInvoiceFilters(sp);
  const { page, pageSize } = parsePagination(sp);

  const { rows, total } = await queryInvoices(filters, page, pageSize);
  const params = invoiceFilterParams(filters);

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Receipts, salary slips and manual bills."
        action={<ButtonLink href="/admin/invoices/new">+ New Invoice</ButtonLink>}
      />

      <InvoiceFilters
        filters={filters}
        hasActiveFilters={hasInvoiceFilters(filters)}
      />

      <Table
        isEmpty={rows.length === 0}
        empty="No invoices match these filters."
        head={
          <>
            <Th>No.</Th>
            <Th>Bill to</Th>
            <Th>Type</Th>
            <Th>Date</Th>
            <Th align="right">Total</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </>
        }
      >
        {rows.map((inv) => (
          <tr key={inv.id} className="hover:bg-surface/50">
            <Td className="font-medium whitespace-nowrap">
              {invoiceNumber(inv.seq)}
            </Td>
            <Td className="max-w-52 truncate" title={inv.partyName ?? ""}>
              {inv.partyName ?? "—"}
            </Td>
            <Td className="whitespace-nowrap">
              {INVOICE_TYPE_LABELS[inv.type] ?? inv.type}
            </Td>
            <Td className="whitespace-nowrap">
              {formatDate(inv.invoiceDate) || "—"}
            </Td>
            <Td align="right">{formatMoney(inv.total)}</Td>
            <Td>
              <StatusBadge status={inv.status} />
            </Td>
            <Td align="right">
              <div className="flex items-center justify-end gap-3">
                <Link
                  href={`/admin/invoices/${encodeId(inv.id)}/print`}
                  target="_blank"
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  Print
                </Link>
                <Link
                  href={`/admin/invoices/${encodeId(inv.id)}`}
                  className="text-sm text-primary hover:underline whitespace-nowrap"
                >
                  View details
                </Link>
              </div>
            </Td>
          </tr>
        ))}
      </Table>

      <Pagination
        basePath="/admin/invoices"
        params={params}
        page={page}
        pageSize={pageSize}
        total={total}
      />
    </>
  );
}
