import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { runPresentLayer } from "@/lib/eyewee/leverage/pipeline";
import { decksServiceAdapter } from "@/lib/eyewee/leverage/adapters";

export async function POST(request: Request) {
  const body = (await request.json()) as { finding?: unknown };
  const finding = typeof body.finding === "string" ? body.finding.trim() : "";

  if (finding.length < 10) {
    return NextResponse.json({ error: "Describe your findings in a sentence or two so eyewee has something to build decks from." }, { status: 400 });
  }

  const { deviceId } = await getOrCreateDeviceId();
  const result = await runPresentLayer(
    { postdocId: deviceId, topic: finding, sourceContent: finding },
    decksServiceAdapter
  );
  return NextResponse.json(result);
}
