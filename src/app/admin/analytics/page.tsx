import Link from "next/link";
import { requireRole } from "@/lib/session";
import {
  getAnalyticsTotals,
  getDailyTrend,
  getTopUniversities,
  getTopCourses,
  getTrafficSources,
  getGeoBreakdown,
  getDeviceBreakdown,
  getRecentLeads,
  getLeadFunnel,
} from "@/lib/db/analytics";
import { PageHeader, Card, Table, Th, Td, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-wide text-text-secondary">{label}</div>
      <div className="mt-1 text-2xl font-bold text-text-primary">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-text-secondary">{sub}</div>}
    </Card>
  );
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-surface">
      <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

const n = (v: number) => v.toLocaleString("en-IN");

export default async function AnalyticsPage() {
  await requireRole("owner");

  const [
    totals,
    trend,
    topUnis,
    topCourses,
    sources,
    geo,
    devices,
    recentLeads,
    funnel,
  ] = await Promise.all([
    getAnalyticsTotals(),
    getDailyTrend(30),
    getTopUniversities(10),
    getTopCourses(10),
    getTrafficSources(8),
    getGeoBreakdown(8),
    getDeviceBreakdown(),
    getRecentLeads(25),
    getLeadFunnel(),
  ]);

  const trendMax = Math.max(1, ...trend.map((t) => t.views));
  const uniMax = Math.max(1, ...topUnis.map((u) => u.views));
  const courseMax = Math.max(1, ...topCourses.map((c) => c.views));
  const funnelMax = Math.max(1, funnel.visitors);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Analytics"
        subtitle="Visitor traffic, course/fee interest and lead conversion from vidyavasal.com"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Unique Visitors" value={n(totals.visitors)} sub={`${n(totals.newVisitors30d)} new in 30d`} />
        <Kpi label="Page Views" value={n(totals.pageViews)} sub={`${n(totals.visits)} sessions`} />
        <Kpi label="Fee-page Views" value={n(totals.feeViews)} sub="high-intent" />
        <Kpi label="Leads" value={n(totals.leads)} sub={`${totals.leadConversion}% conversion`} />
      </div>

      {/* Funnel */}
      <Card className="p-5">
        <div className="mb-4 text-sm font-semibold text-text-primary">Lead Funnel</div>
        <div className="space-y-3">
          {[
            { label: "Visitors", value: funnel.visitors },
            { label: "Viewed fees", value: funnel.feeViewers },
            { label: "Submitted lead", value: funnel.leads },
            { label: "Converted", value: funnel.converted },
          ].map((step) => (
            <div key={step.label} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-sm text-text-secondary">{step.label}</div>
              <Bar value={step.value} max={funnelMax} />
              <div className="w-16 shrink-0 text-right text-sm font-medium text-text-primary">{n(step.value)}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* 30-day trend */}
      <Card className="p-5">
        <div className="mb-4 text-sm font-semibold text-text-primary">Last 30 days</div>
        {trend.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-secondary">No traffic recorded yet.</div>
        ) : (
          <div className="flex h-32 items-end gap-1">
            {trend.map((t) => (
              <div key={t.day} className="group relative flex-1" title={`${t.day}: ${t.views} views, ${t.visitors} visitors`}>
                <div
                  className="w-full rounded-t bg-primary/80 transition-colors group-hover:bg-primary"
                  style={{ height: `${Math.max(4, (t.views / trendMax) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top universities */}
        <Card className="p-5">
          <div className="mb-4 text-sm font-semibold text-text-primary">Top Universities</div>
          <div className="space-y-3">
            {topUnis.length === 0 && <div className="text-sm text-text-secondary">No views yet.</div>}
            {topUnis.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="w-40 shrink-0 truncate text-sm text-text-primary">{u.name}</div>
                <Bar value={u.views} max={uniMax} />
                <div className="w-12 shrink-0 text-right text-sm font-medium">{n(u.views)}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top courses */}
        <Card className="p-5">
          <div className="mb-4 text-sm font-semibold text-text-primary">Top Courses (with fee views)</div>
          <div className="space-y-3">
            {topCourses.length === 0 && <div className="text-sm text-text-secondary">No views yet.</div>}
            {topCourses.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-40 shrink-0 truncate text-sm text-text-primary">{c.name}</div>
                <Bar value={c.views} max={courseMax} />
                <div className="w-20 shrink-0 text-right text-xs">
                  <span className="font-medium">{n(c.views)}</span>
                  <span className="text-text-secondary"> · {n(c.feeViews)} fee</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Traffic sources */}
        <Card className="p-5">
          <div className="mb-4 text-sm font-semibold text-text-primary">Traffic Sources</div>
          <div className="space-y-2">
            {sources.map((s) => (
              <div key={s.source} className="flex items-center justify-between text-sm">
                <span className="text-text-primary">{s.source}</span>
                <span className="text-text-secondary">{n(s.visitors)} visitors · {n(s.leads)} leads</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Geo + device */}
        <Card className="p-5">
          <div className="mb-4 text-sm font-semibold text-text-primary">Visitors by Country & Device</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {geo.map((g) => (
                <div key={g.country} className="flex items-center justify-between text-sm">
                  <span className="text-text-primary">{g.country}</span>
                  <span className="text-text-secondary">{n(g.visitors)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {devices.map((d) => (
                <div key={d.device} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-text-primary">{d.device}</span>
                  <span className="text-text-secondary">{n(d.visitors)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent leads — "who visited" */}
      <div>
        <div className="mb-3 text-sm font-semibold text-text-primary">Recent Leads</div>
        <Table
          isEmpty={recentLeads.length === 0}
          empty="No leads captured yet."
          head={
            <>
              <Th>Name</Th>
              <Th>Phone</Th>
              <Th>Interest</Th>
              <Th>Source</Th>
              <Th>Status</Th>
              <Th>When</Th>
              <Th />
            </>
          }
        >
          {recentLeads.map((l) => (
            <tr key={l.id} className="hover:bg-surface/50">
              <Td>{l.name ?? "—"}</Td>
              <Td>{l.phone ?? "—"}</Td>
              <Td>{l.courseName ?? l.universityName ?? "—"}</Td>
              <Td>{l.source ?? "—"}</Td>
              <Td><StatusBadge status={l.status} /></Td>
              <Td>{formatDate(l.createdAt)}</Td>
              <Td align="right">
                {l.visitorId && (
                  <Link href={`/admin/analytics/visitor/${l.visitorId}`} className="text-primary hover:underline">
                    Journey →
                  </Link>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}
