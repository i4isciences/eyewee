"use client";

import { useState } from "react";
import { DocumentViewer } from "@/components/document/DocumentViewer";

const SAMPLE_TITLE = "Persistence of cccDNA as a Barrier to Functional HBV Cure";
const SAMPLE_META = "Postdoctoral Dissertation Chapter 3 — Results and Discussion (demo content)";
const SAMPLE_PARAGRAPHS = [
  "Chronic hepatitis B virus infection remains incurable in the majority of patients despite decades of effective viral suppression through nucleos(t)ide analog therapy. The central obstacle to a functional cure is the persistence of covalently closed circular DNA, or cccDNA, a stable minichromosome that resides in the nucleus of infected hepatocytes and serves as the transcriptional template for all viral RNAs.",
  "Unlike the reverse-transcribed viral genome targeted by current antivirals, cccDNA is not degraded by nucleos(t)ide analog therapy. Its long half-life in quiescent hepatocytes allows low-level transcription to continue indefinitely, which explains the near-universal relapse observed after treatment discontinuation.",
  "Across twelve patient-derived hepatocyte cultures maintained under nucleos(t)ide analog therapy for eighteen months, cccDNA remained detectable by quantitative PCR in every culture sampled. No culture achieved complete cccDNA clearance, regardless of baseline viral load or duration of suppressive therapy.",
  "These findings are consistent with prior reports describing cccDNA as a durable reservoir that is functionally insulated from standard antiviral mechanisms. The data presented here extend that literature by quantifying persistence specifically in a therapy-experienced cohort rather than treatment-naive samples.",
  "Given that cccDNA persistence is the rate-limiting step toward cure, combination approaches that directly target the minichromosome — including siRNA-mediated silencing and CRISPR-based base editing — represent the most promising path forward. Maintenance nucleos(t)ide analog therapy alone, however durable, cannot achieve cure without addressing this reservoir directly.",
];

// Demo-only "load a different document" entry point -- docs/DEVELOPMENT_PLAN.md §6.8 is explicit
// that a real document-viewing surface (PDF.js or otherwise) hasn't been chosen yet. This is a
// paste-box, not a real upload/viewer pipeline -- it exists so the find-bar (which already works
// on any rendered text) can be demoed against something other than the one hardcoded sample.
export function DocumentSearchDemo() {
  const [customTitle, setCustomTitle] = useState("");
  const [customText, setCustomText] = useState("");
  const [showingCustom, setShowingCustom] = useState(false);

  const paragraphs = showingCustom ? customText.split(/\n{2,}/).filter((p) => p.trim()) : SAMPLE_PARAGRAPHS;
  const title = showingCustom ? customTitle.trim() || "Untitled document" : SAMPLE_TITLE;
  const meta = showingCustom ? "Pasted for this demo" : SAMPLE_META;

  return (
    <div className="docsearch-page">
      {!showingCustom && (
        <div className="docsearch-paste-box">
          <p className="docsearch-paste-label">Want to search something other than the sample? Paste your own text below.</p>
          <input
            type="text"
            placeholder="Document title (optional)"
            value={customTitle}
            onChange={(event) => setCustomTitle(event.target.value)}
          />
          <textarea
            rows={5}
            placeholder="Paste any text here — separate paragraphs with a blank line…"
            value={customText}
            onChange={(event) => setCustomText(event.target.value)}
          />
          <button type="button" className="btn btn-navy" disabled={!customText.trim()} onClick={() => setShowingCustom(true)}>
            Load this document
          </button>
        </div>
      )}

      {showingCustom && (
        <button type="button" className="btn btn-outline docsearch-back-btn" onClick={() => setShowingCustom(false)}>
          ← Back to paste box / sample
        </button>
      )}

      <DocumentViewer title={title} meta={meta}>
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </DocumentViewer>

      <p className="docsearch-hint">
        Try it: click <strong>Search</strong> above, or press <strong>Ctrl+F</strong> (Cmd+F on Mac) — this is real, selectable text, so
        native find already works alongside the in-app bar.
      </p>
    </div>
  );
}
