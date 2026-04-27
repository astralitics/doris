import { put, list } from "@vercel/blob";

const AUDIT_BLOB_NAME = "doris-audit.json";
const MAX_ENTRIES = 1000;

export type AuditOutcome =
  | "saved"
  | "rate_limited"
  | "validation_failed"
  | "save_failed";

export interface AuditEntry {
  ts: string;
  ip: string;
  userAgent: string;
  referer: string;
  country: string;
  method: string;
  pathname: string;
  outcome: AuditOutcome;
  bytes?: number;
  error?: string;
}

interface AuditFile {
  entries: AuditEntry[];
}

function isBlobEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

/**
 * Append an audit entry to the audit blob. Best-effort — never throws to the
 * caller, since auditing failure should not break the underlying request.
 */
export async function appendAuditEntry(entry: AuditEntry): Promise<void> {
  // Always log to Vercel function logs as a baseline, regardless of blob status
  console.log(
    `[audit] ${entry.ts} outcome=${entry.outcome} ip=${entry.ip} ` +
      `ua="${entry.userAgent}" referer="${entry.referer}" ` +
      `bytes=${entry.bytes ?? "-"}${entry.error ? ` error="${entry.error}"` : ""}`,
  );

  if (!isBlobEnabled()) return;

  try {
    let entries: AuditEntry[] = [];
    const { blobs } = await list({ prefix: AUDIT_BLOB_NAME, limit: 1 });
    if (blobs.length > 0) {
      const res = await fetch(blobs[0].url, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as Partial<AuditFile>;
        entries = Array.isArray(data?.entries) ? data.entries : [];
      }
    }

    entries.push(entry);
    if (entries.length > MAX_ENTRIES) {
      entries = entries.slice(-MAX_ENTRIES);
    }

    await put(
      AUDIT_BLOB_NAME,
      JSON.stringify({ entries }, null, 2),
      {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      },
    );
  } catch (err) {
    console.error("[audit] failed to persist entry", err);
  }
}

/**
 * Read all audit entries (best-effort). Returns oldest first.
 */
export async function readAuditEntries(): Promise<AuditEntry[]> {
  if (!isBlobEnabled()) return [];
  try {
    const { blobs } = await list({ prefix: AUDIT_BLOB_NAME, limit: 1 });
    if (blobs.length === 0) return [];
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as Partial<AuditFile>;
    return Array.isArray(data?.entries) ? data.entries : [];
  } catch {
    return [];
  }
}
