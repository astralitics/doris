import { NextResponse } from "next/server";
import { readAuditEntries } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Admin-only audit log viewer. Gated by the basic-auth middleware on
 * /api/audit, same credential as /admin.
 *
 * Query params:
 *   ?limit=N        return only the most recent N entries (default: all)
 *   ?outcome=X      filter by outcome (saved, rate_limited, etc.)
 *   ?ip=X           filter by IP (substring match)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "0", 10);
  const outcomeFilter = url.searchParams.get("outcome");
  const ipFilter = url.searchParams.get("ip");

  let entries = await readAuditEntries();

  if (outcomeFilter) {
    entries = entries.filter((e) => e.outcome === outcomeFilter);
  }
  if (ipFilter) {
    entries = entries.filter((e) => e.ip.includes(ipFilter));
  }

  // Most recent first for human consumption
  entries = entries.slice().reverse();

  if (limit > 0) {
    entries = entries.slice(0, limit);
  }

  return NextResponse.json({
    count: entries.length,
    entries,
  });
}
