import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intl = createMiddleware(routing);

/**
 * Basic-auth gate for admin routes. Browsers handle this natively — the
 * 401 + WWW-Authenticate header pops a username/password prompt with no
 * login page or session cookies needed.
 *
 * The username is ignored (any value); only the password is checked
 * against the ADMIN_PASSWORD env var.
 *
 * Fail closed: if ADMIN_PASSWORD is not set, return 503. Local dev needs
 * to set it in .env.local. No NODE_ENV/VERCEL_ENV escape hatches — they
 * have proven unreliable across deploy pipelines.
 */
function checkAdminAuth(req: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    console.error("[admin-auth] ADMIN_PASSWORD not configured at runtime");
    return new NextResponse("Admin access not configured", {
      status: 503,
      headers: { "x-admin-auth": "no-env-var" },
    });
  }

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const colon = decoded.indexOf(":");
      const pass = colon >= 0 ? decoded.slice(colon + 1) : "";
      if (pass === expected) return null;
    } catch {
      // fall through to 401
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Doris Admin", charset="UTF-8"',
      "x-admin-auth": "challenge",
    },
  });
}

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const isAdminPath =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/audit") ||
    pathname.startsWith("/api/seed");

  if (isAdminPath) {
    const blocked = checkAdminAuth(req);
    if (blocked) return blocked;
    const ok = NextResponse.next();
    ok.headers.set("x-admin-auth", "ok");
    return ok;
  }

  // Non-admin API routes don't need locale routing
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel")
  ) {
    return NextResponse.next();
  }

  return intl(req);
}

export const config = {
  // Explicit matchers per route family. Previous single big-regex matcher
  // intermittently failed to invoke middleware on /admin and /api/admin
  // on Vercel. Multiple explicit matchers are more robust.
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin",
    "/api/admin/:path*",
    "/api/audit",
    "/api/audit/:path*",
    "/api/seed",
    "/api/seed/:path*",
    // Public locale routing — everything except api, _next, _vercel, and files
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
