import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { appendMessage, getMessages, type MessageRecord } from "@/lib/eyewee/conversations";
import { isLiveChatAllowedForRequest } from "@/lib/eyewee/guardrails/crisisGate";
import { containsPhi } from "@/lib/eyewee/guardrails/phiFilter";
import { craftReply } from "@/lib/eyewee/reply";
import { generateEyeweeReply, type ChatTurn } from "@/lib/eyewee/claude/client";
import { buildSystemPrompt } from "@/lib/eyewee/claude/systemPrompt";
import { listMemoryFacts } from "@/lib/eyewee/memory";
import { suggestMemoryFact, type MemorySuggestion } from "@/lib/eyewee/claude/memorySuggestion";

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

// Live for real users only once isCrisisResponseGateOpen() is true (legal + mental-health
// clearance). Live for the internal team the moment their browser is marked via
// /api/internal/enable-testing, regardless of that public switch -- see
// lib/eyewee/guardrails/crisisGate.ts for exactly why those are two separate checks, not one.
// Falls back to the canned reply if neither applies, or if the live call fails for any reason.
async function draftEyeweeReply(
  deviceId: string,
  priorMessages: MessageRecord[],
  userText: string,
  liveAllowed: boolean
): Promise<{ reply: string; history: ChatTurn[] } > {
  const history: ChatTurn[] = [...toChatHistory(priorMessages), { role: "user", content: userText }];
  if (!liveAllowed) return { reply: craftReply(userText), history };

  try {
    const memoryFacts = await listMemoryFacts(deviceId).catch(() => []);
    const system = buildSystemPrompt(memoryFacts.map((f) => f.text));
    const reply = await generateEyeweeReply(system, history);
    return { reply, history };
  } catch {
    return { reply: craftReply(userText), history };
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

  const liveAllowed = await isLiveChatAllowedForRequest();
  const { reply: replyText, history } = await draftEyeweeReply(deviceId, priorMessages, text, liveAllowed);
  const eyeweeMessage = await appendMessage(deviceId, id, "eyewee", replyText);

  // Memory suggestions need a real Claude call too -- only worth attempting when one just
  // happened (liveAllowed), and only ever a *suggestion*: nothing is saved without the postdoc's
  // explicit approval via POST /api/memory (Ranjit, 2026-10-08: hybrid model).
  let suggestedFact: MemorySuggestion | null = null;
  if (liveAllowed) {
    suggestedFact = await suggestMemoryFact([...history, { role: "assistant", content: replyText }]);
  }

  return NextResponse.json({ userMessage, eyeweeMessage, suggestedFact });
}
