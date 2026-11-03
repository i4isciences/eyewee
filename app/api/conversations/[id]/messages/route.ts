import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getOrCreateDeviceId } from "@/lib/eyewee/session/deviceId";
import { appendMessage, getMessages, type MessageRecord } from "@/lib/eyewee/conversations";
import { isLiveChatAllowedForRequest } from "@/lib/eyewee/guardrails/crisisGate";
import { containsPhi } from "@/lib/eyewee/guardrails/phiFilter";
import { craftReply } from "@/lib/eyewee/reply";
import { generateEyeweeReply, type ChatTurn } from "@/lib/eyewee/claude/client";
import { buildSystemPrompt } from "@/lib/eyewee/claude/systemPrompt";
import { listMemoryFacts } from "@/lib/eyewee/memory";
import { suggestMemoryFact, type MemorySuggestion } from "@/lib/eyewee/claude/memorySuggestion";
import { buildPostdocworksContext } from "@/lib/eyewee/postdocworks/context";
import { checkRateLimit, rateLimitedResponse } from "@/lib/eyewee/rateLimit";
import { containsCrisisLanguage, CRISIS_LINE } from "@/lib/eyewee/guardrails/crisisMessage";
import { hasConsented } from "@/lib/eyewee/consent";

// Deck creation (two model calls + file builds) can run inside a chat turn.
export const maxDuration = 120;

type RouteParams = { params: Promise<{ id: string }> };

const MAX_MESSAGE_LENGTH = 4000;
const CHAT_RATE_LIMIT = 20;
const CHAT_RATE_WINDOW_MS = 60 * 60 * 1000;

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
type AttachmentPayload = {
  name: string;
  size: number;
  type: "pdf" | "image" | "pptx" | "text" | "other";
  mimeType: string;
  extractedText?: string;
  base64?: string;
};

async function draftEyeweeReply(
  deviceId: string,
  priorMessages: MessageRecord[],
  userContent: string | Anthropic.MessageParam["content"],
  fallbackText: string,
  liveAllowed: boolean
): Promise<{ reply: string; history: ChatTurn[] }> {
  const history: ChatTurn[] = [...toChatHistory(priorMessages), { role: "user", content: userContent }];
  if (!liveAllowed) return { reply: await craftReply(fallbackText), history };

  try {
    const [memoryFacts, postdocworksContext] = await Promise.all([
      listMemoryFacts(deviceId).catch(() => []),
      buildPostdocworksContext(deviceId).catch(() => null),
    ]);
    const system = buildSystemPrompt(memoryFacts.map((f) => f.text), postdocworksContext ?? undefined);
    const reply = await generateEyeweeReply(system, history, true, { deviceId });
    return { reply, history };
  } catch (err) {
    console.error("Claude reply generation error:", err);
    return { reply: await craftReply(fallbackText), history };
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { deviceId } = await getOrCreateDeviceId();
  const body = (await request.json().catch(() => ({}))) as {
    text?: unknown;
    attachment?: AttachmentPayload;
  };

  const rawText = typeof body.text === "string" ? body.text.trim() : "";
  const attachment = body.attachment && typeof body.attachment === "object" ? body.attachment : undefined;

  if (!rawText && !attachment) {
    return NextResponse.json({ error: "Message or file attachment is required." }, { status: 400 });
  }

  if (rawText.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `Messages are limited to ${MAX_MESSAGE_LENGTH} characters.` }, { status: 413 });
  }

  if (containsPhi(rawText)) {
    return NextResponse.json(
      { error: "That message looks like it may contain patient-identifying information (like an MRN, SSN, or name with date of birth). Please remove it before sending — see /safety." },
      { status: 422 }
    );
  }

  // Build user's stored display message text
  let userDisplayText = rawText;
  if (attachment) {
    const icon = attachment.type === "pdf" ? "📄" : attachment.type === "pptx" ? "📊" : attachment.type === "image" ? "🖼️" : "📝";
    const header = `${icon} [Attached: ${attachment.name}]`;
    userDisplayText = rawText ? `${header}\n\n${rawText}` : `${header}\n\nPlease analyze and read this attachment in detail.`;
  }

  const priorMessages = (await getMessages(deviceId, id)) ?? [];
  const userMessage = await appendMessage(deviceId, id, "user", userDisplayText);
  if (userMessage === null) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  // Crisis language check
  if (containsCrisisLanguage(rawText)) {
    const eyeweeMessage = await appendMessage(deviceId, id, "eyewee", CRISIS_LINE);
    return NextResponse.json({ userMessage, eyeweeMessage, suggestedFact: null });
  }

  // Build model input turn
  let userModelContent: string | Anthropic.MessageParam["content"] = rawText;
  if (attachment) {
    if (attachment.type === "image" && attachment.base64) {
      userModelContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: (attachment.mimeType || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: attachment.base64,
          },
        },
        {
          type: "text",
          text: rawText || `Please examine and read this image ("${attachment.name}") in detail and answer accordingly.`,
        },
      ];
    } else if (attachment.extractedText) {
      userModelContent = `${attachment.extractedText}\n\n` +
        (rawText
          ? `User Question/Instruction:\n${rawText}`
          : "Please read through all content in this attached document and provide a clean, comprehensive summary, key takeaways, and answer anything relevant.");
    }
  }

  const liveAllowed = await isLiveChatAllowedForRequest();
  const fallbackQuery = rawText || (attachment ? `Analyze ${attachment.name}` : "");
  const { reply: replyText, history } = await draftEyeweeReply(deviceId, priorMessages, userModelContent, fallbackQuery, liveAllowed);
  const eyeweeMessage = await appendMessage(deviceId, id, "eyewee", replyText);

  let suggestedFact: MemorySuggestion | null = null;
  if (liveAllowed) {
    suggestedFact = await suggestMemoryFact([...history, { role: "assistant", content: replyText }]);
  }

  return NextResponse.json({ userMessage, eyeweeMessage, suggestedFact });
}
