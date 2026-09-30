import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { listStorageConnections } from "@/lib/eyewee/storageConnections";
import { STORAGE_REPOSITORIES } from "@/lib/storage/providers/types";

export async function GET() {
  const { deviceId } = await getOrCreateDeviceId();
  const connections = await listStorageConnections(deviceId);
  const connectedSet = new Set(connections.map((c) => c.repository));

  const rows = STORAGE_REPOSITORIES.map((repository) => {
    const connection = connections.find((c) => c.repository === repository);
    return {
      repository,
      connected: connectedSet.has(repository),
      externalAccountLabel: connection?.externalAccountLabel ?? null,
      connectedAt: connection?.connectedAt ?? null,
    };
  });

  return NextResponse.json({ connections: rows });
}
