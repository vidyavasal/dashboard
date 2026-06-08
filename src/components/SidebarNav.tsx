"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/roles";

interface NavItem {
  href: string;
  label: string;
  ownerOnly?: boolean;
  section?: string;
}

const ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", ownerOnly: true },
  { href: "/admin/students", label: "Admissions" },
  { href: "/admin/staff", label: "Staff", ownerOnly: true },
  { href: "/admin/commissions", label: "University Commissions", ownerOnly: true },
  { href: "/admin/finance/salaries", label: "Salaries", ownerOnly: true, section: "Finance" },
  { href: "/admin/finance/expenses", label: "Expenses", ownerOnly: true, section: "Finance" },
  { href: "/admin/finance/investments", label: "Investments", ownerOnly: true, section: "Finance" },
  { href: "/admin/reports", label: "Reports", ownerOnly: true, section: "Finance" },
];

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const visible = ITEMS.filter((i) => !i.ownerOnly || role === "owner");

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
