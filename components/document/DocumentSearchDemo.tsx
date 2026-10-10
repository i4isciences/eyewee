"use client";

import { useRef, useState } from "react";
import { AppNav } from "@/components/nav/AppNav";
import { DocumentViewer } from "@/components/document/DocumentViewer";
import { extractPdfText } from "@/lib/eyewee/documents/extractPdfText";

const SAMPLE_TITLE = "Persistence of cccDNA as a Barrier to Functional HBV Cure";
const SAMPLE_META = "Postdoctoral Dissertation Chapter 3 — Results and Discussion (demo content)";
const SAMPLE_PARAGRAPHS = [
  "Chronic hepatitis B virus infection remains incurable in the majority of patients despite decades of effective viral suppression through nucleos(t)ide analog therapy. The central obstacle to a functional cure is the persistence of covalently closed circular DNA, or cccDNA, a stable minichromosome that resides in the nucleus of infected hepatocytes and serves as the transcriptional template for all viral RNAs.",
  "Unlike the reverse-transcribed viral genome targeted by current antivirals, cccDNA is not degraded by nucleos(t)ide analog therapy. Its long half-life in quiescent hepatocytes allows low-level transcription to continue indefinitely, which explains the near-universal relapse observed after treatment discontinuation.",
  "Across twelve patient-derived hepatocyte cultures maintained under nucleos(t)ide analog therapy for eighteen months, cccDNA remained detectable by quantitative PCR in every culture sampled. No culture achieved complete cccDNA clearance, regardless of baseline viral load or duration of suppressive therapy.",
  "These findings are consistent with prior reports describing cccDNA as a durable reservoir that is functionally insulated from standard antiviral mechanisms. The data presented here extend that literature by quantifying persistence specifically in a therapy-experienced cohort rather than treatment-naive samples.",
  "Given that cccDNA persistence is the rate-limiting step toward cure, combination approaches that directly target the minichromosome — including siRNA-mediated silencing and CRISPR-based base editing — represent the most promising path forward. Maintenance nucleos(t)ide analog therapy alone, however durable, cannot achieve cure without addressing this reservoir directly.",
];

type PubMedHit = { pmid: string; title: string; source: string; pubdate: string; url: string };
type DocState = { title: string; meta: string; paragraphs: string[] } | null;

