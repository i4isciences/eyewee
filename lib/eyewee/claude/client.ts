import "server-only";

import Anthropic from "@anthropic-ai/sdk";

// Real Claude wiring (docs/DEVELOPMENT_PLAN.md §6.2, Phase 4) -- only ever called from
// app/api/conversations/[id]/messages/route.ts's draftEyeweeReply, gated by
// isLiveChatAllowedForRequest() (lib/eyewee/guardrails/crisisGate.ts). Building this doesn't flip
// that gate for real users; it stays closed by default until legal + mental-health-professional
// clearance, per the product's own locked policy.
//
// Confirmed by Ranjit (2026-10-08): this account is STANDARD API access -- no BAA, no HIPAA
// coverage. Never assume BAA-only features or retention guarantees apply. The PHI filter
// (lib/eyewee/guardrails/phiFilter.ts) stays on regardless of gate state for exactly this reason.
const DEFAULT_MODEL = "claude-sonnet-5";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
  client = new Anthropic({ apiKey });
  return client;
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

export async function generateEyeweeReply(system: string, history: ChatTurn[]): Promise<string> {
  const anthropic = getClient();
  const model = process.env.EYEWEE_CLAUDE_MODEL || DEFAULT_MODEL;

  const response = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system,
    messages: history.map((turn) => ({ role: turn.role, content: turn.content })),
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Claude returned no text content.");
  return textBlock.text;
}
