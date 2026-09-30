import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { runSynthesizeLiteratureLayer } from "@/lib/eyewee/leverage/pipeline";
import { noveltyServiceAdapter } from "@/lib/eyewee/leverage/adapters";

export async function POST(request: Request) {
  const body = (await request.json()) as { term?: unknown };
  const term = typeof body.term === "string" ? body.term.trim() : "";

  if (term.length < 3) {
    return NextResponse.json({ error: "Describe the finding you want checked (at least a few words)." }, { status: 400 });
  }

  try {
    // "postdocId" per the locked pipeline contract -- eyewee is account-free (no real identity),
    // so this is the anonymous per-device id, not a person. See docs/DEVELOPMENT_PLAN.md §9/§10.
    const { deviceId } = await getOrCreateDeviceId();
    const result = await runSynthesizeLiteratureLayer(
      { postdocId: deviceId, researchQuestion: term },
      noveltyServiceAdapter
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "The novelty check ran into a problem reaching PubMed/GenBank/EMBL — try again shortly." }, { status: 502 });
  }
}
