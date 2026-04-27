// Simple in-memory sliding-window rate limiter.
// Lives at module scope so it persists across requests within a warm
// Vercel function instance. Cold starts reset the bucket — combined with
// the basic-auth gate, this is good enough for the admin API. For stricter
// guarantees use @vercel/kv or Upstash Redis.

const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const existing = buckets.get(key) ?? [];
  const fresh = existing.filter((t) => t > cutoff);

  if (fresh.length >= max) {
    buckets.set(key, fresh);
    const oldest = fresh[0];
    return { allowed: false, remaining: 0, resetMs: oldest + windowMs - now };
  }

  fresh.push(now);
  buckets.set(key, fresh);
  return {
    allowed: true,
    remaining: max - fresh.length,
    resetMs: windowMs,
  };
}
