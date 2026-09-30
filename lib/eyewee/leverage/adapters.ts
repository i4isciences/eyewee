import "server-only";

import { checkNovelty } from "@/lib/eyewee/leverage/novelty";
import { generateDeckPair } from "@/lib/eyewee/leverage/decks";
import type { DecksService, DeckRequest, DeckResult, NoveltyService, LiteratureGapRequest, LiteratureGapResult } from "@/lib/eyewee/leverage/pipeline";

// Wires pipeline.ts's injected-service interfaces (Layer 2 / Layer 6) to the actual
// implementations. pipeline.ts is written provider-agnostic on purpose (it takes a NoveltyService/
// DecksService, not a hard import) -- this is where that gets satisfied for real.

export const noveltyServiceAdapter: NoveltyService = {
  async findGaps(req: LiteratureGapRequest): Promise<LiteratureGapResult> {
    const result = await checkNovelty(req.researchQuestion);
    return {
      summary: result.summary,
      gapsFound: result.pubmed.count === 0 ? [`No published literature directly addresses: ${req.researchQuestion}`] : [],
      papersReviewed: result.pubmed.count,
      citedSources: result.pubmed.hits.map((hit) => ({
        title: hit.title,
        source: hit.source || "PubMed",
        url: `https://pubmed.ncbi.nlm.nih.gov/${hit.pmid}/`,
      })),
    };
  },
};

export const decksServiceAdapter: DecksService = {
  async generateDeckPair(req: DeckRequest): Promise<DeckResult> {
    const pair = await generateDeckPair(req.sourceContent);
    return pair;
  },
};
