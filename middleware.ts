import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifyJWT } from "./src/lib/auth";
import { normalizeRole } from "./src/lib/roles";

// Routes that finance-restricted (`sales`) users must never reach.
const OWNER_ONLY_PREFIXES = [
  "/admin/finance",
  "/admin/staff",
  "/admin/commissions",
  "/admin/dashboard",
  "/admin/reports",
];

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

  if (role === "sales" && OWNER_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/students";
    url.searchParams.set("error", "forbidden");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Guard everything under /admin except the login page (handled above).
  matcher: ["/admin/:path*"],
};
