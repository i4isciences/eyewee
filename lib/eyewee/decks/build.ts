import "server-only";

import PptxGenJS from "pptxgenjs";
import type { DeckJson } from "@/lib/eyewee/decks/schema";

// Navy + gold template (brief, Step 5). Calibri only, white content slides, three layouts: title,
// content, closing. Every slide carries a visible "Generated ... CT" footer. Speaker notes go in
// the PowerPoint notes field, never on the slide.
const NAVY = "1F2A44";
const GOLD = "C9A227";
const INK = "1F2A44";
const FONT = "Calibri";
const CT = "America/Chicago";

export function formatGeneratedStamp(date: Date): string {
  const text = new Intl.DateTimeFormat("en-US", {
    timeZone: CT,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `Generated ${text} CT`;
}

// e.g. 2026-10-26_1912CT
export function fileStamp(date: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: CT,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}_${parts.hour}${parts.minute}CT`;
}

export function deckFilename(edition: DeckJson["edition"], date: Date): string {
  return `eyewee_${edition === "layman" ? "Layman" : "Technical"}_Deck_${fileStamp(date)}.pptx`;
}

// PowerPoint and Google Slides don't reliably apply "shrink on overflow" to files written by a
// library, so the font size is chosen up front from a conservative height estimate instead.
function fitFontSize(texts: string[], widthIn: number, heightIn: number, maxSize: number, minSize: number, gapPt = 0): number {
  for (let size = maxSize; size > minSize; size -= 1) {
    const charsPerLine = Math.max(1, Math.floor((widthIn * 72) / (size * 0.52)) - 4); // minus bullet indent
    const lines = texts.reduce((sum, t) => sum + Math.max(1, Math.ceil(t.length / charsPerLine)), 0);
    const heightPt = lines * size * 1.25 + texts.length * gapPt;
    if (heightPt / 72 <= heightIn) return size;
  }
  return minSize;
}

function addFooter(slide: PptxGenJS.Slide, stamp: string, color: string, pageNumber: number) {
  slide.addText(stamp, { x: 0.5, y: 7.05, w: 9, h: 0.3, fontFace: FONT, fontSize: 10, color });
  slide.addText(`eyewee℠  |  ${pageNumber}`, { x: 9.8, y: 7.05, w: 3.0, h: 0.3, fontFace: FONT, fontSize: 10, color, align: "right" });
}

export async function buildDeckBuffer(deck: DeckJson, generatedAt: Date): Promise<Buffer> {
  const stamp = formatGeneratedStamp(generatedAt);
  const editionLabel = deck.edition === "technical" ? "Technical Edition" : "Layman's Edition";
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
  pptx.title = deck.deck_title;
  pptx.company = "i4iSciences";
  pptx.author = "eyewee℠";

  // --- Title slide ---
  const title = pptx.addSlide();
  title.background = { color: NAVY };
  title.addShape("rect", { x: 0.8, y: 2.0, w: 0.12, h: 2.6, fill: { color: GOLD }, line: { color: GOLD } });
  title.addText("eyewee℠  ·  " + editionLabel.toUpperCase(), { x: 1.2, y: 1.4, w: 11, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: GOLD, charSpacing: 3 });
  title.addText(deck.deck_title, { x: 1.2, y: 2.0, w: 11, h: 1.9, fontFace: FONT, fontSize: fitFontSize([deck.deck_title], 11, 1.9, 40, 22) , bold: true, color: "FFFFFF", valign: "top" });
  title.addText(`Prepared for: ${deck.audience}`, { x: 1.2, y: 4.0, w: 11, h: 0.6, fontFace: FONT, fontSize: 18, color: "FFFFFF" });
  addFooter(title, stamp, "D9DEE9", 1);

  // --- Content slides ---
  deck.slides.forEach((s, i) => {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addText(s.title, { x: 0.6, y: 0.4, w: 12.1, h: 1.0, fontFace: FONT, fontSize: fitFontSize([s.title], 12.1, 1.0, 30, 18), bold: true, color: NAVY, valign: "middle" });
    slide.addShape("line", { x: 0.6, y: 1.5, w: 12.1, h: 0, line: { color: GOLD, width: 3 } });

    const technical = deck.edition === "technical";
    const bodyH = technical ? 3.9 : 5.2;
    slide.addText(
      s.bullets.map((b) => ({ text: b, options: { bullet: { code: "25CF" }, breakLine: true } })),
      { x: 0.7, y: 1.75, w: 11.9, h: bodyH, fontFace: FONT, fontSize: fitFontSize(s.bullets, 11.9, bodyH, 22, 14, 10), color: INK, valign: "top", paraSpaceAfter: 10 }
    );

    if (technical) {
      slide.addText(
        [
          { text: "If you lose your place, say: ", options: { bold: true, color: GOLD } },
          { text: s.reversal_line, options: { italic: true, color: INK } },
        ],
        { x: 0.7, y: 5.8, w: 11.9, h: 0.95, fontFace: FONT, fontSize: fitFontSize([`If you lose your place, say: ${s.reversal_line}`], 11.5, 0.8, 14, 10), valign: "middle", margin: 8, line: { color: GOLD, width: 1.5 } }
      );
    }

    // Notes live in the PowerPoint notes field. The layman edition keeps its reversal line there too.
    const notes = deck.edition === "layman" && s.reversal_line ? `${s.speaker_notes}\n\nReversal line: ${s.reversal_line}` : s.speaker_notes;
    if (notes) slide.addNotes(notes);

    addFooter(slide, stamp, "5A6275", i + 2);
  });

  // --- Closing slide ---
  const closing = pptx.addSlide();
  closing.background = { color: NAVY };
  closing.addText("Thank you", { x: 1.2, y: 2.4, w: 11, h: 1.2, fontFace: FONT, fontSize: 44, bold: true, color: "FFFFFF" });
  closing.addShape("line", { x: 1.2, y: 3.7, w: 3, h: 0, line: { color: GOLD, width: 3 } });
  closing.addText("Questions and discussion", { x: 1.2, y: 3.9, w: 11, h: 0.6, fontFace: FONT, fontSize: 20, color: "FFFFFF" });
  addFooter(closing, stamp, "D9DEE9", deck.slides.length + 2);

  const out = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return out;
}
