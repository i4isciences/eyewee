import { NextResponse } from "next/server";
import { transcribeAudio, SttNotConfiguredError } from "@/lib/eyewee/voice/stt";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "audio/webm";
  const arrayBuffer = await request.arrayBuffer();
  if (arrayBuffer.byteLength === 0) return NextResponse.json({ error: "No audio received." }, { status: 400 });

  try {
    const result = await transcribeAudio(Buffer.from(arrayBuffer), contentType);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SttNotConfiguredError) return NextResponse.json({ error: error.message }, { status: 501 });
    return NextResponse.json({ error: "Transcription failed — try again." }, { status: 502 });
  }
}
