// Lightweight audit logger.
//
// We used to persist audit entries to a Vercel Blob, but that burned through
// the free tier's op limit because every blocked request triggered a
// list+put pair. Now we only console.log, which is captured by Vercel's
// function logs (~30-day retention on Pro, queryable in the Logs UI).

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

/**
 * Emit an audit log line. Best-effort — never throws.
 *
 * Vercel function logs format: search for `[audit]` in the project's
 * Logs tab to filter. Each line is one structured event.
 */
export async function appendAuditEntry(entry: AuditEntry): Promise<void> {
  console.log(
    `[audit] ${entry.ts} outcome=${entry.outcome} ip=${entry.ip} ` +
      `method=${entry.method} path=${entry.pathname} ` +
      `country=${entry.country} ua="${entry.userAgent}" ` +
      `referer="${entry.referer}" ` +
      `bytes=${entry.bytes ?? "-"}` +
      (entry.error ? ` error="${entry.error}"` : ""),
  );
}
