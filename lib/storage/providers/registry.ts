import type { OAuthProviderConfig, StorageRepository } from "@/lib/storage/providers/types";

// Real, verified endpoint URLs for each vendor's OAuth2 authorization-code flow (checked live
// 2026-09-28 -- zenodo/osf/dryad respond with a real authorize redirect; figshare's authorize page
// sits behind an AWS WAF bot challenge but its token endpoint responds 400 to an empty POST, which
// is a real endpoint, not a 404). No client id/secret is registered with any of these vendors yet
// -- see docs/DEVELOPMENT_PLAN.md §6.4 gaps. Each provider reads its own client id/secret from env
// vars named below; when they're unset, the connect endpoint returns a clear "not configured" error
// rather than attempting a broken redirect.
export const STORAGE_PROVIDERS: Record<StorageRepository, OAuthProviderConfig> = {
  zenodo: {
    authorizeUrl: "https://zenodo.org/oauth/authorize",
    tokenUrl: "https://zenodo.org/oauth/token",
    clientIdEnvVar: "ZENODO_OAUTH_CLIENT_ID",
    clientSecretEnvVar: "ZENODO_OAUTH_CLIENT_SECRET",
    scope: "deposit:write deposit:actions",
  },
  osf: {
    authorizeUrl: "https://accounts.osf.io/oauth2/authorize",
    tokenUrl: "https://accounts.osf.io/oauth2/token",
    clientIdEnvVar: "OSF_OAUTH_CLIENT_ID",
    clientSecretEnvVar: "OSF_OAUTH_CLIENT_SECRET",
  },
  dryad: {
    authorizeUrl: "https://datadryad.org/oauth/authorize",
    tokenUrl: "https://datadryad.org/oauth/token",
    clientIdEnvVar: "DRYAD_OAUTH_CLIENT_ID",
    clientSecretEnvVar: "DRYAD_OAUTH_CLIENT_SECRET",
  },
  figshare: {
    authorizeUrl: "https://figshare.com/account/applications/authorize",
    tokenUrl: "https://api.figshare.com/v2/token",
    clientIdEnvVar: "FIGSHARE_OAUTH_CLIENT_ID",
    clientSecretEnvVar: "FIGSHARE_OAUTH_CLIENT_SECRET",
  },
};
