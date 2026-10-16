import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { getLinkedPostdocworksUserId } from "@/lib/postdocworksLink/link";
import { getPostdocworksProfile } from "@/lib/eyewee/postdocworks/profile";
import { syncPostdocworksMemory } from "@/lib/eyewee/postdocworks/syncMemory";

// Manual re-sync -- e.g. after updating something on the postdocworks profile form. Re-reads the
// real tables and replaces the postdocworks-sourced memory facts (lib/eyewee/memory.ts's
// replaceSourcedMemoryFacts), so this never piles up duplicates on repeated use.
export async function POST() {
  const { deviceId } = await getOrCreateDeviceId();
  const linkedUserId = await getLinkedPostdocworksUserId(deviceId);
  if (!linkedUserId) return NextResponse.json({ error: "Not connected." }, { status: 400 });

  const profile = await getPostdocworksProfile(linkedUserId);
  if (!profile) return NextResponse.json({ error: "Couldn't load your postdocworks profile." }, { status: 502 });

  await syncPostdocworksMemory(deviceId, profile);
  return NextResponse.json({ success: true, profile });
}
