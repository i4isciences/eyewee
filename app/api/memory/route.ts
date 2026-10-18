import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { createMemoryFact, deleteAllMemoryFacts, listMemoryFacts, UnsafeMemoryFactError, type MemoryCategory } from "@/lib/eyewee/memory";

// "badge" is deliberately excluded -- a postdoc's own conversation can never create a badge/
// verification memory fact (eyewee cannot confirm one); those only ever come from the trusted
// PostdocWorks sync path (lib/eyewee/postdocworks/syncMemory.ts), which writes directly and never
// goes through this endpoint.
const VALID_CATEGORIES: MemoryCategory[] = ["field", "focus", "preference", "other"];

export async function GET() {
  const { deviceId } = await getOrCreateDeviceId();
  const facts = await listMemoryFacts(deviceId);
  return NextResponse.json({ facts });
}

// Only ever saves a fact the postdoc explicitly approved -- eyewee never writes memory on its own
// (Ranjit, 2026-10-08: hybrid model, suggest-then-approve).
export async function POST(request: Request) {
  const { deviceId } = await getOrCreateDeviceId();
  const body = (await request.json().catch(() => ({}))) as { text?: unknown; category?: unknown; sourceConversationId?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const category = typeof body.category === "string" && VALID_CATEGORIES.includes(body.category as MemoryCategory) ? (body.category as MemoryCategory) : "other";
  const sourceConversationId = typeof body.sourceConversationId === "string" ? body.sourceConversationId : undefined;

  if (!text) return NextResponse.json({ error: "No fact text provided." }, { status: 400 });

  try {
    const fact = await createMemoryFact(deviceId, text, category, sourceConversationId);
    return NextResponse.json({ fact });
  } catch (error) {
    if (error instanceof UnsafeMemoryFactError) return NextResponse.json({ error: error.message }, { status: 422 });
    return NextResponse.json({ error: "Couldn't save that right now." }, { status: 500 });
  }
}

export async function DELETE() {
  const { deviceId } = await getOrCreateDeviceId();
  await deleteAllMemoryFacts(deviceId);
  return NextResponse.json({ success: true });
}
