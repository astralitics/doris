import { NextResponse } from "next/server";
import { putVehicleData } from "@/lib/data";

export const dynamic = "force-dynamic";

const REQUIRED_KEYS = [
  "vehicle",
  "story",
  "camperization",
  "electrical_12v",
  "electrical_230v",
  "plumbing",
  "heating",
  "included_equipment",
  "service_history",
  "quirks_and_notes",
  "faqs",
  "chatbot_config",
];

/**
 * One-shot migration helper. Fetches a JSON blob from a URL and writes it
 * to KV via putVehicleData. Used to bring the most recent Vercel Blob
 * snapshot into KV after the migration.
 *
 * Auth: relies on the admin cookie middleware on /api/admin/*. Hit this
 * while logged in.
 *
 * Usage:
 *   GET /api/admin/import-from-url?url=<encoded-blob-url>
 *
 * Safe to remove once the blob has been retired.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceUrl = searchParams.get("url");

  if (!sourceUrl) {
    return NextResponse.json(
      { error: "Missing ?url=<blob-url> query parameter" },
      { status: 400 },
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Tight allowlist: only fetch from Vercel-hosted blob domains. Prevents
  // this endpoint from being abused as an open URL fetcher.
  const host = parsed.hostname;
  const isVercelBlob =
    host.endsWith(".public.blob.vercel-storage.com") ||
    host.endsWith(".blob.vercel-storage.com");
  if (!isVercelBlob) {
    return NextResponse.json(
      { error: "URL must be a *.blob.vercel-storage.com host" },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    const res = await fetch(sourceUrl, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Source fetch failed: ${res.status} ${res.statusText}` },
        { status: 502 },
      );
    }
    body = await res.json();
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : `Failed to fetch ${sourceUrl}`,
      },
      { status: 502 },
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Source did not return a JSON object" },
      { status: 422 },
    );
  }

  const data = body as Record<string, unknown>;
  for (const key of REQUIRED_KEYS) {
    if (!(key in data)) {
      return NextResponse.json(
        { error: `Source missing required key: ${key}` },
        { status: 422 },
      );
    }
  }

  await putVehicleData(data);

  const summary = {
    success: true,
    importedFrom: sourceUrl,
    keysWritten: Object.keys(data),
    bytes: JSON.stringify(data).length,
    note: "Public site will reflect the imported data within seconds.",
  };
  console.log("[import-from-url] success", summary);
  return NextResponse.json(summary);
}
