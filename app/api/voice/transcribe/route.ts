import { NextResponse } from "next/server";
import { transcribeAudio, SttNotConfiguredError } from "@/lib/eyewee/voice/stt";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { checkRateLimit, rateLimitedResponse } from "@/lib/eyewee/rateLimit";

const VOICE_RATE_LIMIT = 30;
const VOICE_RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const { deviceId } = await getOrCreateDeviceId();
  const rate = checkRateLimit(`voice-stt:${deviceId}`, VOICE_RATE_LIMIT, VOICE_RATE_WINDOW_MS);
  if (!rate.allowed) return rateLimitedResponse(rate.resetAt, "Too many voice requests in the last hour. Please try again a bit later.");

  const contentType = request.headers.get("content-type") || "audio/webm";
  const arrayBuffer = await request.arrayBuffer();
  if (arrayBuffer.byteLength === 0) return NextResponse.json({ error: "No audio received." }, { status: 400 });
  if (arrayBuffer.byteLength > MAX_AUDIO_BYTES) return NextResponse.json({ error: "Audio clip is too large." }, { status: 413 });

  try {
    const result = await transcribeAudio(Buffer.from(arrayBuffer), contentType);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SttNotConfiguredError) return NextResponse.json({ error: error.message }, { status: 501 });
    return NextResponse.json({ error: "Transcription failed — try again." }, { status: 502 });
  }
}
