import "server-only";

import { createEyeweeServiceClient } from "@/lib/eyewee/supabaseAdmin";

export async function getLinkedPostdocworksUserId(deviceId: string): Promise<string | null> {
  const supabase = createEyeweeServiceClient();
  const { data, error } = await supabase
    .from("eyewee_device_postdocworks_link")
    .select("postdocworks_user_id")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (error) throw error;
  return data?.postdocworks_user_id ?? null;
}

export async function saveLink(deviceId: string, postdocworksUserId: string): Promise<void> {
  const supabase = createEyeweeServiceClient();
  const { error } = await supabase
    .from("eyewee_device_postdocworks_link")
    .upsert({ device_id: deviceId, postdocworks_user_id: postdocworksUserId }, { onConflict: "device_id" });
  if (error) throw error;
}

// Removes eyewee's record of the link only -- never touches the postdoc's actual postdocworks
// account or data, same pattern as Storage disconnect.
export async function deleteLink(deviceId: string): Promise<void> {
  const supabase = createEyeweeServiceClient();
  const { error } = await supabase.from("eyewee_device_postdocworks_link").delete().eq("device_id", deviceId);
  if (error) throw error;
}
