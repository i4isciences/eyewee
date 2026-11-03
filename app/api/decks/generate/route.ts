import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { isLiveChatAllowedForRequest } from "@/lib/eyewee/guardrails/crisisGate";
import { containsPhi } from "@/lib/eyewee/guardrails/phiFilter";
import { buildDeckPairFromJson, createDeckPair } from "@/lib/eyewee/decks/service";

// Node runtime (not Edge): PptxGenJS and the Supabase service client need Node APIs.
export const runtime = "nodejs";
// Two model calls + two builds; well under the limit for decks of up to 20 slides.
export const maxDuration = 120;

export async function POST(request: Request) {
  if (!(await isLiveChatAllowedForRequest())) {
    return NextResponse.json({ error: "Deck generation isn't available yet." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    topic?: unknown;
    audience?: unknown;
    length?: unknown;
    source_material?: unknown;
    decks?: { layman?: unknown; technical?: unknown };
  };
  // Test path (brief Step 4): hand-written deck JSON in, two .pptx links out, no model call.
  if (body.decks && typeof body.decks === "object") {
    const { deviceId } = await getOrCreateDeviceId();
    const built = await buildDeckPairFromJson({ deviceId, layman: body.decks.layman, technical: body.decks.technical });
    if (!built.ok) return NextResponse.json({ error: built.error }, { status: built.status });
    return NextResponse.json(built);
  }

  const topic = typeof body.topic === "string" ? body.topic : "";
  const audience = typeof body.audience === "string" ? body.audience : "";
  const sourceMaterial = typeof body.source_material === "string" ? body.source_material : "";
  const slideCount = typeof body.length === "number" ? body.length : Number(body.length);

  if (containsPhi(`${topic}\n${sourceMaterial}`)) {
    return NextResponse.json({ error: "That looks like it may contain patient-identifying information. Please remove it first." }, { status: 422 });
  }

  const { deviceId } = await getOrCreateDeviceId();
  const result = await createDeckPair({ deviceId, topic, audience, slideCount, sourceMaterial });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
