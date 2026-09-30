import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { listMemoryFacts } from "@/lib/eyewee/memory";

export async function GET() {
  const { deviceId } = await getOrCreateDeviceId();
  const facts = await listMemoryFacts(deviceId);
  return NextResponse.json({ facts });
}
