import "server-only";

import { createEyeweeServiceClient } from "@/lib/eyewee/supabaseAdmin";

export async function hasConsented(deviceId: string): Promise<boolean> {
  const supabase = createEyeweeServiceClient();
  const { data, error } = await supabase.from("eyewee_device_consent").select("device_id").eq("device_id", deviceId).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function recordConsent(deviceId: string): Promise<void> {
  const supabase = createEyeweeServiceClient();
  const { error } = await supabase
    .from("eyewee_device_consent")
    .upsert({ device_id: deviceId, consented_at: new Date().toISOString() });
  if (error) throw error;
}
