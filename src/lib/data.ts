import fs from "fs/promises";
import path from "path";
import { put, list } from "@vercel/blob";

const LOCAL_PATH = path.join(process.cwd(), "data", "doris.json");
const BLOB_NAME = "doris.json";

function isBlobEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getVehicleData(): Promise<any> {
  if (!isBlobEnabled()) {
    const raw = await fs.readFile(LOCAL_PATH, "utf-8");
    return JSON.parse(raw);
  }

  // Look for existing blob
  const { blobs } = await list({ prefix: BLOB_NAME, limit: 1 });

  if (blobs.length > 0) {
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    return await res.json();
  }

  // Blob doesn't exist yet — seed from local file
  const raw = await fs.readFile(LOCAL_PATH, "utf-8");
  const data = JSON.parse(raw);
  await put(BLOB_NAME, JSON.stringify(data, null, 2), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function putVehicleData(data: any): Promise<void> {
  if (!isBlobEnabled()) {
    await fs.writeFile(LOCAL_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
    return;
  }

  await put(BLOB_NAME, JSON.stringify(data, null, 2), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });
}
