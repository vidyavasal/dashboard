import { requireSession } from "@/lib/session";
import { PageHeader, ButtonLink, Card } from "@/components/ui";
import { LEAD_IMPORT_COLUMNS, LEAD_STATUSES, PROGRAM_LEVELS } from "@/lib/lead-status";
import { ImportForm } from "./ImportForm";

export const metadata = { title: "Import leads" };

export default async function ImportLeadsPage() {
  await requireSession();

  return (
    <>
      <PageHeader
        title="Import leads (CSV)"
        subtitle="Upload a CSV in the template format. Only name and phone are mandatory; bad rows are skipped and reported — nothing is half-imported."
        action={
          <ButtonLink href="/admin/leads/import/template" variant="ghost">
            ⬇ Download template
          </ButtonLink>
        }
      />

      <Card className="p-5 mb-4 text-sm text-text-secondary space-y-2">
        <p className="font-medium text-text-primary">CSV format</p>
        <p>
          Header row (column order doesn&apos;t matter, extra columns are
          ignored):
        </p>
        <code className="block bg-surface rounded-lg px-3 py-2 text-xs overflow-x-auto">
          {LEAD_IMPORT_COLUMNS.join(",")}
        </code>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>name</strong> and <strong>phone</strong> are mandatory —
            rows missing either are skipped.
          </li>
          <li>
            <strong>university</strong> / <strong>course</strong> are matched
            by name (case-insensitive). Unmatched names are reported and left
            blank.
          </li>
          <li>
            <strong>status</strong>:{" "}
            {LEAD_STATUSES.map((s) => s.value).join(", ")} (defaults to
            &quot;new&quot;).
          </li>
          <li>
            <strong>program_level</strong>:{" "}
            {PROGRAM_LEVELS.map((p) => p.value).join(", ")}.
          </li>
          <li>
            <strong>sex</strong>: male, female, other.{" "}
            <strong>follow_up_date</strong>: YYYY-MM-DD.
          </li>
        </ul>
      </Card>

      <ImportForm />
    </>
  );
}
