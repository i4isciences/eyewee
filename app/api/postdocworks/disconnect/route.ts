import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { deleteLink } from "@/lib/postdocworksLink/link";
import { replaceSourcedMemoryFacts } from "@/lib/eyewee/memory";
import { POSTDOCWORKS_MEMORY_SOURCE } from "@/lib/eyewee/postdocworks/syncMemory";

// Removes eyewee's record of the link only -- never touches the postdoc's actual postdocworks
// account, profile, or data. Also clears the memory facts synced from it (an empty replace), so
// disconnecting really means eyewee stops knowing those details, not just stops showing a card.
export async function DELETE() {
  const { deviceId } = await getOrCreateDeviceId();
  await deleteLink(deviceId);
  await replaceSourcedMemoryFacts(deviceId, POSTDOCWORKS_MEMORY_SOURCE, []);
  return NextResponse.json({ success: true });
}
