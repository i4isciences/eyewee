"use client";

import { useState } from "react";
import type { DeckEdition, DeckResult } from "@/lib/eyewee/leverage/pipeline";

async function downloadEdition(title: string, edition: DeckEdition) {
  const response = await fetch("/api/leverage/decks/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, edition }),
  });
  if (!response.ok) return;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}-${edition.kind}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

function EditionCard({ title, edition, label }: { title: string; edition: DeckEdition; label: string }) {
  return (
    <div className="deck-card">
      <div className="deck-card-header">
        <span className="deck-card-title">{label}</span>
        <span className="deck-card-meta">{edition.slides.length} slides</span>
      </div>
      <ol className="deck-slide-list">
        {edition.slides.map((slide) => (
          <li key={slide.title}>
            <strong>{slide.title}</strong>
            <p>{slide.body}</p>
            {slide.reversalLine && <p className="deck-rehearsal-line">🎤 {slide.reversalLine}</p>}
          </li>
        ))}
      </ol>
      <button type="button" className="btn btn-outline" onClick={() => downloadEdition(title, edition)}>
        Download
      </button>
    </div>
  );
}

export function DeckGeneratorPanel() {
  const [finding, setFinding] = useState("");
  const [result, setResult] = useState<DeckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (finding.trim().length < 10 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/leverage/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finding }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        setResult(null);
      } else {
        setResult(data as DeckResult);
      }
    } catch {
      setError("Couldn't reach the deck-generation service — try again shortly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="leverage-panel">
      <h3 className="leverage-panel-title">Deck generation</h3>
      <p className="leverage-panel-sub">
        Layer 6 of eyewee&rsquo;s pipeline (Present) — always generates both editions together: a technical edition with a scripted
        &ldquo;reversal line&rdquo; on every slide (for if you blank out), and a layman&rsquo;s edition in plain language.
      </p>

      <div className="leverage-input-row leverage-input-row-stacked">
        <textarea
          rows={3}
          value={finding}
          placeholder="Describe your findings in a sentence or two…"
          onChange={(event) => setFinding(event.target.value)}
        />
        <button type="button" className="btn btn-navy" disabled={loading || finding.trim().length < 10} onClick={submit}>
          {loading ? "Building…" : "Build decks"}
        </button>
      </div>

      {error && <p className="leverage-error">{error}</p>}

      {result && (
        <div className="deck-grid">
          <EditionCard title={finding.slice(0, 60)} edition={result.technicalEdition} label="Technical edition" />
          <EditionCard title={finding.slice(0, 60)} edition={result.laymanEdition} label="Layman's edition" />
        </div>
      )}
    </section>
  );
}
