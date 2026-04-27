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
 * Fails CLOSED in any non-dev environment when the password isn't set
 * (returns 503). Only `next dev` (NODE_ENV === "development") allows
 * through unauthenticated when the env var is missing.
 */
function checkAdminAuth(req: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    if (process.env.NODE_ENV === "development") {
      return null;
    }
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
    // Authenticated — pass through and tag the response so we can see
    // that the middleware actually ran in production.
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
  // Match everything except static assets. The function decides whether
  // to apply auth, i18n, or pass through.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|woff2?|css|js|map)).*)",
  ],
};
