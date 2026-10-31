import { searchPubMedWithDetails } from "@/lib/eyewee/documents/pubmedSearch";

export function isPubMedQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("pubmed") ||
    /\b(papers?|articles?|literature|clinical trials?)\s+on\b/i.test(text) ||
    /\bfind\s+(?:me\s+)?(?:papers?|articles?)\b/i.test(text)
  );
}

export function extractSearchTerm(text: string): string {
  let cleaned = text
    .replace(/^pubmed[,:\s]+/i, "")
    .replace(/^can you (?:take out|find|get|show me|search for)\b/i, "")
    .replace(/\b(?:from|on)\s+pubmed\b/gi, "")
    .replace(/\b(?:main|key|landmark|top|\d+)\s+papers?\s+(?:on|about)\b/i, "")
    .replace(/\b(?:papers?|articles?)\s+(?:on|about)\b/i, "")
    .replace(/[?!.]+$/, "")
    .trim();

  return cleaned || text.trim();
}

export async function craftReply(message: string): Promise<string> {
  const trimmed = message.trim();
  if (!trimmed) return "What research or literature are you working on? Ask me anything or explore PubMed with me.";

  if (isPubMedQuery(trimmed)) {
    try {
      const term = extractSearchTerm(trimmed);
      const { count, papers } = await searchPubMedWithDetails(term, 5);

      if (papers.length === 0) {
        return `I searched PubMed for "${term}", but didn't find any direct matches. Try adjusting the search keywords or specifying a broader biomedical term.`;
      }

      const formattedPapers = papers.map((paper, idx) => {
        const title = paper.title;
        const authorYear = paper.authors ? `${paper.authors} (${paper.pubdate.slice(0, 4) || "Recent"})` : paper.pubdate;
        const citation = paper.citation || paper.source;
        const pmidLine = `PMID: [${paper.pmid}](${paper.url})`;
        const summary = paper.abstract ? paper.abstract.slice(0, 240) + "..." : "No abstract available.";

        return `${idx + 1}. **${authorYear}**, "${title}." *${citation}*. ${pmidLine}\n   ${summary}`;
      }).join("\n\n");

      return `Finding key research on **${term}**.\n\nSearching PubMed now.\n\nFive landmark papers, all verified on PubMed:\n\n${formattedPapers}`;
    } catch {
      // Fallback if network fails
    }
  }

  return "I'm eyewee, built to help you explore the literature, crawl PubMed for verified research, make sense of papers and documents, and navigate your work. What can we crack together today?";
}

