// Deck Maker -- slide JSON contract (see the eyewee Deck Maker build brief, Step 2).
// Claude fills this shape in; the validator below is the gate before anything is built.

export type DeckEditionName = "layman" | "technical";

export type DeckJsonSlide = {
  title: string;
  bullets: string[];
  speaker_notes: string;
  reversal_line: string;
};

export type DeckJson = {
  deck_title: string;
  audience: string;
  edition: DeckEditionName;
  slides: DeckJsonSlide[];
};

export const DECK_LIMITS = {
  minSlides: 3,
  maxSlides: 20,
  maxBullets: 6,
  // The brief says "about 12 words per bullet" -- allow a little slack, reject clear overruns.
  maxBulletWords: 16,
} as const;

// JSON Schema handed to Claude's structured output. Size limits can't be expressed here, so
// validateDeck() enforces them.
export const DECK_JSON_SCHEMA = {
  type: "object",
  properties: {
    deck_title: { type: "string" },
    audience: { type: "string" },
    edition: { type: "string", enum: ["layman", "technical"] },
    slides: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
          speaker_notes: { type: "string" },
          reversal_line: { type: "string" },
        },
        required: ["title", "bullets", "speaker_notes", "reversal_line"],
        additionalProperties: false,
      },
    },
  },
  required: ["deck_title", "audience", "edition", "slides"],
  additionalProperties: false,
} as const;

export type DeckValidation = { ok: true; deck: DeckJson } | { ok: false; errors: string[] };

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function validateDeck(input: unknown, expectedEdition?: DeckEditionName): DeckValidation {
  const errors: string[] = [];
  if (!input || typeof input !== "object") return { ok: false, errors: ["Deck is not an object."] };
  const raw = input as Record<string, unknown>;

  const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

  const deckTitle = str(raw.deck_title);
  const audience = str(raw.audience);
  if (!deckTitle) errors.push("deck_title is required.");
  if (!audience) errors.push("audience is required.");

  const edition = raw.edition;
  if (edition !== "layman" && edition !== "technical") errors.push('edition must be "layman" or "technical".');
  else if (expectedEdition && edition !== expectedEdition) errors.push(`edition must be "${expectedEdition}".`);

  const slidesRaw = raw.slides;
  const slides: DeckJsonSlide[] = [];
  if (!Array.isArray(slidesRaw)) {
    errors.push("slides must be an array.");
  } else {
    if (slidesRaw.length < DECK_LIMITS.minSlides || slidesRaw.length > DECK_LIMITS.maxSlides) {
      errors.push(`A deck needs ${DECK_LIMITS.minSlides} to ${DECK_LIMITS.maxSlides} slides (got ${slidesRaw.length}).`);
    }
    slidesRaw.forEach((slide, index) => {
      const n = index + 1;
      if (!slide || typeof slide !== "object") {
        errors.push(`Slide ${n} is not an object.`);
        return;
      }
      const s = slide as Record<string, unknown>;
      const title = str(s.title);
      const notes = str(s.speaker_notes);
      const reversal = str(s.reversal_line);
      const bullets = Array.isArray(s.bullets) ? s.bullets.map(str) : null;

      if (!title) errors.push(`Slide ${n}: title is required.`);
      if (!bullets) {
        errors.push(`Slide ${n}: bullets must be an array.`);
        return;
      }
      if (bullets.length === 0) errors.push(`Slide ${n}: needs at least one bullet.`);
      if (bullets.length > DECK_LIMITS.maxBullets) errors.push(`Slide ${n}: ${bullets.length} bullets (max ${DECK_LIMITS.maxBullets}).`);
      bullets.forEach((bullet, bi) => {
        if (!bullet) errors.push(`Slide ${n}: bullet ${bi + 1} is empty.`);
        else if (wordCount(bullet) > DECK_LIMITS.maxBulletWords) {
          errors.push(`Slide ${n}: bullet ${bi + 1} is ${wordCount(bullet)} words (aim for about 12).`);
        }
      });
      // Both editions carry a reversal line on every slide (brief, Step 2).
      if (!reversal) errors.push(`Slide ${n}: reversal_line is required.`);
      slides.push({ title, bullets, speaker_notes: notes, reversal_line: reversal });
    });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, deck: { deck_title: deckTitle, audience, edition: edition as DeckEditionName, slides } };
}
