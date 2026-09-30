import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { deleteStorageConnection } from "@/lib/eyewee/storageConnections";
import { isStorageRepository } from "@/lib/storage/providers/types";

type RouteParams = { params: Promise<{ repository: string }> };

// Removes eyewee's stored link only. Never calls the vendor: disconnecting removes eyewee's
// record of the connection, not the postdoc's actual deposits at Zenodo/OSF/Dryad/Figshare.
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { repository } = await params;
  if (!isStorageRepository(repository)) return NextResponse.json({ error: "Unknown repository." }, { status: 400 });

  const { deviceId } = await getOrCreateDeviceId();
  await deleteStorageConnection(deviceId, repository);
  return NextResponse.json({ success: true });
}