// Document Search -- docs/DEVELOPMENT_PLAN.md §6.8. Three ways to get something to search:
// the sample, pasting/uploading your own (.txt or .pdf, extracted entirely client-side), or
// pulling a real paper's abstract straight from PubMed. The find-bar itself (DocumentViewer) is
// unchanged -- it already works on whatever text is rendered, regardless of source.
export function DocumentSearchDemo() {
  const [customDoc, setCustomDoc] = useState<DocState>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customText, setCustomText] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [tab, setTab] = useState<"mine" | "pubmed">("mine");
  const [pubmedTerm, setPubmedTerm] = useState("");
  const [pubmedHits, setPubmedHits] = useState<PubMedHit[] | null>(null);
  const [pubmedLoading, setPubmedLoading] = useState(false);
  const [pubmedError, setPubmedError] = useState<string | null>(null);
  const [loadingAbstractFor, setLoadingAbstractFor] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadPasted() {
    const paragraphs = customText.split(/\n{2,}/).filter((p) => p.trim());
    if (paragraphs.length === 0) return;
    setCustomDoc({ title: customTitle.trim() || "Untitled document", meta: "Pasted for this demo", paragraphs });
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    try {
      let text: string;
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        text = await extractPdfText(file);
      } else {
        text = await file.text();
      }
      const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim());
      if (paragraphs.length === 0) {
        setUploadError("Couldn't find any readable text in that file.");
        return;
      }
      setCustomDoc({ title: file.name, meta: `Uploaded (${(file.size / 1024).toFixed(0)} KB)`, paragraphs });
    } catch {
      setUploadError("Couldn't read that file — try a .txt or a text-based .pdf (not a scanned image).");
    } finally {
      setUploading(false);
    }
  }

  async function searchPubMed() {
    if (pubmedTerm.trim().length < 2 || pubmedLoading) return;
    setPubmedLoading(true);
    setPubmedError(null);
    try {
      const response = await fetch("/api/documents/pubmed-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: pubmedTerm }),
      });
      const data = await response.json();
      if (!response.ok) {
        setPubmedError(data.error ?? "Something went wrong.");
        setPubmedHits(null);
      } else {
        setPubmedHits(data.hits ?? []);
      }
    } catch {
      setPubmedError("Couldn't reach PubMed — try again shortly.");
    } finally {
      setPubmedLoading(false);
    }
  }

  async function loadAbstract(hit: PubMedHit) {
    setLoadingAbstractFor(hit.pmid);
    try {
      const response = await fetch("/api/documents/pubmed-abstract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pmid: hit.pmid }),
      });
      const data = await response.json();
      if (response.ok) {
        const paragraphs = data.abstract.split(/\n{2,}/).filter((p: string) => p.trim());
        setCustomDoc({ title: data.title || hit.title, meta: `PubMed · ${hit.source} · ${hit.pubdate}`, paragraphs });
        setTab("mine");
      }
    } finally {
      setLoadingAbstractFor(null);
    }
  }

  const activeDoc = customDoc ?? { title: SAMPLE_TITLE, meta: SAMPLE_META, paragraphs: SAMPLE_PARAGRAPHS };

  return (
    <>
      <AppNav current="document-search" />
      <div className="docsearch-page">
        <div className="docsearch-tabs">
          <button type="button" className={`docsearch-tab${tab === "mine" ? " is-active" : ""}`} onClick={() => setTab("mine")}>
            Your documents
          </button>
          <button type="button" className={`docsearch-tab${tab === "pubmed" ? " is-active" : ""}`} onClick={() => setTab("pubmed")}>
            Search PubMed
          </button>
        </div>

        {tab === "mine" && (
          <div className="docsearch-paste-box">
            <p className="docsearch-paste-label">Load a document to search — paste text, upload a file, or use the sample below.</p>
            <input type="text" placeholder="Document title (optional)" value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} />
            <textarea
              rows={4}
              placeholder="Paste any text here — separate paragraphs with a blank line…"
              value={customText}
              onChange={(event) => setCustomText(event.target.value)}
            />
            <div className="docsearch-paste-actions">
              <button type="button" className="btn btn-navy" disabled={!customText.trim()} onClick={loadPasted}>
                Load pasted text
              </button>
              <button type="button" className="btn btn-outline" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                {uploading ? "Reading file…" : "Upload .txt or .pdf"}
              </button>
              <input ref={fileInputRef} type="file" accept=".txt,.pdf,application/pdf,text/plain" hidden onChange={handleFileChange} />
              {customDoc && (
                <button type="button" className="btn btn-outline" onClick={() => setCustomDoc(null)}>
                  Back to sample
                </button>
              )}
            </div>
            {uploadError && <p className="leverage-error">{uploadError}</p>}
          </div>
        )}

        {tab === "pubmed" && (
          <div className="docsearch-paste-box">
            <p className="docsearch-paste-label">Search real papers on PubMed, then load one straight into the viewer below.</p>
            <div className="leverage-input-row">
              <input
                type="text"
                placeholder="e.g. HBV cccDNA epigenetic silencing"
                value={pubmedTerm}
                onChange={(event) => setPubmedTerm(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && searchPubMed()}
              />
              <button type="button" className="btn btn-navy" disabled={pubmedLoading || pubmedTerm.trim().length < 2} onClick={searchPubMed}>
                {pubmedLoading ? "Searching…" : "Search"}
              </button>
            </div>
            {pubmedError && <p className="leverage-error">{pubmedError}</p>}
            {pubmedHits && (
              <ul className="docsearch-pubmed-results">
                {pubmedHits.length === 0 && <li className="persona-empty-note">No results.</li>}
                {pubmedHits.map((hit) => (
                  <li key={hit.pmid} className="docsearch-pubmed-row">
                    <div>
                      <p className="docsearch-pubmed-title">{hit.title}</p>
                      <p className="docsearch-pubmed-meta">
                        {hit.source} · {hit.pubdate}
                      </p>
                    </div>
                    <button type="button" className="btn btn-outline" disabled={loadingAbstractFor === hit.pmid} onClick={() => loadAbstract(hit)}>
                      {loadingAbstractFor === hit.pmid ? "Loading…" : "Search this"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <DocumentViewer title={activeDoc.title} meta={activeDoc.meta}>
          {activeDoc.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </DocumentViewer>

        <p className="docsearch-hint">
          Try it: click <strong>Search</strong> above, or press <strong>Ctrl+F</strong> (Cmd+F on Mac) — this is real, selectable text, so
          native find already works alongside the in-app bar.
        </p>
      </div>
    </>
  );
}
