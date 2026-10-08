import "server-only";

import { createEyeweeServiceClient } from "@/lib/eyewee/supabaseAdmin";

// Which features *could* be gated later -- none are gated yet (Ranjit, 2026-10-08: "we have not
// decided which individual features are gated... don't build billing yet"). This is the read path
// only; flipping `gated`/`required_tier` is a row UPDATE in Supabase, not a deploy.
export type FeatureKey = "voice" | "storage_connections" | "organize";

export async function isFeatureGated(feature: FeatureKey): Promise<boolean> {
  const supabase = createEyeweeServiceClient();
  const { data, error } = await supabase.from("eyewee_feature_flags").select("gated").eq("feature", feature).maybeSingle();
  if (error) throw error;
  return data?.gated ?? false;
}
