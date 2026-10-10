import "server-only";

// A real literature-search tool for postdocs inside Document Search -- distinct from the Leverage
// novelty-check (lib/eyewee/leverage/novelty.ts, which checks whether a finding is already
// reported) and from the PostdocWorks-papers-by-ORCID lookup (lib/eyewee/postdocworks/papers.ts,
// which is "find this specific person's own papers"). This one is a plain keyword search so a
// postdoc can find *other people's* papers to read and then search inside.
const NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export type PubMedSearchHit = { pmid: string; title: string; source: string; pubdate: string; url: string };

export async function searchPubMed(term: string, limit = 10): Promise<{ count: number; hits: PubMedSearchHit[] }> {
  const search = await fetch(`${NCBI_BASE}/esearch.fcgi?db=pubmed&retmode=json&retmax=${limit}&term=${encodeURIComponent(term)}`, {
    headers: { Accept: "application/json" },
  });
  if (!search.ok) throw new Error(`PubMed search failed (${search.status}).`);
  const searchData = (await search.json()) as { esearchresult?: { count?: string; idlist?: string[] } };
  const ids = searchData.esearchresult?.idlist ?? [];
  const count = Number(searchData.esearchresult?.count ?? "0");
  if (ids.length === 0) return { count, hits: [] };

  const summary = await fetch(`${NCBI_BASE}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`, {
    headers: { Accept: "application/json" },
  });
  if (!summary.ok) throw new Error(`PubMed summary failed (${summary.status}).`);
  const summaryData = (await summary.json()) as { result?: Record<string, { title?: string; source?: string; pubdate?: string }> };

  const hits = ids.map((pmid) => {
    const doc = summaryData.result?.[pmid];
    return {
      pmid,
      title: doc?.title ?? "(untitled)",
      source: doc?.source ?? "",
      pubdate: doc?.pubdate ?? "",
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    };
  });
  return { count, hits };
}

export async function fetchAbstract(pmid: string): Promise<{ title: string; abstract: string }> {
  const response = await fetch(`${NCBI_BASE}/efetch.fcgi?db=pubmed&id=${encodeURIComponent(pmid)}&rettype=abstract&retmode=text`);
  if (!response.ok) throw new Error(`PubMed fetch failed (${response.status}).`);
  const text = (await response.text()).trim();

  // efetch's plain-text format puts the title on its own line after the citation line, then a
  // blank line, then author/affiliation lines, then the abstract body itself after another blank
  // gap -- there's no structured field for "just the abstract," so this is a best-effort split on
  // the actual text layout, not a documented API contract.
  const lines = text.split("\n");
  const title = lines[2]?.trim() || "(untitled)";
  return { title, abstract: text };
}
