import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifyJWT } from "./src/lib/auth";
import { normalizeRole } from "./src/lib/roles";

// Finance + org admin — owners only.
const OWNER_ONLY_PREFIXES = [
  "/admin/finance",
  "/admin/staff",
  "/admin/commissions",
  "/admin/dashboard",
  "/admin/reports",
];

// Content + invoicing — owners and hired `staff`, but NOT `sales`.
const STAFF_PLUS_PREFIXES = ["/admin/content", "/admin/invoices"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The login page itself must stay public.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyJWT(token) : null;

  if (!payload) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const role = normalizeRole(payload.role);

  const deny = () => {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/students";
    url.searchParams.set("error", "forbidden");
    return NextResponse.redirect(url);
  };

  const hitsOwnerOnly = OWNER_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
  const hitsStaffPlus = STAFF_PLUS_PREFIXES.some((p) => pathname.startsWith(p));

  if (role === "sales" && (hitsOwnerOnly || hitsStaffPlus)) return deny();
  if (role === "staff" && hitsOwnerOnly) return deny();

  return NextResponse.next();
}

export const config = {
  // Guard everything under /admin except the login page (handled above).
  matcher: ["/admin/:path*"],
};
