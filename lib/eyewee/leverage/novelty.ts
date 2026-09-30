import "server-only";

// Leverage pillar -- novelty-check service (docs/DEVELOPMENT_PLAN.md §6.9). Distinct from
// lib/storage/providers/* (a postdoc's own deposited data): this checks whether a finding has
// already been reported anywhere public -- published literature (PubMed) or raw sequence deposits
// that a literature search alone misses (GenBank, EMBL/ENA). All three are free public APIs; no
// account or paid key is required at the query volumes this feature needs.

const NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const EBI_EMBL_SEARCH = "https://www.ebi.ac.uk/ebisearch/ws/rest/embl";

type NcbiEsearchResult = {
  esearchresult?: { count?: string; idlist?: string[] };
};

type NcbiEsummaryResult = {
  result?: { uids?: string[] } & Record<string, { title?: string; pubdate?: string; source?: string } | unknown>;
};

type EbiSearchResult = {
  hitCount?: number;
  entries?: { id: string }[];
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Novelty-check request failed (${response.status}): ${url}`);
  return response.json() as Promise<T>;
}

export type PubMedHit = { pmid: string; title: string; source: string; pubdate: string };

export async function searchPubMed(term: string, limit = 5): Promise<{ count: number; hits: PubMedHit[] }> {
  const search = await fetchJson<NcbiEsearchResult>(
    `${NCBI_BASE}/esearch.fcgi?db=pubmed&retmode=json&retmax=${limit}&term=${encodeURIComponent(term)}`
  );
  const ids = search.esearchresult?.idlist ?? [];
  const count = Number(search.esearchresult?.count ?? "0");
  if (ids.length === 0) return { count, hits: [] };

  const summary = await fetchJson<NcbiEsummaryResult>(
    `${NCBI_BASE}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`
  );
  const hits: PubMedHit[] = ids.map((pmid) => {
    const doc = summary.result?.[pmid] as { title?: string; source?: string; pubdate?: string } | undefined;
    return { pmid, title: doc?.title ?? "(untitled)", source: doc?.source ?? "", pubdate: doc?.pubdate ?? "" };
  });
  return { count, hits };
}

export async function searchGenBank(term: string, limit = 5): Promise<{ count: number; ids: string[] }> {
  const search = await fetchJson<NcbiEsearchResult>(
    `${NCBI_BASE}/esearch.fcgi?db=nuccore&retmode=json&retmax=${limit}&term=${encodeURIComponent(term)}`
  );
  return { count: Number(search.esearchresult?.count ?? "0"), ids: search.esearchresult?.idlist ?? [] };
}

export async function searchEmbl(term: string, limit = 5): Promise<{ count: number; ids: string[] }> {
  const result = await fetchJson<EbiSearchResult>(
    `${EBI_EMBL_SEARCH}?query=${encodeURIComponent(term)}&format=json&size=${limit}`
  );
  return { count: result.hitCount ?? 0, ids: (result.entries ?? []).map((e) => e.id) };
}

export type NoveltyCheckResult = {
  term: string;
  pubmed: { count: number; hits: PubMedHit[] };
  genbank: { count: number; ids: string[] };
  embl: { count: number; ids: string[] };
  summary: string;
};

// A templated (non-model) summary over the structured hits -- ships now, ungated. The more
// natural-language framing shown in the landing-page demo can layer in once the crisis-response
// gate opens (docs/DEVELOPMENT_PLAN.md §6.9); this covers the same substance without a live model.
function summarize(term: string, pubmed: { count: number }, genbank: { count: number }, embl: { count: number }): string {
  const lines: string[] = [];

  lines.push(
    pubmed.count === 0
      ? `No papers in PubMed link "${term}" to a published finding.`
      : `${pubmed.count} paper(s) in PubMed mention "${term}".`
  );

  if (genbank.count === 0) {
    lines.push("No matching sequence deposits found in GenBank.");
  } else {
    lines.push(`${genbank.count} sequence record(s) deposited in GenBank match this description.`);
  }

  if (embl.count > 0) {
    const roughlyMirrored = genbank.count > 0 && Math.abs(embl.count - genbank.count) / Math.max(genbank.count, 1) < 0.2;
    lines.push(
      roughlyMirrored
        ? `EMBL shows a similar count (${embl.count}) — consistent with GenBank via the daily INSDC sync, so this confirms rather than adds new records.`
        : `EMBL independently shows ${embl.count} matching record(s).`
    );
  }

  if (pubmed.count === 0 && genbank.count > 0) {
    lines.push("The underlying data isn't new, but nobody has published on this angle yet — that gap looks unclaimed.");
  } else if (pubmed.count === 0 && genbank.count === 0) {
    lines.push("Neither the literature nor sequence databases show this yet — worth a second, more specific search before concluding it's novel.");
  }

  return lines.join(" ");
}

export async function checkNovelty(term: string): Promise<NoveltyCheckResult> {
  const [pubmed, genbank, embl] = await Promise.all([searchPubMed(term), searchGenBank(term), searchEmbl(term)]);
  return { term, pubmed, genbank, embl, summary: summarize(term, pubmed, genbank, embl) };
}
