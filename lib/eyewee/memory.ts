import "server-only";

import { createEyeweeServiceClient } from "@/lib/eyewee/supabaseAdmin";
import { isSafeToRemember } from "@/lib/eyewee/guardrails/memorySafety";

export type MemoryCategory = "field" | "focus" | "badge" | "preference" | "other";

export type MemoryFact = {
  id: string;
  text: string;
  category: MemoryCategory;
  source: string | null;
  createdAt: string;
  lastReferencedAt: string | null;
};

export class UnsafeMemoryFactError extends Error {
  constructor() {
    super("That looks like mental-health, medical, immigration-case, or other sensitive personal detail -- eyewee never saves that to memory.");
    this.name = "UnsafeMemoryFactError";
  }
}

export async function listMemoryFacts(deviceId: string): Promise<MemoryFact[]> {
  const supabase = createEyeweeServiceClient();
  const { data, error } = await supabase
    .from("eyewee_device_memory_facts")
    .select("id, text, category, source, created_at, last_referenced_at")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    text: row.text,
    category: row.category,
    source: row.source,
    createdAt: row.created_at,
    lastReferencedAt: row.last_referenced_at,
  }));
}

// Lets a well-defined source (currently: a PostdocWorks/Doc2Postdoc connect) write a whole batch
// of facts atomically-ish and stay re-syncable: every existing fact tagged with this exact
// `source` gets deleted first, then the fresh batch is inserted. Reconnecting therefore replaces,
// never piles up duplicates or leaves stale facts behind. Conversation-suggested facts (source
// null) are never touched by this. Every fact still goes through isSafeToRemember -- a trusted
// source for the data doesn't exempt it from the same locked content rule.
export async function replaceSourcedMemoryFacts(
  deviceId: string,
  source: string,
  facts: { text: string; category: MemoryCategory }[]
): Promise<MemoryFact[]> {
  const safeFacts = facts.filter((f) => f.text.trim() && isSafeToRemember(f.text));
  const supabase = createEyeweeServiceClient();

  const { error: deleteError } = await supabase.from("eyewee_device_memory_facts").delete().eq("device_id", deviceId).eq("source", source);
  if (deleteError) throw deleteError;

  if (safeFacts.length === 0) return [];

  const { data, error: insertError } = await supabase
    .from("eyewee_device_memory_facts")
    .insert(safeFacts.map((f) => ({ device_id: deviceId, text: f.text, category: f.category, source })))
    .select("id, text, category, source, created_at, last_referenced_at");
  if (insertError) throw insertError;

  return (data ?? []).map((row) => ({
    id: row.id,
    text: row.text,
    category: row.category,
    source: row.source,
    createdAt: row.created_at,
    lastReferencedAt: row.last_referenced_at,
  }));
}

// Write path (Ranjit, 2026-10-08): hybrid -- eyewee may *suggest* a fact
// (lib/eyewee/claude/memorySuggestion.ts), but nothing saves until the postdoc explicitly
// approves it here. isSafeToRemember is re-checked server-side even though the suggestion prompt
// already excludes sensitive categories -- never trust a single layer for a locked rule.
export async function createMemoryFact(
  deviceId: string,
  text: string,
  category: MemoryCategory,
  sourceConversationId?: string
): Promise<MemoryFact> {
  if (!isSafeToRemember(text)) throw new UnsafeMemoryFactError();

  const supabase = createEyeweeServiceClient();
  const { data, error } = await supabase
    .from("eyewee_device_memory_facts")
    .insert({ device_id: deviceId, text, category, source_conversation_id: sourceConversationId ?? null })
    .select("id, text, category, source, created_at, last_referenced_at")
    .single();
  if (error) throw error;
  return { id: data.id, text: data.text, category: data.category, source: data.source, createdAt: data.created_at, lastReferencedAt: data.last_referenced_at };
}

async function assertOwnedFact(deviceId: string, factId: string): Promise<boolean> {
  const supabase = createEyeweeServiceClient();
  const { data, error } = await supabase
    .from("eyewee_device_memory_facts")
    .select("id")
    .eq("id", factId)
    .eq("device_id", deviceId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function updateMemoryFact(deviceId: string, factId: string, text: string): Promise<MemoryFact | null> {
  if (!isSafeToRemember(text)) throw new UnsafeMemoryFactError();
  if (!(await assertOwnedFact(deviceId, factId))) return null;

  const supabase = createEyeweeServiceClient();
  const { data, error } = await supabase
    .from("eyewee_device_memory_facts")
    .update({ text })
    .eq("id", factId)
    .select("id, text, category, source, created_at, last_referenced_at")
    .single();
  if (error) throw error;
  return { id: data.id, text: data.text, category: data.category, source: data.source, createdAt: data.created_at, lastReferencedAt: data.last_referenced_at };
}

export async function deleteMemoryFact(deviceId: string, factId: string): Promise<boolean> {
  if (!(await assertOwnedFact(deviceId, factId))) return false;
  const supabase = createEyeweeServiceClient();
  const { error } = await supabase.from("eyewee_device_memory_facts").delete().eq("id", factId);
  if (error) throw error;
  return true;
}
