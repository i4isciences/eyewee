import { NextResponse } from "next/server";
import { deleteExpiredDecks } from "@/lib/eyewee/decks/storage";

export const runtime = "nodejs";

// Scheduled hourly by vercel.json. Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; with no
// CRON_SECRET configured the route refuses to run rather than being open to anyone.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const deleted = await deleteExpiredDecks();
    return NextResponse.json({ deleted });
  } catch (err) {
    console.error("Deck cleanup failed:", err);
    return NextResponse.json({ error: "Cleanup failed." }, { status: 500 });
  }
}
