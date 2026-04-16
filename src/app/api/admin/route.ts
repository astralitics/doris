import { NextResponse } from "next/server";
import { getVehicleData, putVehicleData } from "@/lib/data";

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

export async function GET() {
  try {
    const data = await getVehicleData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to read data file" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    for (const key of REQUIRED_KEYS) {
      if (!(key in body)) {
        return NextResponse.json(
          { error: `Missing required key: ${key}` },
          { status: 400 }
        );
      }
    }

    await putVehicleData(body);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Admin PUT error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
