"use client";

import { useState } from "react";
import type { LiteratureGapResult } from "@/lib/eyewee/leverage/pipeline";

export function NoveltyCheckPanel() {
  const [term, setTerm] = useState("");
  const [result, setResult] = useState<LiteratureGapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (term.trim().length < 3 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/leverage/novelty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        setResult(null);
      } else {
        setResult(data as LiteratureGapResult);
      }
    } catch {
      setError("Couldn't reach the novelty-check service — try again shortly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="leverage-panel">
      <h3 className="leverage-panel-title">Novelty check</h3>
      <p className="leverage-panel-sub">
        Layer 2 of eyewee&rsquo;s pipeline (Synthesize literature) — checks PubMed, GenBank, and EMBL, not just papers. A variant can sit
        deposited in a sequence database with zero papers ever written about it.
      </p>

      <div className="leverage-input-row">
        <input
          type="text"
          value={term}
          placeholder="e.g. HBV X gene variant treatment response"
          onChange={(event) => setTerm(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && submit()}
        />
        <button type="button" className="btn btn-navy" disabled={loading || term.trim().length < 3} onClick={submit}>
          {loading ? "Checking…" : "Check"}
        </button>
      </div>

      {error && <p className="leverage-error">{error}</p>}

      {result && (
        <div className="leverage-result">
          <div className="leverage-result-row">
            <span className="leverage-source-tag">PAPERS REVIEWED</span>
            <span>{result.papersReviewed}</span>
          </div>
          {result.gapsFound.length > 0 && (
            <div className="leverage-result-row">
              <span className="leverage-source-tag">GAP</span>
              <span>{result.gapsFound.join(" ")}</span>
            </div>
          )}
          {result.citedSources[0] && (
            <div className="leverage-result-row">
              <span className="leverage-source-tag">{result.citedSources[0].source.toUpperCase()}</span>
              <span>&ldquo;{result.citedSources[0].title}&rdquo;</span>
            </div>
          )}
          <p className="leverage-summary">{result.summary}</p>
        </div>
      )}
    </section>
  );
}
