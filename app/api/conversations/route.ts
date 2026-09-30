import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { createConversation, listConversations } from "@/lib/eyewee/conversations";

export async function GET() {
  const { deviceId } = await getOrCreateDeviceId();
  const conversations = await listConversations(deviceId);
  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const { deviceId } = await getOrCreateDeviceId();
  const body = (await request.json().catch(() => ({}))) as { title?: unknown };
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 200) : "New conversation";

  const conversation = await createConversation(deviceId, title);
  return NextResponse.json({ conversation });
}
