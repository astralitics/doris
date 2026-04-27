import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { AUTH_COOKIE, isAuthed } from "@/lib/auth";

const intl = createMiddleware(routing);

/**
 * Cookie-based admin auth + i18n routing.
 *
 * Admin paths (/admin, /api/admin, /api/audit, /api/seed) require a
 * signed cookie. Without it, /admin redirects to /admin/login, and
 * /api/* returns 401 JSON.
 *
 * The login page itself (/admin/login) and the login API (/api/login)
 * are public so users can authenticate.
 */
export const config = {
  // Note: middleware.ts must live INSIDE src/ when the project uses a
  // src/ directory, or Next.js silently won't load it on Vercel.
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/audit/:path*",
    "/api/seed/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Login page itself must stay reachable without auth.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi =
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/audit") ||
    pathname.startsWith("/api/seed");

  if (isAdminPage || isAdminApi) {
    const cookie = req.cookies.get(AUTH_COOKIE)?.value;
    if (await isAuthed(cookie)) {
      const ok = NextResponse.next();
      ok.headers.set("x-admin-auth", "ok");
      return ok;
    }

    if (isAdminPage) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      const redirect = NextResponse.redirect(url);
      redirect.headers.set("x-admin-auth", "redirect");
      return redirect;
    }

    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "x-admin-auth": "challenge" } },
    );
  }

  // Non-admin routes: skip locale routing for /api and Next internals,
  // apply i18n to everything else.
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel")
  ) {
    return NextResponse.next();
  }

  return intl(req);
}
