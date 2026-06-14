import Link from "next/link";
import { PendingButton } from "@/components/PendingButton";

// ─── Page header ─────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
        {subtitle && (
          <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  const cls =
    variant === "primary"
      ? "bg-primary hover:bg-primary-hover text-white"
      : "bg-white border border-border text-text-primary hover:bg-surface";
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${cls}`}
    >
      {children}
    </Link>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  pendingText = "Saving…",
}: {
  children: React.ReactNode;
  variant?: "primary" | "danger";
  pendingText?: string;
}) {
  return (
    <PendingButton variant={variant} pendingText={pendingText}>
      {children}
    </PendingButton>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-border shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Table ───────────────────────────────────────────────────────────────────

export function Table({
  head,
  children,
  empty = "No records yet.",
  isEmpty = false,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
  empty?: string;
  isEmpty?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/60 text-left text-xs uppercase tracking-wide text-text-secondary">
              {head}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">{children}</tbody>
        </table>
      </div>
      {isEmpty && (
        <div className="px-6 py-12 text-center text-sm text-text-secondary">
          {empty}
        </div>
      )}
    </Card>
  );
}

export function Th({
  children,
  align = "left",
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <th className={`px-4 py-3 font-medium text-${align}`}>{children}</th>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
  title,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  /** Native tooltip — useful when the cell content is truncated. */
  title?: string;
}) {
  return (
    <td title={title} className={`px-4 py-3 text-${align} ${className}`}>
      {children}
    </td>
  );
}

// ─── Detail item (label over value, for read-only details views) ────────────

export function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode | null;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
        {label}
      </div>
      <div className="text-sm text-text-primary mt-0.5 break-words">
        {value || "—"}
      </div>
    </div>
  );
}

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  partial: "bg-blue-50 text-blue-700 border-blue-200",
  // Invoices
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  issued: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  // Lead pipeline (values from src/lib/lead-status.ts)
  new: "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-sky-50 text-sky-700 border-sky-200",
  follow_up: "bg-amber-50 text-amber-700 border-amber-200",
  interested: "bg-violet-50 text-violet-700 border-violet-200",
  not_interested: "bg-gray-100 text-gray-600 border-gray-200",
  converted: "bg-green-50 text-green-700 border-green-200",
  lost: "bg-red-50 text-red-700 border-red-200",
  // Student-profile pipeline
  profile_pending: "bg-amber-50 text-amber-700 border-amber-200",
  profile_submitted: "bg-blue-50 text-blue-700 border-blue-200",
  docs_pending: "bg-orange-50 text-orange-700 border-orange-200",
  admission_processing: "bg-violet-50 text-violet-700 border-violet-200",
  admitted: "bg-green-50 text-green-700 border-green-200",
  dropped: "bg-red-50 text-red-700 border-red-200",
};

export function StatusBadge({
  status,
  label,
}: {
  status: string | null;
  /** Display text override (e.g. "Follow-up" for status value "follow_up"). */
  label?: string;
}) {
  const key = (status ?? "").toLowerCase();
  const cls = STATUS_STYLES[key] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}
    >
      {label ?? status ?? "—"}
    </span>
  );
}
