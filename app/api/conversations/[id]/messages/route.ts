import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { appendMessage, getMessages, type MessageRecord } from "@/lib/eyewee/conversations";
import { isCrisisResponseGateOpen } from "@/lib/eyewee/guardrails/crisisGate";
import { containsPhi } from "@/lib/eyewee/guardrails/phiFilter";
import { craftReply } from "@/lib/eyewee/reply";
import { generateEyeweeReply, type ChatTurn } from "@/lib/eyewee/claude/client";
import { buildSystemPrompt } from "@/lib/eyewee/claude/systemPrompt";
import { listMemoryFacts } from "@/lib/eyewee/memory";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { deviceId } = await getOrCreateDeviceId();

  const messages = await getMessages(deviceId, id);
  if (messages === null) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  return NextResponse.json({ messages });
}

function toChatHistory(messages: MessageRecord[]): ChatTurn[] {
  return messages.map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text }));
}

// The endpoint held behind the crisis-response gate (docs/DEVELOPMENT_PLAN.md §6.6). Building the
// Claude client (lib/eyewee/claude/client.ts) does NOT flip this gate -- it stays closed by
// default and only a human explicitly setting EYEWEE_CRISIS_RESPONSE_GATE_OPEN=true after legal +
// mental-health-professional clearance turns it on. Falls back to the canned reply if the gate is
// closed, or if the live call fails for any reason -- never leaves the user with a raw error in
// place of a reply.
async function draftEyeweeReply(deviceId: string, priorMessages: MessageRecord[], userText: string): Promise<string> {
  if (!isCrisisResponseGateOpen()) return craftReply(userText);

  try {
    const memoryFacts = await listMemoryFacts(deviceId).catch(() => []);
    const system = buildSystemPrompt(memoryFacts.map((f) => f.text));
    const history: ChatTurn[] = [...toChatHistory(priorMessages), { role: "user", content: userText }];
    return await generateEyeweeReply(system, history);
  } catch {
    return craftReply(userText);
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { deviceId } = await getOrCreateDeviceId();
  const body = (await request.json().catch(() => ({}))) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });

  if (containsPhi(text)) {
    return NextResponse.json(
      { error: "That message looks like it may contain patient-identifying information (like an MRN, SSN, or name with date of birth). Please remove it before sending — see /safety." },
      { status: 422 }
    );
  }

  const priorMessages = (await getMessages(deviceId, id)) ?? [];

  const userMessage = await appendMessage(deviceId, id, "user", text);
  if (userMessage === null) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  const replyText = await draftEyeweeReply(deviceId, priorMessages, text);
  const eyeweeMessage = await appendMessage(deviceId, id, "eyewee", replyText);

  return NextResponse.json({ userMessage, eyeweeMessage });
}
