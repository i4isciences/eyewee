import "server-only";

import type { ExchangedTokens, OAuthProviderConfig } from "@/lib/storage/providers/types";

export class OAuthNotConfiguredError extends Error {
  constructor(config: OAuthProviderConfig) {
    super(`Missing ${config.clientIdEnvVar}/${config.clientSecretEnvVar} — this vendor's OAuth app hasn't been registered yet.`);
    this.name = "OAuthNotConfiguredError";
  }
}

function readCredentials(config: OAuthProviderConfig): { clientId: string; clientSecret: string } {
  const clientId = process.env[config.clientIdEnvVar];
  const clientSecret = process.env[config.clientSecretEnvVar];
  if (!clientId || !clientSecret) throw new OAuthNotConfiguredError(config);
  return { clientId, clientSecret };
}

export function buildAuthorizeUrl(config: OAuthProviderConfig, redirectUri: string, state: string): string {
  const { clientId } = readCredentials(config);
  const url = new URL(config.authorizeUrl);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  if (config.scope) url.searchParams.set("scope", config.scope);
  return url.toString();
}

// Standard OAuth2 authorization-code exchange. `accountLabel` extraction is vendor-specific in
// principle (each vendor's token response / a follow-up "who am I" call shapes it differently) --
// this reads the handful of common field names vendors use for a human-readable identity and falls
// back to a generic label rather than guessing at a vendor's exact profile endpoint before any
// vendor is actually registered and testable end to end.
export async function exchangeCode(config: OAuthProviderConfig, code: string, redirectUri: string): Promise<ExchangedTokens> {
  const { clientId, clientSecret } = readCredentials(config);

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) throw new Error(`Token exchange failed (${response.status}).`);
  const data = (await response.json()) as Record<string, unknown>;

  const accessToken = data.access_token as string | undefined;
  if (!accessToken) throw new Error("Token exchange response had no access_token.");

  const accountLabel =
    (data.username as string | undefined) ??
    (data.email as string | undefined) ??
    (data.account_id ? `Account ${data.account_id}` : "Connected account");

  return { accessToken, refreshToken: data.refresh_token as string | undefined, accountLabel };
}
