import "server-only";

import { checkRateLimit } from "@/lib/eyewee/rateLimit";
import { buildDeckBuffer, deckFilename, formatGeneratedStamp } from "@/lib/eyewee/decks/build";
import { storeDeck } from "@/lib/eyewee/decks/storage";
import { writeDeck, type DeckBrief, type VerifiedReference } from "@/lib/eyewee/decks/writer";
import { DECK_LIMITS, validateDeck, type DeckEditionName, type DeckJson } from "@/lib/eyewee/decks/schema";

export const DECK_RATE_LIMIT = 10;
export const DECK_RATE_WINDOW_MS = 60 * 60 * 1000;

export type DeckRequestInput = {
  deviceId: string;
  topic: string;
  audience: string;
  slideCount: number;
  sourceMaterial: string;
  references?: VerifiedReference[];
};

export type DeckFileLink = { edition: DeckEditionName; label: string; filename: string; url: string };

export type DeckPairResult =
  | { ok: true; generatedAt: string; stamp: string; files: DeckFileLink[] }
  | { ok: false; status: number; error: string };

// Step 4 check ("the route returns two valid .pptx for the test JSON"): build + store from two
// already-written deck JSONs, skipping the model. Both must pass the validator.
export async function buildDeckPairFromJson(input: { deviceId: string; layman: unknown; technical: unknown }): Promise<DeckPairResult> {
  const limit = checkRateLimit(`decks:${input.deviceId}`, DECK_RATE_LIMIT, DECK_RATE_WINDOW_MS);
  if (!limit.allowed) {
    return { ok: false, status: 429, error: `You've reached the limit of ${DECK_RATE_LIMIT} decks per hour. Please try again a little later.` };
  }
  const a = validateDeck(input.layman, "layman");
  const b = validateDeck(input.technical, "technical");
  if (!a.ok || !b.ok) {
    const errors = [...(a.ok ? [] : a.errors.map((e) => `layman: ${e}`)), ...(b.ok ? [] : b.errors.map((e) => `technical: ${e}`))];
    return { ok: false, status: 400, error: `Deck JSON failed validation. ${errors.slice(0, 5).join(" ")}` };
  }
  return buildAndStore([a.deck, b.deck]);
}

async function buildAndStore(decks: DeckJson[]): Promise<DeckPairResult> {
  const generatedAt = new Date();
  try {
    const files = await Promise.all(
      decks.map(async (deck) => {
        const buffer = await buildDeckBuffer(deck, generatedAt);
        const filename = deckFilename(deck.edition, generatedAt);
        const url = await storeDeck(filename, buffer, generatedAt);
        return {
          edition: deck.edition,
          label: deck.edition === "layman" ? "Layman's Edition" : "Technical Edition",
          filename,
          url,
        } satisfies DeckFileLink;
      })
    );
    return { ok: true, generatedAt: generatedAt.toISOString(), stamp: formatGeneratedStamp(generatedAt), files };
  } catch (err) {
    console.error("Deck build/storage failed:", err);
    return { ok: false, status: 502, error: "The decks were written, but I couldn't build or store the files, so there is nothing to download." };
  }
}

// One pipeline for both the chat tool and /api/decks/generate: validate limits -> write both
// editions together -> build both .pptx -> upload both -> return signed links. Links are only
// returned if every step worked; any failure is reported plainly and no link is ever fabricated.
export async function createDeckPair(input: DeckRequestInput): Promise<DeckPairResult> {
  const topic = input.topic.trim();
  if (!topic) return { ok: false, status: 400, error: "I need a topic for the presentation." };

  if (!Number.isFinite(input.slideCount) || input.slideCount < DECK_LIMITS.minSlides || input.slideCount > DECK_LIMITS.maxSlides) {
    return {
      ok: false,
      status: 400,
      error: `I can build decks of ${DECK_LIMITS.minSlides} to ${DECK_LIMITS.maxSlides} slides. Pick a length in that range, or I can split a longer talk into parts.`,
    };
  }

  const limit = checkRateLimit(`decks:${input.deviceId}`, DECK_RATE_LIMIT, DECK_RATE_WINDOW_MS);
  if (!limit.allowed) {
    return { ok: false, status: 429, error: `You've reached the limit of ${DECK_RATE_LIMIT} decks per hour. Please try again a little later.` };
  }

  const brief: DeckBrief = {
    topic,
    audience: input.audience.trim() || "PI and lab group",
    slideCount: Math.round(input.slideCount),
    sourceMaterial: input.sourceMaterial.trim(),
    references: input.references ?? [],
  };

  let layman, technical;
  try {
    [layman, technical] = await Promise.all([writeDeck("layman", brief), writeDeck("technical", brief)]);
  } catch (err) {
    console.error("Deck writing failed:", err);
    return { ok: false, status: 502, error: "I couldn't write valid decks this time." };
  }

  return buildAndStore([layman, technical]);
}
