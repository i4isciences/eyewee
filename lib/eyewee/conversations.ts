import "server-only";

import { createEyeweeServiceClient } from "@/lib/eyewee/supabaseAdmin";

export type ConversationSummary = { id: string; title: string; createdAt: string; updatedAt: string };
export type MessageRecord = { id: string; sender: "user" | "eyewee"; text: string; createdAt: string };

// Every function here takes deviceId as an explicit argument and filters on it directly -- these
// tables carry no RLS policies (see the migration), so this application-code filter *is* the
// entire authorization boundary. Never expose these functions in a way that lets deviceId be
// supplied by anything other than the server reading its own httpOnly cookie
// (lib/eyewee/session/deviceId.ts).

export async function listConversations(deviceId: string): Promise<ConversationSummary[]> {
  const supabase = createEyeweeServiceClient();
  const { data, error } = await supabase
    .from("eyewee_device_conversations")
    .select("id, title, created_at, updated_at")
    .eq("device_id", deviceId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, title: row.title, createdAt: row.created_at, updatedAt: row.updated_at }));
}

export async function createConversation(deviceId: string, title: string): Promise<ConversationSummary> {
  const supabase = createEyeweeServiceClient();
  const { data, error } = await supabase
    .from("eyewee_device_conversations")
    .insert({ device_id: deviceId, title })
    .select("id, title, created_at, updated_at")
    .single();
  if (error) throw error;
  return { id: data.id, title: data.title, createdAt: data.created_at, updatedAt: data.updated_at };
}

// Returns null (rather than throwing) when the conversation doesn't exist or belongs to a
// different device -- callers should treat that as a 404, not leak which case it was.
async function assertOwnedConversation(deviceId: string, conversationId: string): Promise<boolean> {
  const supabase = createEyeweeServiceClient();
  const { data, error } = await supabase
    .from("eyewee_device_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("device_id", deviceId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function getMessages(deviceId: string, conversationId: string): Promise<MessageRecord[] | null> {
  if (!(await assertOwnedConversation(deviceId, conversationId))) return null;

  const supabase = createEyeweeServiceClient();
  const { data, error } = await supabase
    .from("eyewee_device_messages")
    .select("id, sender, text, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, sender: row.sender, text: row.text, createdAt: row.created_at }));
}

export async function appendMessage(
  deviceId: string,
  conversationId: string,
  sender: "user" | "eyewee",
  text: string
): Promise<MessageRecord | null> {
  if (!(await assertOwnedConversation(deviceId, conversationId))) return null;

  const supabase = createEyeweeServiceClient();
  const { data, error } = await supabase
    .from("eyewee_device_messages")
    .insert({ conversation_id: conversationId, sender, text })
    .select("id, sender, text, created_at")
    .single();
  if (error) throw error;

  await supabase.from("eyewee_device_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);

  return { id: data.id, sender: data.sender, text: data.text, createdAt: data.created_at };
}
