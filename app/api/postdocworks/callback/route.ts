import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { verifyLinkToken } from "@/lib/postdocworksLink/token";
import { saveLink } from "@/lib/postdocworksLink/link";
import { getPostdocworksProfile } from "@/lib/eyewee/postdocworks/profile";
import { syncPostdocworksMemory } from "@/lib/eyewee/postdocworks/syncMemory";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  const verified = verifyLinkToken(token);
  if (!verified) return NextResponse.json({ error: "That link has expired or is invalid — try connecting again." }, { status: 400 });

  const { deviceId } = await getOrCreateDeviceId();
  await saveLink(deviceId, verified.userId);

  // Pull the real profile into Memory right away, so it's there the moment the postdoc lands
  // back on /home -- not deferred to the next chat message. A failure here shouldn't break the
  // connection itself (the link is already saved); the profile page can retry the sync.
  try {
    const profile = await getPostdocworksProfile(verified.userId);
    if (profile) await syncPostdocworksMemory(deviceId, profile);
  } catch {
    // non-fatal -- the connection succeeded even if the initial sync didn't
  }

  return NextResponse.redirect(new URL("/home?postdocworks_connected=1", url.origin));
}
