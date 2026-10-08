import "server-only";

import { isCurrentRequestInternalTester } from "@/lib/eyewee/guardrails/internalTest";

// The single, explicit, auditable switch for whether a message may reach a live model for REAL
// USERS. Per Ranjit, 2026-10-08: needs a lawyer (privacy/AI) and a licensed mental-health
// professional's written sign-off, both reviewed by him, before this ever becomes true. Closed by
// default in every environment unless the env var is explicitly set to "true" (never infer "open"
// from its absence or from any other flag). Do not flip this for internal testing -- see
// isLiveChatAllowedForRequest below, which is the mechanism Ranjit actually asked for instead.
export function isCrisisResponseGateOpen(): boolean {
  return process.env.EYEWEE_CRISIS_RESPONSE_GATE_OPEN === "true";
}

export class CrisisGateClosedError extends Error {
  constructor() {
    super("eyewee's live-model send path is closed pending crisis-response protocol clearance.");
    this.name = "CrisisGateClosedError";
  }
}

// Call this at the top of any endpoint that would send a message to a live model (chat replies,
// deck-generation drafting, the novelty-check summarizer's natural-language mode). Throws rather
// than silently degrading, so a forgotten check fails loudly in development instead of quietly
// shipping live model access.
export function assertCrisisGateOpen(): void {
  if (!isCrisisResponseGateOpen()) throw new CrisisGateClosedError();
}

// What request-handling code should actually check before calling the live Claude client. True if
// either the public gate is open (real clearance granted) OR this specific browser was marked an
// internal tester via /api/internal/enable-testing (team-only, never surfaced in the UI). This is
// the "public switch off, internal testing stays open" split Ranjit asked for -- two independent
// checks, not one flag with an exception baked in.
export async function isLiveChatAllowedForRequest(): Promise<boolean> {
  if (isCrisisResponseGateOpen()) return true;
  return isCurrentRequestInternalTester();
}
