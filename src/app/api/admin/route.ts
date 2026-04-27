import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getVehicleData, putVehicleData } from "@/lib/data";
import { checkRateLimit } from "@/lib/rateLimit";
import { appendAuditEntry, type AuditOutcome } from "@/lib/audit";

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

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

interface RequestMeta {
  ip: string;
  userAgent: string;
  referer: string;
  country: string;
  method: string;
  pathname: string;
}

function extractMeta(request: Request): RequestMeta {
  const h = request.headers;
  const fwd = h.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const url = new URL(request.url);
  return {
    ip,
    userAgent: h.get("user-agent") || "unknown",
    referer: h.get("referer") || "unknown",
    country: h.get("x-vercel-ip-country") || "unknown",
    method: request.method,
    pathname: url.pathname,
  };
}

async function audit(
  meta: RequestMeta,
  outcome: AuditOutcome,
  extra: { bytes?: number; error?: string } = {},
) {
  await appendAuditEntry({
    ts: new Date().toISOString(),
    ...meta,
    outcome,
    ...extra,
  });
}

export async function GET() {
  try {
    const data = await getVehicleData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to read data file" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const meta = extractMeta(request);

  // Rate limit per-IP. Combined with the basic-auth gate in middleware,
  // this is belt-and-suspenders against a credential-leaked attacker.
  const rl = checkRateLimit(`admin:${meta.ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!rl.allowed) {
    await audit(meta, "rate_limited");
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Try again in ${Math.ceil(rl.resetMs / 1000)}s.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(rl.resetMs / 1000).toString(),
        },
      },
    );
  }

  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch (err) {
    await audit(meta, "validation_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(bodyText);
  } catch {
    await audit(meta, "validation_failed", {
      bytes: bodyText.length,
      error: "Body is not valid JSON",
    });
    return NextResponse.json({ error: "Body is not valid JSON" }, { status: 400 });
  }

  for (const key of REQUIRED_KEYS) {
    if (!(key in body)) {
      await audit(meta, "validation_failed", {
        bytes: bodyText.length,
        error: `Missing required key: ${key}`,
      });
      return NextResponse.json(
        { error: `Missing required key: ${key}` },
        { status: 400 },
      );
    }
  }

  try {
    await putVehicleData(body);
    revalidatePath("/", "layout");
    await audit(meta, "saved", { bytes: bodyText.length });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Admin PUT error:", error);
    await audit(meta, "save_failed", { bytes: bodyText.length, error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
