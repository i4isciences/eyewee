import { NextResponse } from "next/server";
import { synthesizeSpeech, TtsNotConfiguredError } from "@/lib/eyewee/voice/tts";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { checkRateLimit, rateLimitedResponse } from "@/lib/eyewee/rateLimit";

const VOICE_RATE_LIMIT = 30;
const VOICE_RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_SPEAK_LENGTH = 4000;

export async function POST(request: Request) {
  const { deviceId } = await getOrCreateDeviceId();
  const rate = checkRateLimit(`voice-tts:${deviceId}`, VOICE_RATE_LIMIT, VOICE_RATE_WINDOW_MS);
  if (!rate.allowed) return rateLimitedResponse(rate.resetAt, "Too many voice requests in the last hour. Please try again a bit later.");

  const body = (await request.json().catch(() => ({}))) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "No text to speak." }, { status: 400 });
  if (text.length > MAX_SPEAK_LENGTH) return NextResponse.json({ error: "That message is too long to read aloud." }, { status: 413 });

  try {
    const audio = await synthesizeSpeech(text);
    return new NextResponse(new Uint8Array(audio), { headers: { "Content-Type": "audio/mpeg" } });
  } catch (error) {
    if (error instanceof TtsNotConfiguredError) return NextResponse.json({ error: error.message }, { status: 501 });
    return NextResponse.json({ error: "Speech synthesis failed — try again." }, { status: 502 });
  }
}
