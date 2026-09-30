import "server-only";

import { createEyeweeServiceClient } from "@/lib/eyewee/supabaseAdmin";

export type MemoryFact = {
  id: string;
  text: string;
  category: "field" | "focus" | "badge" | "preference" | "other";
  createdAt: string;
  lastReferencedAt: string | null;
};

// Read-only, per docs/DEVELOPMENT_PLAN.md §6.5 / §8.2: the write path is blocked on a product
// decision (automatic extraction vs. explicit-only vs. hybrid) that only Ran can make. This
// returns real rows once they exist -- it just has no way to create any yet.
export async function listMemoryFacts(deviceId: string): Promise<MemoryFact[]> {
  const supabase = createEyeweeServiceClient();
  const { data, error } = await supabase
    .from("eyewee_device_memory_facts")
    .select("id, text, category, created_at, last_referenced_at")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    text: row.text,
    category: row.category,
    createdAt: row.created_at,
    lastReferencedAt: row.last_referenced_at,
  }));
}
