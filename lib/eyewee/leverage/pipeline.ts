// eyewee's "crack the project" six-layer pipeline — the map of what a
// postdoc has to do to execute an inherited, unsolved research project.
//
// LOCKED SPEC — see eyewee_six_layer_pipeline.docx / .html for the full
// writeup this code implements. Do not add layers, reorder them, or widen
// eyewee's supported set without updating that doc first — this file and
// the doc must stay in sync.
//
// Scope boundary (permanent, not a TODO):
//   eyewee only ever builds Layer 2 (literature synthesis) and Layer 6
//   (presentation). Layers 3-5 are guarded below so they can never
//   silently get "helpfully" implemented in a later feature branch.
//   Why: automating layers 3-5 would (a) make postdocs feel replaced by
//   the tool, and (b) let a PI use eyewee to justify not hiring a
//   postdoc at all. See "Scope boundary" in the reference doc.
//
// Layer 4's description below uses field-neutral wording ("build the
// missing method or tool") per postdocworks_field_scope_strategy.md's
// de-jargoning guidance -- the original bench-science phrasing
// ("assays and protocols") is reused verbatim in that same doc as the
// worked example of what to change, so it's fixed here rather than left
// for a later pass.

export enum PipelineLayer {
  UNDERSTAND = 1,
  SYNTHESIZE_LITERATURE = 2,
  SELF_ASSESS = 3,
  DEVELOP = 4,
  INTERPRET = 5,
  PRESENT = 6,
}

export interface PipelineLayerSpec {
  layer: PipelineLayer;
  name: string;
  description: string;
  eyeweeSupported: boolean;
}

export const PIPELINE_SPEC: readonly PipelineLayerSpec[] = [
  {
    layer: PipelineLayer.UNDERSTAND,
    name: "Understand",
    description: "Grasp the concept, project, or question in plain language.",
    eyeweeSupported: false,
  },
  {
    layer: PipelineLayer.SYNTHESIZE_LITERATURE,
    name: "Synthesize literature",
    description:
      "Work through roughly 200 papers to find what's missing or unproven — evidence checked across multiple research groups, not one paper alone.",
    eyeweeSupported: true,
  },
  {
    layer: PipelineLayer.SELF_ASSESS,
    name: "Self-assess",
    description: "Check whether the postdoc's own skills match what the solution actually needs.",
    eyeweeSupported: false,
  },
  {
    layer: PipelineLayer.DEVELOP,
    name: "Develop",
    description: "If skills don't match, build the missing method or tool required.",
    eyeweeSupported: false,
  },
  {
    layer: PipelineLayer.INTERPRET,
    name: "Interpret",
    description: "Make sense of the resulting data.",
    eyeweeSupported: false,
  },
  {
    layer: PipelineLayer.PRESENT,
    name: "Present",
    description: "Bring findings back to the PI and the full research group.",
    eyeweeSupported: true,
  },
] as const;

/**
 * The two layers eyewee is ever allowed to automate. Locked, permanent
 * product boundary — not a placeholder for "not built yet."
 */
export const EYEWEE_SUPPORTED_LAYERS: ReadonlySet<PipelineLayer> = new Set([
  PipelineLayer.SYNTHESIZE_LITERATURE,
  PipelineLayer.PRESENT,
]);

export function isLayerSupported(layer: PipelineLayer): boolean {
  return EYEWEE_SUPPORTED_LAYERS.has(layer);
}

/**
 * Guard to call before wiring any new feature into a pipeline layer.
 * Throws loudly rather than letting an out-of-scope layer (3, 4, or 5)
 * quietly ship. Call this at the top of any handler that claims to serve
 * a PipelineLayer.
 */
export function assertLayerInScope(layer: PipelineLayer): void {
  if (!isLayerSupported(layer)) {
    const spec = PIPELINE_SPEC.find((s) => s.layer === layer);
    throw new Error(
      `PipelineLayer.${PipelineLayer[layer]} ("${spec?.name}") is permanently out of scope for eyewee. ` +
        `This is a locked product boundary, not a TODO — see the six-layer pipeline reference doc before overriding this.`
    );
  }
}

// ---------------------------------------------------------------------------
// Layer 2 — Synthesize literature
// Orchestration wrapper around the existing novelty-search service
// (lib/eyewee/leverage/novelty.ts — already built and live-tested against
// NCBI/EBI). This function just enforces the scope guard and gives the
// pipeline a stable entry point independent of how novelty.ts evolves.
// ---------------------------------------------------------------------------

export interface LiteratureGapRequest {
  postdocId: string;
  researchQuestion: string;
  /** e.g. PubMed / GenBank / EMBL — whatever novelty.ts already queries. */
  sources?: string[];
}

export interface LiteratureGapResult {
  summary: string;
  gapsFound: string[];
  papersReviewed: number;
  citedSources: { title: string; source: string; url: string }[];
}

export interface NoveltyService {
  findGaps: (req: LiteratureGapRequest) => Promise<LiteratureGapResult>;
}

export async function runSynthesizeLiteratureLayer(
  req: LiteratureGapRequest,
  novelty: NoveltyService
): Promise<LiteratureGapResult> {
  assertLayerInScope(PipelineLayer.SYNTHESIZE_LITERATURE);
  return novelty.findGaps(req);
}

// ---------------------------------------------------------------------------
// Layer 6 — Present
// Orchestration wrapper around the existing deck service
// (lib/eyewee/leverage/decks.ts).
// ---------------------------------------------------------------------------

export interface DeckRequest {
  postdocId: string;
  topic: string;
  /** Feeds the deck — e.g. output of Layer 2, or the postdoc's own notes. */
  sourceContent: string;
}

export interface DeckSlide {
  title: string;
  body: string;
  /** Only present on the technical edition — required on every slide there. */
  reversalLine?: string;
}

export interface DeckEdition {
  kind: "layman" | "technical";
  slides: DeckSlide[];
  downloadUrl: string;
}

export interface DeckResult {
  laymanEdition: DeckEdition;
  technicalEdition: DeckEdition;
}

export interface DecksService {
  generateDeckPair: (req: DeckRequest) => Promise<DeckResult>;
}

/**
 * LOCKED: always generates both editions together — never an opt-in
 * toggle. See "Layer 6 in practice" in the pipeline reference doc. This
 * wrapper enforces that contract even if decks.ts's own implementation
 * changes later.
 */
export async function runPresentLayer(req: DeckRequest, decks: DecksService): Promise<DeckResult> {
  assertLayerInScope(PipelineLayer.PRESENT);
  const result = await decks.generateDeckPair(req);

  if (!result.laymanEdition || !result.technicalEdition) {
    throw new Error(
      "runPresentLayer: both laymanEdition and technicalEdition are required on every call — " +
        "generating only one edition violates the locked Layer 6 spec."
    );
  }

  const missingReversalLines = result.technicalEdition.slides.filter((s) => !s.reversalLine);
  if (missingReversalLines.length > 0) {
    throw new Error(
      `runPresentLayer: ${missingReversalLines.length} slide(s) in the technical edition are missing a reversal line — every slide needs one.`
    );
  }

  return result;
}
