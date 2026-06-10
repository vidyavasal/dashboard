import Link from "next/link";

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/** Clamp + parse `page` / `per` search params. */
export function parsePagination(sp: Record<string, string | string[] | undefined>) {
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const page = Math.max(1, parseInt(first(sp.page) ?? "1", 10) || 1);
  const perRaw = parseInt(first(sp.per) ?? "", 10);
  const pageSize = PAGE_SIZE_OPTIONS.includes(perRaw)
    ? perRaw
    : DEFAULT_PAGE_SIZE;
  return { page, pageSize };
}

function pageHref(
  basePath: string,
  params: Record<string, string | undefined>,
  page: number
) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  if (page > 1) qs.set("page", String(page));
  else qs.delete("page");
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

/**
 * Server-rendered pagination bar: "Showing X–Y of Z" + numbered links.
 * `params` are the current filters (everything except `page`), preserved
 * across page changes.
 */
export function Pagination({
  basePath,
  params,
  page,
  pageSize,
  total,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  pageSize: number;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Compact page list: 1 … (p-1) p (p+1) … last
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  const linkCls =
    "inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-lg text-sm border transition-colors";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
      <p className="text-sm text-text-secondary">
        Showing <span className="font-medium">{from}</span>–
        <span className="font-medium">{to}</span> of{" "}
        <span className="font-medium">{total}</span>
      </p>
      {totalPages > 1 && (
        <nav className="flex items-center gap-1">
          {page > 1 ? (
            <Link
              href={pageHref(basePath, params, page - 1)}
              className={`${linkCls} border-border text-text-primary hover:bg-surface`}
            >
              ‹ Prev
            </Link>
          ) : (
            <span className={`${linkCls} border-border text-text-secondary/50`}>
              ‹ Prev
            </span>
          )}
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-text-secondary">
                …
              </span>
            ) : (
              <Link
                key={p}
                href={pageHref(basePath, params, p)}
                className={`${linkCls} ${
                  p === page
                    ? "border-primary bg-primary text-white"
                    : "border-border text-text-primary hover:bg-surface"
                }`}
              >
                {p}
              </Link>
            )
          )}
          {page < totalPages ? (
            <Link
              href={pageHref(basePath, params, page + 1)}
              className={`${linkCls} border-border text-text-primary hover:bg-surface`}
            >
              Next ›
            </Link>
          ) : (
            <span className={`${linkCls} border-border text-text-secondary/50`}>
              Next ›
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
