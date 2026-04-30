import fs from "fs/promises";
import path from "path";
import { kv } from "@vercel/kv";
import { unstable_cache, revalidateTag } from "next/cache";

const LOCAL_PATH = path.join(process.cwd(), "data", "doris.json");
const KV_KEY = "doris:vehicle-data";
const CACHE_TAG = "vehicle-data";

/**
 * KV is "enabled" only if BOTH of @vercel/kv's required env vars are present.
 * Vercel's marketplace flow sometimes injects Upstash-native names instead
 * (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN); if so, the project's
 * env mapping needs those translated to KV_REST_API_URL / KV_REST_API_TOKEN
 * via Vercel's "shared env vars" or by adding aliases manually.
 */
function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readFromFile(): Promise<any> {
  const raw = await fs.readFile(LOCAL_PATH, "utf-8");
  return JSON.parse(raw);
}

/**
 * Read the vehicle data. Cached forever (revalidate: false) — only goes
 * back to KV/disk when revalidateTag(CACHE_TAG) fires (after a successful
 * save) or on cold start. With ~few-dozen edits/month this means a handful
 * of actual KV reads per month, well inside the free tier.
 *
 * Defensive fallback: if KV throws (misconfigured env vars, network blip,
 * etc.), we serve the bundled data/doris.json. Better to show slightly
 * stale content than a 500.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getVehicleData = unstable_cache(
  async (): Promise<any> => {
    if (!isKvEnabled()) {
      return readFromFile();
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stored = await kv.get<any>(KV_KEY);
      if (stored) return stored;

      // KV reachable but empty — seed from the committed file.
      const seed = await readFromFile();
      try {
        await kv.set(KV_KEY, seed);
      } catch (err) {
        console.error("[data] KV seed write failed (serving from file):", err);
      }
      return seed;
    } catch (err) {
      console.error("[data] KV read failed (falling back to file):", err);
      return readFromFile();
    }
  },
  ["vehicle-data"],
  { tags: [CACHE_TAG], revalidate: false },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function putVehicleData(data: any): Promise<void> {
  if (!isKvEnabled()) {
    await fs.writeFile(LOCAL_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
    return;
  }

  await kv.set(KV_KEY, data);
  // Invalidate the unstable_cache wrapper so the next read returns the
  // fresh value from KV instead of the cached one.
  revalidateTag(CACHE_TAG);
}
