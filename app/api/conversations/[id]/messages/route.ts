import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { craftReply } from "@/lib/eyewee/reply";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await params;

  const { data: conversation } = await supabase
    .from("eyewee_conversations")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  const { data, error } = await supabase
    .from("eyewee_messages")
    .select("id, sender, text, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await params;

  const body = (await request.json()) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });

  const { data: conversation } = await supabase
    .from("eyewee_conversations")
    .select("id, title")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  const { error: insertUserError } = await supabase
    .from("eyewee_messages")
    .insert({ conversation_id: id, sender: "user", text });
  if (insertUserError) return NextResponse.json({ error: insertUserError.message }, { status: 500 });

  const reply = craftReply(text);

  const { error: insertReplyError } = await supabase
    .from("eyewee_messages")
    .insert({ conversation_id: id, sender: "eyewee", text: reply });
  if (insertReplyError) return NextResponse.json({ error: insertReplyError.message }, { status: 500 });

  const titleUpdate: { updated_at: string; title?: string } = { updated_at: new Date().toISOString() };
  if (conversation.title === "New conversation") {
    titleUpdate.title = text.length > 60 ? `${text.slice(0, 57)}...` : text;
  }
  await supabase.from("eyewee_conversations").update(titleUpdate).eq("id", id);

  return NextResponse.json({ reply });
}
