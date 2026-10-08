import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { deleteLink } from "@/lib/postdocworksLink/link";

// Removes eyewee's record of the link only -- never touches the postdoc's actual postdocworks
// account, profile, or data.
export async function DELETE() {
  const { deviceId } = await getOrCreateDeviceId();
  await deleteLink(deviceId);
  return NextResponse.json({ success: true });
}
