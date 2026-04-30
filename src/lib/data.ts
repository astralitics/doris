import fs from "fs/promises";
import path from "path";
import { kv } from "@vercel/kv";
import { unstable_cache, revalidateTag } from "next/cache";

const LOCAL_PATH = path.join(process.cwd(), "data", "doris.json");
const KV_KEY = "doris:vehicle-data";
const CACHE_TAG = "vehicle-data";

function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

/**
 * Read the vehicle data. Cached forever (revalidate: false) — only goes
 * back to KV/disk when revalidateTag(CACHE_TAG) is called from putVehicleData,
 * or on cold start. With ~few-dozen edits/month this means a handful of
 * actual KV reads per month, well inside the free tier.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getVehicleData = unstable_cache(
  async (): Promise<any> => {
    if (!isKvEnabled()) {
      const raw = await fs.readFile(LOCAL_PATH, "utf-8");
      return JSON.parse(raw);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stored = await kv.get<any>(KV_KEY);
    if (stored) return stored;

    // KV doesn't have the data yet — seed from the committed file.
    const raw = await fs.readFile(LOCAL_PATH, "utf-8");
    const data = JSON.parse(raw);
    await kv.set(KV_KEY, data);
    return data;
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
