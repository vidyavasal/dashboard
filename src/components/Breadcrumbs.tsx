"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

// Breadcrumbs derived from the URL — one component in the admin layout gives
// every screen a correct trail. Unknown segments (opaque record ids) render
// as "Details".

const LABELS: Record<string, string> = {
  admin: "Home",
  dashboard: "Dashboard",
  analytics: "Site Analytics",
  visitor: "Visitor",
  leads: "Leads",
  profiles: "Student Profiles",
  students: "Admissions",
  invoices: "Invoices",
  print: "Print",
  content: "Content",
  universities: "Universities",
  courses: "Courses",
  blog: "Blog",
  staff: "Staff",
  commissions: "University Commissions",
  finance: "Finance",
  salaries: "Salaries",
  expenses: "Expenses",
  investments: "Investments",
  reports: "Reports",
  new: "New",
  import: "Import CSV",
  login: "Login",
};

// Segments that group routes but have no page of their own — not clickable.
const NO_PAGE = new Set(["finance", "content", "visitor"]);

export function Breadcrumbs() {
  const pathname = usePathname() ?? "/admin";
  const segments = pathname.split("/").filter(Boolean);

  // Only under /admin, and not on the login page.
  if (segments[0] !== "admin" || segments[1] === "login") return null;

  const crumbs = segments.map((seg, i) => ({
    label: LABELS[seg] ?? "Details",
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLink: i < segments.length - 1 && !NO_PAGE.has(seg),
  }));

  return (
    <nav aria-label="Breadcrumb" className="mb-4 print:hidden">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-text-secondary">
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-text-secondary/60" />}
            {c.isLink ? (
              <Link
                href={c.href}
                className="hover:text-text-primary hover:underline flex items-center gap-1"
              >
                {i === 0 && <Home className="h-3.5 w-3.5" />}
                {c.label}
              </Link>
            ) : (
              <span
                className={
                  i === crumbs.length - 1
                    ? "font-medium text-text-primary flex items-center gap-1"
                    : "flex items-center gap-1"
                }
              >
                {i === 0 && <Home className="h-3.5 w-3.5" />}
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
