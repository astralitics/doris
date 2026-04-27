import { NextResponse } from "next/server";
import { AUTH_COOKIE, COOKIE_MAX_AGE, expectedCookieValue } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD not configured on the server" },
      { status: 503 },
    );
  }

  let submitted = "";
  try {
    const body = await request.json();
    submitted = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Dev convenience: if no password is set, accept anything.
  if (!password) {
    const res = NextResponse.json({ success: true });
    res.cookies.set(AUTH_COOKIE, await expectedCookieValue("dev"), cookieOpts());
    return res;
  }

  if (submitted !== password) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(AUTH_COOKIE, await expectedCookieValue(password), cookieOpts());
  return res;
}

function cookieOpts() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}
