import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { getLinkedPostdocworksUserId } from "@/lib/postdocworksLink/link";
import { getPostdocworksProfile } from "@/lib/eyewee/postdocworks/profile";
import { getPapersByOrcid } from "@/lib/eyewee/postdocworks/papers";

export async function GET() {
  const { deviceId } = await getOrCreateDeviceId();
  const linkedUserId = await getLinkedPostdocworksUserId(deviceId);
  if (!linkedUserId) return NextResponse.json({ connected: false });

  const profile = await getPostdocworksProfile(linkedUserId);
  if (!profile) return NextResponse.json({ connected: false });

  let papers: Awaited<ReturnType<typeof getPapersByOrcid>> = [];
  if (profile.orcid && profile.orcidVerified) {
    papers = await getPapersByOrcid(profile.orcid).catch(() => []);
  }

  return NextResponse.json({ connected: true, profile, papers });
}
