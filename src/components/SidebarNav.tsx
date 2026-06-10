"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  UserPlus,
  ContactRound,
  GraduationCap,
  Receipt,
  Building2,
  BookOpen,
  Newspaper,
  Briefcase,
  Percent,
  Wallet,
  TrendingDown,
  PiggyBank,
  FilePieChart,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/roles";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  section?: string;
}

const ALL: Role[] = ["owner", "staff", "sales"];
const STAFF_PLUS: Role[] = ["owner", "staff"];
const OWNER: Role[] = ["owner"];

const ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: OWNER },
  { href: "/admin/analytics", label: "Site Analytics", icon: BarChart3, roles: OWNER },
  { href: "/admin/leads", label: "Leads", icon: UserPlus, roles: ALL, section: "Students" },
  { href: "/admin/profiles", label: "Student Profiles", icon: ContactRound, roles: ALL, section: "Students" },
  { href: "/admin/students", label: "Admissions", icon: GraduationCap, roles: ALL, section: "Students" },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt, roles: STAFF_PLUS, section: "Students" },
  { href: "/admin/content/universities", label: "Universities", icon: Building2, roles: STAFF_PLUS, section: "Content" },
  { href: "/admin/content/courses", label: "Courses", icon: BookOpen, roles: STAFF_PLUS, section: "Content" },
  { href: "/admin/content/blog", label: "Blog", icon: Newspaper, roles: STAFF_PLUS, section: "Content" },
  { href: "/admin/staff", label: "Staff", icon: Briefcase, roles: OWNER, section: "Business" },
  { href: "/admin/commissions", label: "University Commissions", icon: Percent, roles: OWNER, section: "Business" },
  { href: "/admin/finance/salaries", label: "Salaries", icon: Wallet, roles: OWNER, section: "Finance" },
  { href: "/admin/finance/expenses", label: "Expenses", icon: TrendingDown, roles: OWNER, section: "Finance" },
  { href: "/admin/finance/investments", label: "Investments", icon: PiggyBank, roles: OWNER, section: "Finance" },
  { href: "/admin/reports", label: "Reports", icon: FilePieChart, roles: OWNER, section: "Finance" },
];

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const visible = ITEMS.filter((i) => i.roles.includes(role));

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {visible.map((item, idx) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        // Show a section heading the first time a new section appears.
        const showSection =
          !!item.section && item.section !== visible[idx - 1]?.section;
        const Icon = item.icon;
        return (
          <div key={item.href}>
            {showSection && (
              <div className="px-3 pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-secondary/80">
                {item.section}
              </div>
            )}
            <Link
              href={item.href}
              className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 mb-0.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-light text-primary shadow-[inset_2.5px_0_0_0_var(--color-primary)]"
                  : "text-text-primary/80 hover:bg-surface hover:text-text-primary"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  active
                    ? "text-primary"
                    : "text-text-secondary group-hover:text-text-primary"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
