import "server-only";

// A real literature-search tool for postdocs inside Document Search -- distinct from the Leverage
// novelty-check (lib/eyewee/leverage/novelty.ts, which checks whether a finding is already
// reported) and from the PostdocWorks-papers-by-ORCID lookup (lib/eyewee/postdocworks/papers.ts,
// which is "find this specific person's own papers"). This one is a plain keyword search so a
// postdoc can find *other people's* papers to read and then search inside.
const NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export type PubMedSearchHit = {
  pmid: string;
  title: string;
  source: string;
  pubdate: string;
  authors: string;
  citation: string;
  doi: string;
  url: string;
};

export type PubMedPaperDetail = PubMedSearchHit & {
  abstract: string;
};

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
  const summaryData = (await summary.json()) as {
    result?: Record<
      string,
      {
        title?: string;
        source?: string;
        pubdate?: string;
        sortfirstauthor?: string;
        volume?: string;
        issue?: string;
        pages?: string;
        authors?: Array<{ name?: string }>;
        articleids?: Array<{ idtype?: string; value?: string }>;
      }
    >;
  };

  const hits: PubMedSearchHit[] = ids.map((pmid) => {
    const doc = summaryData.result?.[pmid];
    const firstAuthor = doc?.sortfirstauthor || doc?.authors?.[0]?.name || "";
    const hasMoreAuthors = (doc?.authors?.length ?? 0) > 1;
    const authorStr = firstAuthor ? (hasMoreAuthors ? `${firstAuthor} et al.` : firstAuthor) : "";
    const doiObj = doc?.articleids?.find((a) => a.idtype === "doi");
    const doi = doiObj?.value ?? "";
    const volumeIssue = doc?.volume ? `${doc.volume}${doc.issue ? `(${doc.issue})` : ""}${doc.pages ? `:${doc.pages}` : ""}` : "";
    const citation = [doc?.source, volumeIssue].filter(Boolean).join(" ").trim();

    return {
      pmid,
      title: doc?.title ? doc.title.replace(/\.$/, "") : "(untitled)",
      source: doc?.source ?? "",
      pubdate: doc?.pubdate ?? "",
      authors: authorStr,
      citation: citation || doc?.source || "",
      doi,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    };
  });
  return { count, hits };
}

export async function fetchAbstract(pmid: string): Promise<{ title: string; abstract: string }> {
  const response = await fetch(`${NCBI_BASE}/efetch.fcgi?db=pubmed&id=${encodeURIComponent(pmid)}&rettype=abstract&retmode=text`);
  if (!response.ok) throw new Error(`PubMed fetch failed (${response.status}).`);
  const text = (await response.text()).trim();

  const lines = text.split("\n");
  const title = lines[2]?.trim() || "(untitled)";
  return { title, abstract: text };
}

export async function searchPubMedWithDetails(term: string, limit = 5): Promise<{ count: number; papers: PubMedPaperDetail[] }> {
  const { count, hits } = await searchPubMed(term, limit);
  if (hits.length === 0) return { count, papers: [] };

  const papers = await Promise.all(
    hits.map(async (hit) => {
      try {
        const { abstract } = await fetchAbstract(hit.pmid);
        return { ...hit, abstract };
      } catch {
        return { ...hit, abstract: "" };
      }
    })
  );

  return { count, papers };
}
