import { NextResponse } from "next/server";
import { renderDeckHtml } from "@/lib/eyewee/leverage/deckExport";
import type { DeckEdition } from "@/lib/eyewee/leverage/pipeline";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { title?: unknown; edition?: DeckEdition };
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "eyewee deck";
  const edition = body.edition;

  if (!edition || !Array.isArray(edition.slides) || (edition.kind !== "layman" && edition.kind !== "technical")) {
    return NextResponse.json({ error: "Missing or malformed deck edition." }, { status: 400 });
  }

  const html = renderDeckHtml(title, edition);
  const filename = `${title.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}-${edition.kind}.html`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
