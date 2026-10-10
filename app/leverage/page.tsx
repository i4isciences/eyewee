import type { Metadata } from "next";
import { AppNav } from "@/components/nav/AppNav";
import { NoveltyCheckPanel } from "@/components/leverage/NoveltyCheckPanel";
import { DeckGeneratorPanel } from "@/components/leverage/DeckGeneratorPanel";

export const metadata: Metadata = {
  title: "eyewee — Leverage",
};

export default function LeveragePage() {
  return (
    <>
      <AppNav current="leverage" />
      <div className="leverage-page">
        <div className="leverage-page-header">
          <p className="leverage-page-kicker">LEVERAGE</p>
          <h1>Your PI handed you the hard problem. eyewee helps you crack it.</h1>
          <p className="leverage-page-sub">
            Two of the six-layer pipeline&rsquo;s locked layers, live today (docs/DEVELOPMENT_PLAN.md §6.11) — Layer 2 (Synthesize
            literature) does real PubMed/GenBank/EMBL lookups; Layer 6 (Present) has a real deck data model. Layers 3–5 are permanently out
            of scope for eyewee — see <code>lib/eyewee/leverage/pipeline.ts</code>.
          </p>
        </div>
        <NoveltyCheckPanel />
        <DeckGeneratorPanel />
      </div>
    </>
  );
}
