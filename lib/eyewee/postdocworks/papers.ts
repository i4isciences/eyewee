import "server-only";

// A postdoc's actual PubMed papers, found live via their verified ORCID -- postdocworks only
// stores a single credential-verification `pmid` field today (see
// postdocworks_field_scope_strategy.md's own note that this needs generalizing later), not a full
// publication list. PubMed's `[auid]` search field accepts an ORCID directly (confirmed live,
// 2026-10-09) and returns everything indexed under it -- a real, complete list, not a single
// credential record.
const NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export type PubMedPaper = { pmid: string; title: string; source: string; pubdate: string; url: string };

export async function getPapersByOrcid(orcid: string, limit = 20): Promise<PubMedPaper[]> {
  const term = `${orcid}[auid]`;
  const search = await fetch(`${NCBI_BASE}/esearch.fcgi?db=pubmed&retmode=json&retmax=${limit}&term=${encodeURIComponent(term)}`, {
    headers: { Accept: "application/json" },
  });
  if (!search.ok) throw new Error(`PubMed search failed (${search.status}).`);
  const searchData = (await search.json()) as { esearchresult?: { idlist?: string[] } };
  const ids = searchData.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  const summary = await fetch(`${NCBI_BASE}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`, {
    headers: { Accept: "application/json" },
  });
  if (!summary.ok) throw new Error(`PubMed summary failed (${summary.status}).`);
  const summaryData = (await summary.json()) as { result?: Record<string, { title?: string; source?: string; pubdate?: string }> };

  return ids.map((pmid) => {
    const doc = summaryData.result?.[pmid];
    return {
      pmid,
      title: doc?.title ?? "(untitled)",
      source: doc?.source ?? "",
      pubdate: doc?.pubdate ?? "",
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    };
  });
}
