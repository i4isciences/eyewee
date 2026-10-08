import "server-only";

import { createEyeweeServiceClient } from "@/lib/eyewee/supabaseAdmin";

// Feeds components/eye/Eye.tsx's `usagePercent` prop (Ranjit, 2026-10-08: "when a user reaches
// 100% of their usage allowance, the eye turns reddish as a visual flag. eyewee stays fully usable
// and is not locked out" -- no lockout logic lives here or in Eye.tsx, only the percentage).
//
// PLACEHOLDER allowance: real per-tier limits haven't been decided ("don't build billing yet").
// This counts today's user messages across all of a device's conversations against a single flat
// number so the visual actually does something meaningful today; swap in real per-tier limits
// (via lib/eyewee/tier/profile.ts's tier) once those numbers exist -- no schema change needed,
// just this constant/lookup.
const PLACEHOLDER_DAILY_MESSAGE_ALLOWANCE = 50;

function startOfTodayIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

export async function getUsagePercent(deviceId: string): Promise<number> {
  const supabase = createEyeweeServiceClient();

  const { data: conversations, error: convError } = await supabase
    .from("eyewee_device_conversations")
    .select("id")
    .eq("device_id", deviceId);
  if (convError) throw convError;

  const conversationIds = (conversations ?? []).map((c) => c.id);
  if (conversationIds.length === 0) return 0;

  const { count, error: countError } = await supabase
    .from("eyewee_device_messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", conversationIds)
    .eq("sender", "user")
    .gte("created_at", startOfTodayIso());
  if (countError) throw countError;

  const used = count ?? 0;
  return Math.min(100, Math.round((used / PLACEHOLDER_DAILY_MESSAGE_ALLOWANCE) * 100));
}
