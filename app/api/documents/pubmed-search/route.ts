import { NextResponse } from "next/server";
import { searchPubMed } from "@/lib/eyewee/documents/pubmedSearch";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { term?: unknown };
  const term = typeof body.term === "string" ? body.term.trim() : "";
  if (term.length < 2) return NextResponse.json({ error: "Type something to search for." }, { status: 400 });

  try {
    const result = await searchPubMed(term, 15);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Couldn't reach PubMed — try again shortly." }, { status: 502 });
  }
}
