import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { deleteMemoryFact, updateMemoryFact, UnsafeMemoryFactError } from "@/lib/eyewee/memory";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { deviceId } = await getOrCreateDeviceId();
  const body = (await request.json().catch(() => ({}))) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "No fact text provided." }, { status: 400 });

  try {
    const fact = await updateMemoryFact(deviceId, id, text);
    if (!fact) return NextResponse.json({ error: "Fact not found." }, { status: 404 });
    return NextResponse.json({ fact });
  } catch (error) {
    if (error instanceof UnsafeMemoryFactError) return NextResponse.json({ error: error.message }, { status: 422 });
    return NextResponse.json({ error: "Couldn't update that right now." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { deviceId } = await getOrCreateDeviceId();
  const deleted = await deleteMemoryFact(deviceId, id);
  if (!deleted) return NextResponse.json({ error: "Fact not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}
