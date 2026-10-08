import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { getOrCreateDeviceProfile } from "@/lib/eyewee/tier/profile";
import { getUsagePercent } from "@/lib/eyewee/tier/usage";

export async function GET() {
  const { deviceId } = await getOrCreateDeviceId();
  const [profile, usagePercent] = await Promise.all([getOrCreateDeviceProfile(deviceId), getUsagePercent(deviceId)]);
  return NextResponse.json({ tier: profile.tier, usagePercent });
}
