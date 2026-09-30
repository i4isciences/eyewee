import "server-only";

// The single, explicit, auditable switch for whether a message may reach a live model at all.
// Per docs/DEVELOPMENT_PLAN.md §6.6 / §8.2: this stays closed until legal clearance + a
// mental-health-professional review sign off -- "build it, don't launch it." Closed by default in
// every environment unless the env var is explicitly set to "true" (never infer "open" from its
// absence or from any other flag).
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
