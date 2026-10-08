import "server-only";

import { createEyeweeServiceClient } from "@/lib/eyewee/supabaseAdmin";

// Pricing shape per Ranjit (2026-10-08): base tier for postdocs/PhD students, premium for
// faculty/PI/industry roles. No billing, no enforcement -- this just gives every device a tier so
// nothing has to be redone when real gating/billing is built.
export type DeviceTier = "postdoc_base" | "faculty_premium";

export async function getOrCreateDeviceProfile(deviceId: string): Promise<{ tier: DeviceTier }> {
  const supabase = createEyeweeServiceClient();
  const { data: existing, error: readError } = await supabase
    .from("eyewee_device_profile")
    .select("tier")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (readError) throw readError;
  if (existing) return { tier: existing.tier };

  const { data: created, error: insertError } = await supabase
    .from("eyewee_device_profile")
    .insert({ device_id: deviceId })
    .select("tier")
    .single();
  if (insertError) throw insertError;
  return { tier: created.tier };
}
