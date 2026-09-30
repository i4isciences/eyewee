// Deck-generation export format (docs/DEVELOPMENT_PLAN.md §8.1 -- resolved 2026-09-30): a
// self-contained, printable HTML document, one slide per printed page, rather than a generated
// PPTX. Chosen specifically because slide *content* is still placeholder text pending the
// crisis-response gate (lib/eyewee/guardrails/crisisGate.ts) -- pulling in a PPTX-generation
// library (e.g. pptxgenjs) is real added weight and surface area for a feature that can't produce
// real content yet. HTML-to-print costs zero new dependencies, works today, and gets a postdoc a
// real file they can already open, print, or "print to PDF" from their browser. Revisit if a real
// .pptx deliverable becomes an actual requirement once Layer 6 content is live.

import type { DeckEdition } from "@/lib/eyewee/leverage/pipeline";

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] as string));
}

export function renderDeckHtml(title: string, edition: DeckEdition): string {
  const editionLabel = edition.kind === "technical" ? "Technical edition" : "Layman's edition";
  const slidesHtml = edition.slides
    .map(
      (slide) => `
    <section class="slide">
      <h2>${escapeHtml(slide.title)}</h2>
      <p>${escapeHtml(slide.body)}</p>
      ${slide.reversalLine ? `<p class="reversal">🎤 ${escapeHtml(slide.reversalLine)}</p>` : ""}
    </section>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)} — ${editionLabel}</title>
<style>
  :root { --navy: #182D5A; --gold: #F4A725; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, "Segoe UI", sans-serif; color: #1B2436; background: #EEF0F4; }
  .slide {
    max-width: 860px; margin: 0 auto 24px; background: #fff; border-radius: 10px;
    padding: 56px 64px; min-height: 480px; box-shadow: 0 20px 50px -30px rgba(24,45,90,0.35);
    page-break-after: always;
  }
  .slide h2 { color: var(--navy); font-size: 28px; margin: 0 0 20px; border-bottom: 3px solid var(--gold); padding-bottom: 12px; }
  .slide p { font-size: 17px; line-height: 1.7; }
  .reversal { color: #b8860f; font-style: italic; margin-top: 24px; }
  .cover { text-align: center; padding-top: 140px; }
  .cover .kicker { color: var(--gold); font-weight: 700; letter-spacing: 0.1em; font-size: 13px; }
  .cover h1 { color: var(--navy); font-size: 34px; }
  @media print { body { background: #fff; } .slide { box-shadow: none; margin-bottom: 0; } }
</style>
</head>
<body>
  <section class="slide cover">
    <p class="kicker">EYEWEE · ${editionLabel.toUpperCase()}</p>
    <h1>${escapeHtml(title)}</h1>
  </section>
  ${slidesHtml}
</body>
</html>`;
}
