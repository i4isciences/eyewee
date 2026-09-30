// Leverage pillar -- deck-generation service, Layer 6 ("Present") of the six-layer pipeline
// (lib/eyewee/leverage/pipeline.ts). Locked shape per that pipeline's contract: always two
// editions together (layman + technical), never an opt-in toggle -- the technical edition carries
// a "reversal line" on every slide (a scripted fallback line, for if the presenter blanks out
// mid-talk), the layman edition doesn't.
//
// Drafting real slide content is a generative-writing task that needs the live Claude model, so it
// stays behind the crisis-response gate (lib/eyewee/guardrails/crisisGate.ts) same as chat. What
// ships now is the data model, matching the existing "still being built" canned-reply pattern
// elsewhere in this repo, so the feature is demoable end to end before the model call is live.

export type DeckEditionKind = "layman" | "technical";

export type DeckSlide = {
  title: string;
  body: string;
  reversalLine?: string;
};

export type DeckEdition = {
  kind: DeckEditionKind;
  slides: DeckSlide[];
  downloadUrl: string;
};

export type DeckPair = {
  laymanEdition: DeckEdition;
  technicalEdition: DeckEdition;
};

const SLIDE_TOPICS = ["Background", "What we found", "Why it matters", "What's next"];

function placeholderTechnicalSlides(sourceContent: string): DeckSlide[] {
  return SLIDE_TOPICS.map((title) => ({
    title,
    body: `[Placeholder — real drafting from "${sourceContent}" ships once the crisis-response gate opens; see docs/DEVELOPMENT_PLAN.md §6.10.]`,
    reversalLine: `If you blank out here: "In short, on ${title.toLowerCase()}, the key point is..."`,
  }));
}

function placeholderLaymanSlides(sourceContent: string): DeckSlide[] {
  return SLIDE_TOPICS.map((title) => ({
    title,
    body: `[Placeholder, plain-language version — real drafting from "${sourceContent}" ships once the crisis-response gate opens.]`,
  }));
}

// downloadUrl left empty: the export format (PPTX vs. HTML/PDF) hasn't been decided yet --
// docs/DEVELOPMENT_PLAN.md §8.1 item 5.
export async function generateDeckPair(sourceContent: string): Promise<DeckPair> {
  return {
    laymanEdition: { kind: "layman", slides: placeholderLaymanSlides(sourceContent), downloadUrl: "" },
    technicalEdition: { kind: "technical", slides: placeholderTechnicalSlides(sourceContent), downloadUrl: "" },
  };
}
