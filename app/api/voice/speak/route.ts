import { NextResponse } from "next/server";
import { synthesizeSpeech, TtsNotConfiguredError } from "@/lib/eyewee/voice/tts";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "No text to speak." }, { status: 400 });

  try {
    const audio = await synthesizeSpeech(text);
    return new NextResponse(new Uint8Array(audio), { headers: { "Content-Type": "audio/mpeg" } });
  } catch (error) {
    if (error instanceof TtsNotConfiguredError) return NextResponse.json({ error: error.message }, { status: 501 });
    return NextResponse.json({ error: "Speech synthesis failed — try again." }, { status: 502 });
  }
}
