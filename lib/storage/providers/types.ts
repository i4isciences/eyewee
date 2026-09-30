export type StorageRepository = "zenodo" | "osf" | "dryad" | "figshare";

export const STORAGE_REPOSITORIES: StorageRepository[] = ["zenodo", "osf", "dryad", "figshare"];

export function isStorageRepository(value: string): value is StorageRepository {
  return (STORAGE_REPOSITORIES as string[]).includes(value);
}

export type OAuthProviderConfig = {
  authorizeUrl: string;
  tokenUrl: string;
  clientIdEnvVar: string;
  clientSecretEnvVar: string;
  scope?: string;
};

export type ExchangedTokens = {
  accessToken: string;
  refreshToken?: string;
  accountLabel: string;
};
