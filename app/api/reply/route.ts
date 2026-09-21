import { NextResponse } from "next/server";
import { craftReply } from "@/lib/eyewee/reply";

// Public, no auth: eyewee has no accounts. This is the same canned, pattern-matched responder
// that existed behind login before -- craftReply never calls a live model, so exposing it
// without an account doesn't cross the crisis-response hold described in docs/SPEC.md Section 2.1.
export async function POST(request: Request) {
  const body = (await request.json()) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });
  return NextResponse.json({ reply: craftReply(text) });
}
