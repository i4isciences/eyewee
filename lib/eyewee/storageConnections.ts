import "server-only";

import { createEyeweeServiceClient } from "@/lib/eyewee/supabaseAdmin";
import { decryptSecret, encryptSecret } from "@/lib/eyewee/tokenCrypto";
import type { StorageRepository } from "@/lib/storage/providers/types";

export type StorageConnectionSummary = {
  repository: StorageRepository;
  externalAccountLabel: string;
  connectedAt: string;
};

// Never returns access/refresh tokens -- only what the sidebar needs to render "connected as X."
export async function listStorageConnections(deviceId: string): Promise<StorageConnectionSummary[]> {
  const supabase = createEyeweeServiceClient();
  const { data, error } = await supabase
    .from("eyewee_device_storage_connections")
    .select("repository, external_account_label, connected_at")
    .eq("device_id", deviceId);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    repository: row.repository,
    externalAccountLabel: row.external_account_label,
    connectedAt: row.connected_at,
  }));
}

export async function saveStorageConnection(
  deviceId: string,
  repository: StorageRepository,
  tokens: { accessToken: string; refreshToken?: string; accountLabel: string }
): Promise<void> {
  const supabase = createEyeweeServiceClient();
  const { error } = await supabase.from("eyewee_device_storage_connections").upsert(
    {
      device_id: deviceId,
      repository,
      access_token_encrypted: encryptSecret(tokens.accessToken),
      refresh_token_encrypted: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : null,
      external_account_label: tokens.accountLabel,
      connected_at: new Date().toISOString(),
    },
    { onConflict: "device_id,repository" }
  );
  if (error) throw error;
}

// Removes eyewee's stored link only -- must never call anything at the vendor that deletes or
// modifies the postdoc's actual deposits (docs/DEVELOPMENT_PLAN.md §6.4).
export async function deleteStorageConnection(deviceId: string, repository: StorageRepository): Promise<void> {
  const supabase = createEyeweeServiceClient();
  const { error } = await supabase
    .from("eyewee_device_storage_connections")
    .delete()
    .eq("device_id", deviceId)
    .eq("repository", repository);
  if (error) throw error;
}

// Exported for a future step that actually calls a connected vendor's API on the postdoc's behalf
// -- not used yet (no such feature is built), but decryptSecret needs at least one real call site
// to justify existing rather than bit-rotting unnoticed.
export async function getDecryptedAccessToken(deviceId: string, repository: StorageRepository): Promise<string | null> {
  const supabase = createEyeweeServiceClient();
  const { data, error } = await supabase
    .from("eyewee_device_storage_connections")
    .select("access_token_encrypted")
    .eq("device_id", deviceId)
    .eq("repository", repository)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return decryptSecret(data.access_token_encrypted);
}
