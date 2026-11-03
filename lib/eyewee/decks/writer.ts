import "server-only";

import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, getEyeweeModel } from "@/lib/eyewee/claude/client";
import { DECK_JSON_SCHEMA, DECK_LIMITS, validateDeck, type DeckEditionName, type DeckJson } from "@/lib/eyewee/decks/schema";

export type VerifiedReference = { pmid: string; citation: string };

export type DeckBrief = {
  topic: string;
  audience: string;
  slideCount: number;
  sourceMaterial: string;
  references: VerifiedReference[];
};

const EDITION_RULES: Record<DeckEditionName, string> = {
  layman:
    "LAYMAN'S EDITION: plain, easy-to-follow language for a smart non-specialist. Define or avoid jargon. Short sentences. Explain why each point matters.",
  technical:
    "TECHNICAL EDITION: pitched at the postdoc's own level of expertise, with the precise terminology, methods and caveats a PI and lab group expect.",
};

function systemPrompt(edition: DeckEditionName): string {
  return `You are eyewee, writing slide content for a postdoc. Return ONLY the deck JSON.

${EDITION_RULES[edition]}

Hard rules:
- Use ONLY the postdoc's own material below. Do not invent data, results, numbers, methods or citations. If the material doesn't cover something, leave it out rather than guessing.
- Cite a paper only if it appears in the VERIFIED REFERENCES list, and then cite it as "(PMID 12345678)". Never write any other PMID, DOI, author-year or journal citation.
- Do not mention photos of real people.
- Write "eyewee" in lowercase if you mention it at all.
- Exactly the requested number of content slides. At most ${DECK_LIMITS.maxBullets} bullets per slide and about 12 words per bullet.
- Every slide needs a reversal_line: one sentence the presenter can read word for word if they lose their place.
- speaker_notes: 2-4 sentences of what to say on that slide. Notes are not shown on the slide.
- "edition" must be "${edition}".`;
}

function userPrompt(brief: DeckBrief, retryErrors?: string[]): string {
  const refs = brief.references.length
    ? brief.references.map((r) => `- PMID ${r.pmid}: ${r.citation}`).join("\n")
    : "(none -- do not cite any papers)";
  let text = `Topic: ${brief.topic}
Audience: ${brief.audience}
Number of content slides: ${brief.slideCount}

POSTDOC'S OWN MATERIAL:
${brief.sourceMaterial || "(none supplied beyond the topic -- keep slides general and do not invent specifics)"}

VERIFIED REFERENCES:
${refs}`;
  if (retryErrors?.length) {
    text += `\n\nYour previous attempt failed validation. Fix all of these:\n${retryErrors.map((e) => `- ${e}`).join("\n")}`;
  }
  return text;
}

// Any PMID mentioned in a deck must come from the literature tool's results (brief, rule 3).
function unverifiedPmids(deck: DeckJson, references: VerifiedReference[]): string[] {
  const allowed = new Set(references.map((r) => r.pmid));
  const text = [deck.deck_title, ...deck.slides.flatMap((s) => [s.title, ...s.bullets, s.speaker_notes, s.reversal_line])].join("\n");
  const found = [...text.matchAll(/PMID\s*:?\s*(\d{5,9})/gi)].map((m) => m[1]);
  return [...new Set(found.filter((pmid) => !allowed.has(pmid)))];
}

// Citation styles other than "(PMID n)" can't be traced to the literature tool, so they are rejected.
function unverifiableCitations(deck: DeckJson): string[] {
  const text = [deck.deck_title, ...deck.slides.flatMap((s) => [s.title, ...s.bullets, s.speaker_notes, s.reversal_line])].join(" ");
  const patterns = [/\b10\.\d{4,9}\/\S+/g, /\bdoi:/gi, /\(\s*[A-Z][A-Za-z'-]+(?: et al\.?| and [A-Z][A-Za-z'-]+)?,?\s+(?:19|20)\d{2}[a-z]?\s*\)/g];
  return patterns.flatMap((re) => text.match(re) ?? []);
}

async function attempt(edition: DeckEditionName, brief: DeckBrief, retryErrors?: string[]): Promise<{ deck?: DeckJson; errors: string[] }> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: getEyeweeModel(),
    max_tokens: 16000,
    system: systemPrompt(edition),
    messages: [{ role: "user", content: userPrompt(brief, retryErrors) }],
    output_config: { format: { type: "json_schema", schema: DECK_JSON_SCHEMA as unknown as Record<string, unknown> } },
  });

  if (response.stop_reason === "refusal") return { errors: ["The model declined to write this deck."] };
  if (response.stop_reason === "max_tokens") return { errors: ["The deck was cut off before it finished."] };

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { errors: ["Response was not valid JSON."] };
  }

  const validation = validateDeck(parsed, edition);
  if (!validation.ok) return { errors: validation.errors };

  const strays = unverifiedPmids(validation.deck, brief.references);
  if (strays.length) return { errors: [`Remove unverified PMIDs: ${strays.join(", ")}. Cite only the VERIFIED REFERENCES.`] };

  const stray = unverifiableCitations(validation.deck);
  if (stray.length) return { errors: [`Remove these citations (only "(PMID n)" for VERIFIED REFERENCES is allowed): ${stray.slice(0, 3).join("; ")}`] };

  return { deck: validation.deck, errors: [] };
}

// Writes one edition. Invalid JSON gets exactly one retry (brief, Step 7); then it fails plainly.
export async function writeDeck(edition: DeckEditionName, brief: DeckBrief): Promise<DeckJson> {
  const first = await attempt(edition, brief);
  if (first.deck) return first.deck;
  const second = await attempt(edition, brief, first.errors);
  if (second.deck) return second.deck;
  throw new Error(`Could not produce a valid ${edition} deck: ${second.errors.slice(0, 3).join(" ")}`);
}
