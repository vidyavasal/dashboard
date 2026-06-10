import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { getLeadJourney } from "@/lib/db/analytics";
import { PageHeader, Card, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function VisitorJourneyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("owner");
  const { id } = await params;
  const { profile, history, leads } = await getLeadJourney(id);
  if (!profile) notFound();

  const field = (label: string, value: React.ReactNode) => (
    <div>
      <div className="text-xs uppercase tracking-wide text-text-secondary">{label}</div>
      <div className="mt-0.5 text-sm text-text-primary">{value || "—"}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Visitor Journey" subtitle="Anonymous browsing history linked to this lead" />
      <Link href="/admin/analytics" className="text-sm text-primary hover:underline">← Back to analytics</Link>

      <Card className="p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {field("Country", profile.country)}
          {field("City", profile.city)}
          {field("Device", profile.device)}
          {field("Browser", `${profile.browser ?? "—"} / ${profile.os ?? "—"}`)}
          {field("First seen", formatDate(profile.firstSeen))}
          {field("Last seen", formatDate(profile.lastSeen))}
          {field("Visits", String(profile.visitCount ?? 1))}
          {field("Source", profile.utmSource ?? "direct/organic")}
          {field("Landing page", profile.landingPath)}
          {field("Referrer", profile.referrer)}
        </div>
      </Card>

      {leads.length > 0 && (
        <Card className="p-5">
          <div className="mb-3 text-sm font-semibold text-text-primary">Enquiries</div>
          <div className="space-y-2">
            {leads.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-sm">
                <span className="text-text-primary">
                  {l.name ?? "—"} · {l.phone ?? "—"} {l.email ? `· ${l.email}` : ""}
                </span>
                <span className="flex items-center gap-2 text-text-secondary">
                  {l.source} <StatusBadge status={l.status} /> {formatDate(l.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="mb-4 text-sm font-semibold text-text-primary">
          Page-view history ({history.length})
        </div>
        <ol className="relative space-y-3 border-l border-border pl-5">
          {history.map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[1.4rem] top-1.5 h-2 w-2 rounded-full bg-primary" />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-text-primary">
                  {h.event !== "page_view" && (
                    <span className="mr-2 rounded bg-primary-light px-1.5 py-0.5 text-xs font-medium text-primary">
                      {h.event}
                    </span>
                  )}
                  {h.path}
                </span>
                <span className="shrink-0 text-xs text-text-secondary">{formatDate(h.createdAt)}</span>
              </div>
            </li>
          ))}
          {history.length === 0 && (
            <li className="text-sm text-text-secondary">No page views recorded.</li>
          )}
        </ol>
      </Card>
    </div>
  );
}
