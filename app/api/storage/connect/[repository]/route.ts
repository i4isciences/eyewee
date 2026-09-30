import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAuthorizeUrl, OAuthNotConfiguredError } from "@/lib/storage/providers/oauth";
import { STORAGE_PROVIDERS } from "@/lib/storage/providers/registry";
import { isStorageRepository } from "@/lib/storage/providers/types";

const STATE_COOKIE = "eyewee_oauth_state";
const STATE_MAX_AGE_SECONDS = 60 * 10;

type RouteParams = { params: Promise<{ repository: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const { repository } = await params;
  if (!isStorageRepository(repository)) return NextResponse.json({ error: "Unknown repository." }, { status: 400 });

  const config = STORAGE_PROVIDERS[repository];
  const redirectUri = `${new URL(request.url).origin}/api/storage/callback/${repository}`;
  const state = crypto.randomUUID();

  try {
    const authorizeUrl = buildAuthorizeUrl(config, redirectUri, state);
    const store = await cookies();
    store.set(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: STATE_MAX_AGE_SECONDS,
      path: "/",
    });
    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    if (error instanceof OAuthNotConfiguredError) {
      return NextResponse.json(
        { error: `${repository} isn't connectable yet — ${error.message}`, repository },
        { status: 501 }
      );
    }
    throw error;
  }
}
