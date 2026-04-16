import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

const LOCAL_PATH = path.join(process.cwd(), "data", "doris.json");
const BLOB_NAME = "doris.json";

export async function POST() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN not configured" },
      { status: 400 }
    );
  }

  try {
    const raw = await fs.readFile(LOCAL_PATH, "utf-8");
    const data = JSON.parse(raw);

    await put(BLOB_NAME, JSON.stringify(data, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 0,
    });

    return NextResponse.json({ success: true, message: "Blob seeded from local doris.json" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
