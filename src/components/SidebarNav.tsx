"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/roles";

interface NavItem {
  href: string;
  label: string;
  roles: Role[];
  section?: string;
}

const ALL: Role[] = ["owner", "staff", "sales"];
const STAFF_PLUS: Role[] = ["owner", "staff"];
const OWNER: Role[] = ["owner"];

const ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", roles: OWNER },
  { href: "/admin/students", label: "Admissions", roles: ALL },
  { href: "/admin/invoices", label: "Invoices", roles: STAFF_PLUS },
  { href: "/admin/content/universities", label: "Universities", roles: STAFF_PLUS, section: "Content" },
  { href: "/admin/content/courses", label: "Courses", roles: STAFF_PLUS, section: "Content" },
  { href: "/admin/content/blog", label: "Blog", roles: STAFF_PLUS, section: "Content" },
  { href: "/admin/staff", label: "Staff", roles: OWNER, section: "Business" },
  { href: "/admin/commissions", label: "University Commissions", roles: OWNER, section: "Business" },
  { href: "/admin/finance/salaries", label: "Salaries", roles: OWNER, section: "Finance" },
  { href: "/admin/finance/expenses", label: "Expenses", roles: OWNER, section: "Finance" },
  { href: "/admin/finance/investments", label: "Investments", roles: OWNER, section: "Finance" },
  { href: "/admin/reports", label: "Reports", roles: OWNER, section: "Finance" },
];

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const visible = ITEMS.filter((i) => i.roles.includes(role));

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
      {visible.map((item, idx) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        // Show a section heading the first time a new section appears.
        const showSection =
          !!item.section && item.section !== visible[idx - 1]?.section;
        return (
          <div key={item.href}>
            {showSection && (
              <div className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {item.section}
              </div>
            )}
            <Link
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-light text-primary"
                  : "text-text-primary hover:bg-surface"
              }`}
            >
              {item.label}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
