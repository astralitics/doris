// Cookie-based admin auth. Edge-runtime safe (uses Web Crypto).
//
// Cookie value = SHA-256(ADMIN_PASSWORD + ":authenticated").
// Changing ADMIN_PASSWORD automatically invalidates existing sessions.

export const AUTH_COOKIE = "doris_admin";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function expectedCookieValue(password: string): Promise<string> {
  return sha256Hex(password + ":authenticated");
}

export async function isAuthed(cookieValue: string | undefined): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    // In dev, allow through when no password is configured.
    return process.env.NODE_ENV !== "production";
  }
  if (!cookieValue) return false;
  const expected = await expectedCookieValue(password);
  return timingSafeEqual(cookieValue, expected);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
