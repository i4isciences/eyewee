import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { verifyLinkToken } from "@/lib/postdocworksLink/token";
import { saveLink } from "@/lib/postdocworksLink/link";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  const verified = verifyLinkToken(token);
  if (!verified) return NextResponse.json({ error: "That link has expired or is invalid — try connecting again." }, { status: 400 });

  const { deviceId } = await getOrCreateDeviceId();
  await saveLink(deviceId, verified.userId);

  return NextResponse.redirect(new URL("/home?postdocworks_connected=1", url.origin));
}
