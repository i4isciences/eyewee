import type { Metadata } from "next";
import { AppNav } from "@/components/nav/AppNav";
import { NoveltyCheckPanel } from "@/components/leverage/NoveltyCheckPanel";
import { DeckGeneratorPanel } from "@/components/leverage/DeckGeneratorPanel";
import { ConsentGate } from "@/components/ConsentGate";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "eyewee — Leverage",
};

export default function LeveragePage() {
  return (
    <ConsentGate>
      <AppNav current="leverage" />
      <div className="leverage-page">
        <div className="leverage-page-header">
          <p className="leverage-page-kicker">LEVERAGE</p>
          <h1>Your PI handed you the hard problem. eyewee helps you crack it.</h1>
          <p className="leverage-page-sub">
            eyewee helps with two parts of the process today: synthesizing the literature (real PubMed/GenBank/EMBL lookups) and
            building a presentation-ready deck from what it finds.
          </p>
        </div>
        <NoveltyCheckPanel />
        <DeckGeneratorPanel />
      </div>
      <SiteFooter />
    </ConsentGate>
  );
}
