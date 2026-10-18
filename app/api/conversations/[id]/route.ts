import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { deleteConversation } from "@/lib/eyewee/conversations";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { deviceId } = await getOrCreateDeviceId();
  const deleted = await deleteConversation(deviceId, id);
  if (!deleted) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}
