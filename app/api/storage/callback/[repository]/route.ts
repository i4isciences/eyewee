import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { saveStorageConnection } from "@/lib/eyewee/storageConnections";
import { exchangeCode } from "@/lib/storage/providers/oauth";
import { STORAGE_PROVIDERS } from "@/lib/storage/providers/registry";
import { isStorageRepository } from "@/lib/storage/providers/types";

const STATE_COOKIE = "eyewee_oauth_state";

type RouteParams = { params: Promise<{ repository: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const { repository } = await params;
  const url = new URL(request.url);
  if (!isStorageRepository(repository)) return NextResponse.json({ error: "Unknown repository." }, { status: 400 });

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const store = await cookies();
  const expectedState = store.get(STATE_COOKIE)?.value;
  store.delete(STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.json({ error: "OAuth state mismatch — please try connecting again." }, { status: 400 });
  }

  const config = STORAGE_PROVIDERS[repository];
  const redirectUri = `${url.origin}/api/storage/callback/${repository}`;

  try {
    const tokens = await exchangeCode(config, code, redirectUri);
    const { deviceId } = await getOrCreateDeviceId();
    await saveStorageConnection(deviceId, repository, tokens);
    return NextResponse.redirect(`${url.origin}/home?storage_connected=${repository}`);
  } catch {
    return NextResponse.redirect(`${url.origin}/home?storage_error=${repository}`);
  }
}
