import "server-only";

import { generateEyeweeReply, type ChatTurn } from "@/lib/eyewee/claude/client";
import { isSafeToRemember } from "@/lib/eyewee/guardrails/memorySafety";
import type { MemoryCategory } from "@/lib/eyewee/memory";

const SUGGESTION_PROMPT = `You are reviewing a conversation between eyewee (an AI assistant for postdocs) and a postdoc, to decide if there is ONE short, durable, non-sensitive fact worth remembering for future conversations.

Only suggest something from these categories: field (their research field), focus (their specific project/focus area), badge (a credential/achievement they mentioned), preference (how they like to work or communicate), other (a genuinely durable, harmless fact).

NEVER suggest anything about: mental health, crisis, medical conditions, immigration/visa case specifics, or other sensitive personal information. If the only candidate fact falls in one of those categories, respond with exactly "NONE".

If there's nothing worth remembering at all, respond with exactly "NONE".

Otherwise respond in exactly this format (one line, no extra text):
CATEGORY: fact text here`;

export type MemorySuggestion = { text: string; category: MemoryCategory };

const VALID_CATEGORIES: MemoryCategory[] = ["field", "focus", "badge", "preference", "other"];

export async function suggestMemoryFact(history: ChatTurn[]): Promise<MemorySuggestion | null> {
  try {
    // Claude's Messages API requires the turn list to end with a "user" message -- the real
    // conversation (passed in from the send endpoint) ends with eyewee's own reply, so this isn't
    // "continuing" that conversation. It's a separate judgment call *about* it: the whole
    // transcript gets flattened into one user-role message instead of replayed turn-by-turn.
    const transcript = history.map((turn) => `${turn.role === "user" ? "Postdoc" : "eyewee"}: ${turn.content}`).join("\n");
    const reviewTurn: ChatTurn = { role: "user", content: `Conversation so far:\n${transcript}` };

    const raw = await generateEyeweeReply(SUGGESTION_PROMPT, [reviewTurn]);
    const trimmed = raw.trim();
    if (!trimmed || trimmed.toUpperCase().startsWith("NONE")) return null;

    const match = trimmed.match(/^(\w+):\s*([\s\S]+)$/);
    if (!match) return null;

    const category = match[1].toLowerCase() as MemoryCategory;
    const text = match[2].trim();
    if (!VALID_CATEGORIES.includes(category) || !text) return null;
    if (!isSafeToRemember(text)) return null; // defense in depth -- never trust the prompt alone

    return { text, category };
  } catch {
    return null; // a failed suggestion call should never break the actual chat reply
  }
}
