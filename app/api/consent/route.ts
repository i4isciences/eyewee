import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { hasConsented, recordConsent } from "@/lib/eyewee/consent";

export async function GET() {
  const { deviceId } = await getOrCreateDeviceId();
  return NextResponse.json({ consented: await hasConsented(deviceId) });
}

export async function POST() {
  const { deviceId } = await getOrCreateDeviceId();
  await recordConsent(deviceId);
  return NextResponse.json({ success: true });
}
