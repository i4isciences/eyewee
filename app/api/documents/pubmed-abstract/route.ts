import { NextResponse } from "next/server";
import { fetchAbstract } from "@/lib/eyewee/documents/pubmedSearch";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { pmid?: unknown };
  const pmid = typeof body.pmid === "string" ? body.pmid.trim() : "";
  if (!pmid) return NextResponse.json({ error: "Missing pmid." }, { status: 400 });

  try {
    const result = await fetchAbstract(pmid);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Couldn't fetch that paper's abstract — try again shortly." }, { status: 502 });
  }
}
