import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Eye } from "@/components/eye/Eye";
import { WaitlistForm } from "@/components/WaitlistForm";

export const metadata: Metadata = {
  title: "PostdocWorks — Early Access",
};

const ACCENT = "#F4A725";

// ---------------------------------------------------------------------------------------------
// Small internal building blocks shared by the preview (chat-mockup) sections below -- kept
// local rather than exported since they're only meaningful in this page's exact layout.
// ---------------------------------------------------------------------------------------------

function PreviewKicker({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontFamily: "'Work Sans', sans-serif", fontWeight: 700, fontSize: "12px", letterSpacing: "0.14em", color: ACCENT, marginBottom: "12px" }}>
      {children}
    </div>
  );
}

function PreviewHeading({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "28px", color: "#182D5A", lineHeight: 1.3, marginBottom: "16px" }}>
      {children}
    </h2>
  );
}

function PreviewBody({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "15.5px", lineHeight: 1.7, color: "#4B5468", marginBottom: "14px" }}>{children}</p>
  );
}

function IllustrativeNote({ children }: { children: ReactNode }) {
  return <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontStyle: "italic", color: "#8A93A6" }}>{children}</p>;
}

function ChatCard({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        flex: "1 1 420px",
        minWidth: "340px",
        background: "#F7F8FB",
        border: "1px solid #E7E9F0",
        borderRadius: "18px",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {children}
    </div>
  );
}

function UserBubble({ children, maxWidth = "88%" }: { children: ReactNode; maxWidth?: string }) {
  return (
    <div
      style={{
        alignSelf: "flex-end",
        maxWidth,
        background: "#182D5A",
        color: "#FFFFFF",
        borderRadius: "14px 14px 3px 14px",
        padding: "14px 18px",
        fontSize: "14.5px",
        lineHeight: 1.55,
      }}
    >
      {children}
    </div>
  );
}

function EyeweeBubble({ children }: { children: ReactNode }) {
  return (
    <div style={{ alignSelf: "flex-start", maxWidth: "92%", background: "#FFFFFF", borderLeft: `3px solid ${ACCENT}`, borderRadius: "3px 14px 14px 14px", padding: "14px 18px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: ACCENT, marginBottom: "6px" }}>EYEWEE</div>
      <div style={{ fontSize: "14.5px", lineHeight: 1.55, color: "#29304A" }}>{children}</div>
    </div>
  );
}

function SuccessPill({ children }: { children: ReactNode }) {
  return (
    <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "8px", background: "#EAF6EE", borderRadius: "999px", padding: "8px 16px" }}>
      <span style={{ color: "#2F9E52", fontWeight: 700, fontSize: "14px" }}>✦</span>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "#206B39" }}>{children}</span>
    </div>
  );
}

function DeckRow({ icon, name, meta }: { icon: ReactNode; name: string; meta: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF", border: "1px solid #E7E9F0", borderRadius: "10px", padding: "11px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
        {icon}
        <div>
          <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#182D5A" }}>{name}</div>
          <div style={{ fontSize: "11.5px", color: "#8A93A6" }}>{meta}</div>
        </div>
      </div>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A93A6", border: "1px solid #D8DCE6", borderRadius: "999px", padding: "5px 12px" }}>PREVIEW</div>
    </div>
  );
}

function QuestionCard({ quote, tone, label, answer }: { quote: string; tone: "brand" | "answer"; label: string; answer: string }) {
  const box =
    tone === "answer"
      ? { background: "#EAF6EE", border: "1px solid #BFE3CB" }
      : { background: "#FFFFFF", border: "1px solid #E7E9F0" };
  const labelColor = tone === "answer" ? "#206B39" : ACCENT;
  const answerColor = tone === "answer" ? "#1E4A2C" : "#29304A";
  return (
    <div style={{ background: "#F7F8FB", border: "1px solid #E7E9F0", borderRadius: "16px", padding: "22px 26px" }}>
      <p style={{ fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: "16px", color: "#182D5A", margin: "0 0 14px", lineHeight: 1.45 }}>{quote}</p>
      <div style={{ ...box, borderRadius: "10px", padding: "14px 16px" }}>
        <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.06em", color: labelColor, marginBottom: "6px" }}>{label}</div>
        <div style={{ fontSize: "14px", color: answerColor, lineHeight: 1.55 }}>{answer}</div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ width: "100%", boxSizing: "border-box", background: "#FFFFFF", overflow: "hidden", fontFamily: "'Work Sans', sans-serif", color: "#1C2333" }}>
      {/* ================= NAV ================= */}
      <div
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "22px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #ECE7DD",
          position: "sticky",
          top: 0,
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(6px)",
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Eye state="idle" size={40} interactive={false} />
          <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "21px", letterSpacing: "-0.01em", color: "#182D5A" }}>
            eyewee<sup style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "10px", fontWeight: 600, color: "#8A93A6", marginLeft: "1px" }}>SM</sup>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          <div
            style={{
              fontFamily: "'Work Sans', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#182D5A",
              background: "#FBF0DB",
              border: `1px solid ${ACCENT}`,
              borderRadius: "999px",
              padding: "6px 14px",
              letterSpacing: "0.03em",
            }}
          >
            EARLY ACCESS
          </div>
          <Link href="/home" style={{ fontFamily: "'Work Sans', sans-serif", fontWeight: 600, fontSize: "15px", color: "#182D5A" }}>
            Meet eyewee
          </Link>
          <a href="#waitlist" style={{ fontFamily: "'Work Sans', sans-serif", fontWeight: 600, fontSize: "15px", color: "#FFFFFF", background: "#182D5A", padding: "11px 22px", borderRadius: "8px", display: "inline-block" }}>
            Join the waitlist
          </a>
        </div>
      </div>

      {/* ================= HERO ================= */}
      <div
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "88px 48px 72px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          background: "linear-gradient(180deg, #FFFFFF 0%, #F7F8FB 100%)",
        }}
      >
        <div style={{ position: "relative", width: "168px", height: "108px", marginBottom: "18px" }}>
          <Eye state="idle" size={168} />
        </div>
        <div style={{ fontFamily: "'Work Sans', sans-serif", fontWeight: 600, fontSize: "13px", letterSpacing: "0.16em", color: ACCENT, marginBottom: "26px" }}>
          EYEWEE<sup style={{ fontSize: "9px", letterSpacing: 0, color: "#A8B0C0" }}>SM</sup>
        </div>

        <h1 style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontStyle: "italic", fontSize: "34px", lineHeight: 1.35, color: "#182D5A", maxWidth: "780px", marginBottom: "22px" }}>
          You say it — eyewee carries it, guides it, and cracks the toughest problems.
        </h1>

        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "18px", lineHeight: 1.6, color: "#475069", maxWidth: "620px", marginBottom: "40px" }}>
          For the postdoc carrying someone else&rsquo;s unsolved dream project — alone, in a new country, with no time left over.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "22px", flexWrap: "wrap", justifyContent: "center" }}>
          <a
            href="#waitlist"
            style={{
              fontFamily: "'Work Sans', sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              color: "#182D5A",
              background: ACCENT,
              padding: "15px 34px",
              borderRadius: "9px",
              display: "inline-block",
              boxShadow: "0 10px 24px -10px rgba(244,167,37,0.55)",
            }}
          >
            Join the waitlist
          </a>
          <a href="#preview" style={{ fontFamily: "'Work Sans', sans-serif", fontWeight: 600, fontSize: "15px", color: "#182D5A", borderBottom: "2px solid #182D5A", paddingBottom: "2px" }}>
            See how it works ↓
          </a>
        </div>
      </div>

      {/* ================= THE 200-PAPER WALL ================= */}
      <div style={{ width: "100%", boxSizing: "border-box", padding: "64px 48px", background: "#F1F3F8", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ maxWidth: "760px" }}>
          <h2 style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: "26px", color: "#182D5A", marginBottom: "10px" }}>the 200-paper wall</h2>
          <div style={{ width: "64px", height: "3px", background: ACCENT, margin: "0 auto 22px" }} />
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "17px", color: "#6B7280", marginBottom: "18px" }}>Working alone isn&rsquo;t rigor. It&rsquo;s just noise.</p>
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "16px", lineHeight: 1.7, color: "#384057" }}>
            eyewee brings together the guidance, the connections, and the sparks of insight a postdoc needs to crack the project, find the way through, and stop
            carrying it alone.
          </p>
        </div>
      </div>

      {/* ================= PREVIEW 1: NOVELTY GAP ================= */}
      <div id="preview" style={{ width: "100%", boxSizing: "border-box", padding: "88px 48px", display: "flex", justifyContent: "center", background: "#FFFFFF" }}>
        <div style={{ maxWidth: "1080px", width: "100%", display: "flex", gap: "64px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 380px", minWidth: "320px" }}>
            <PreviewKicker>PREVIEW · LEVERAGE</PreviewKicker>
            <PreviewHeading>Your PI handed you the hard problem. eyewee helps you crack it.</PreviewHeading>
            <PreviewBody>
              200 papers deep, one clear next step. eyewee checks the places a literature search misses — sequence databases, not just journals — so you know
              within minutes whether your angle is actually new.
            </PreviewBody>
            <IllustrativeNote>Illustrative example — eyewee&rsquo;s live conversation isn&rsquo;t open yet.</IllustrativeNote>
          </div>

          <ChatCard>
            <UserBubble>
              I think I found a mutation in the HBV X gene that might explain why some patients don&rsquo;t respond to therapy, but I can&rsquo;t tell if
              anyone&rsquo;s already reported this exact variant. I&rsquo;ve read like 40 papers and I&rsquo;m losing track.
            </UserBubble>
            <EyeweeBubble>
              Let&rsquo;s check three places, not just papers — a variant can sit deposited in a sequence database with zero papers ever written about it.
              Checking PubMed, GenBank, and EMBL now.
            </EyeweeBubble>
            <div style={{ background: "#FFFFFF", border: "1px solid #E7E9F0", borderRadius: "12px", padding: "16px 18px" }}>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "13.5px", color: "#182D5A", marginBottom: "12px" }}>
                HBV X gene variant — search results
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#182D5A", background: "#EBEEF4", borderRadius: "5px", padding: "3px 7px", whiteSpace: "nowrap", marginTop: "1px" }}>
                    PUBMED
                  </div>
                  <div style={{ fontSize: "13.5px", lineHeight: 1.5, color: "#4B5468" }}>
                    <span style={{ color: ACCENT, fontWeight: 700 }}>0 papers</span> link this exact variant to treatment response
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#182D5A", background: "#EBEEF4", borderRadius: "5px", padding: "3px 7px", whiteSpace: "nowrap", marginTop: "1px" }}>
                    GENBANK
                  </div>
                  <div style={{ fontSize: "13.5px", lineHeight: 1.5, color: "#4B5468" }}>
                    <span style={{ color: ACCENT, fontWeight: 700 }}>3 sequences</span> deposited with this variant — none linked to a functional study
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#182D5A", background: "#EBEEF4", borderRadius: "5px", padding: "3px 7px", whiteSpace: "nowrap", marginTop: "1px" }}>
                    EMBL
                  </div>
                  <div style={{ fontSize: "13.5px", lineHeight: 1.5, color: "#4B5468" }}>
                    Same 3 records — EMBL mirrors GenBank daily via the INSDC sync, so this confirms rather than adds
                  </div>
                </div>
              </div>
            </div>
            <EyeweeBubble>So the mutation itself isn&rsquo;t new — it&rsquo;s been sequenced before. But nobody has connected it to treatment response. That gap is yours.</EyeweeBubble>
            <SuccessPill>Novelty confirmed — this angle is unclaimed</SuccessPill>
          </ChatCard>
        </div>
      </div>

      {/* ================= PREVIEW 2: DECK GENERATION ================= */}
      <div style={{ width: "100%", boxSizing: "border-box", padding: "24px 48px 96px", display: "flex", justifyContent: "center", background: "#FFFFFF" }}>
        <div style={{ maxWidth: "1080px", width: "100%", display: "flex", gap: "64px", alignItems: "center", flexWrap: "wrap-reverse" }}>
          <ChatCard>
            <UserBubble maxWidth="92%">
              My HBV conference talk is in 3 days and my daughter just got sick. I have zero time to rehearse. Can you make me a deck on my cccDNA findings?
            </UserBubble>
            <EyeweeBubble>
              That&rsquo;s a lot to be carrying into a conference. I&rsquo;ve got it — building this now. You&rsquo;ll get three versions automatically: a{" "}
              <b>Main Presentation</b> that&rsquo;s clean and podium-ready, a <b>Rehearsal Presentation</b> with a scripted line on every slide — so if you
              blank out backstage, you have something to say instantly — and a <b>Layman&rsquo;s Presentation</b> for anyone outside your field. No rehearsal
              required.
            </EyeweeBubble>
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              <DeckRow
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#182D5A" strokeWidth={2}>
                    <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" />
                    <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
                  </svg>
                }
                name="Main Presentation"
                meta="3 slides · podium-ready, clean"
              />
              <DeckRow
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth={2}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.14.4.43.74.82.94.2.1.4.16.63.16H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                }
                name="Rehearsal Presentation"
                meta="3 slides · with reversal lines"
              />
              <DeckRow
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A93A6" strokeWidth={2}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M9 15h6M9 11h3" />
                  </svg>
                }
                name="Layman's Presentation"
                meta="3 slides · plain language"
              />
            </div>
            <SuccessPill>All three ready — pick whichever you need, or grab them all</SuccessPill>
          </ChatCard>

          <div style={{ flex: "1 1 380px", minWidth: "320px" }}>
            <PreviewKicker>PREVIEW · LEVERAGE</PreviewKicker>
            <PreviewHeading>Walk in ready — even with zero rehearsal time.</PreviewHeading>
            <PreviewBody>
              A stressed, unrehearsed postdoc should still be able to present with confidence. Every deck request comes back as three ready-to-use versions —
              automatically, not as an extra step.
            </PreviewBody>
            <IllustrativeNote>Illustrative example — eyewee&rsquo;s live conversation isn&rsquo;t open yet.</IllustrativeNote>
          </div>
        </div>
      </div>

      {/* ================= MID BANNER ================= */}
      <div style={{ width: "100%", boxSizing: "border-box", padding: "74px 48px", background: "#182D5A", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: "26px", color: "#FFFFFF", marginBottom: "6px" }}>Turns stuck into spark.</h2>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "22px", color: "#FFFFFF", maxWidth: "640px", lineHeight: 1.4, margin: "18px 0 30px" }}>
          eyewee doesn&rsquo;t just watch.
          <br />
          It sees.
        </p>
        <a href="#waitlist" style={{ fontFamily: "'Work Sans', sans-serif", fontWeight: 700, fontSize: "15px", color: "#182D5A", background: ACCENT, padding: "13px 30px", borderRadius: "9px", display: "inline-block" }}>
          Meet eyewee — join the waitlist
        </a>
      </div>

      {/* ================= TWO WAYS IN ================= */}
      <div style={{ width: "100%", boxSizing: "border-box", padding: "92px 48px", display: "flex", justifyContent: "center", background: "#FFFFFF" }}>
        <div style={{ maxWidth: "1080px", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ fontFamily: "'Work Sans', sans-serif", fontWeight: 700, fontSize: "12px", letterSpacing: "0.14em", color: ACCENT, marginBottom: "12px" }}>
              ONE COMPANY. TWO DECISIVE MOVES.
            </div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "30px", color: "#182D5A" }}>Research careers deserve better than a handoff.</h2>
          </div>
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 420px", minWidth: "300px", background: "#F7F8FB", border: "1px solid #E7E9F0", borderRadius: "18px", padding: "34px" }}>
              <div style={{ fontFamily: "'Work Sans', sans-serif", fontWeight: 700, fontSize: "12px", letterSpacing: "0.1em", color: "#8A93A6", marginBottom: "14px" }}>
                01 / DOC2POSTDOC
              </div>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "21px", color: "#182D5A", lineHeight: 1.35, marginBottom: "14px" }}>
                The shortest distance between where you are and what&rsquo;s next.
              </h3>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "14.5px", lineHeight: 1.7, color: "#4B5468" }}>
                Find the person who has already made your transition. Doc2Postdoc matches PhD researchers with credible postdocs for specific, human guidance
                when the stakes are highest.
              </p>
            </div>
            <div style={{ flex: "1 1 420px", minWidth: "300px", background: "#F7F8FB", border: "1px solid #E7E9F0", borderRadius: "18px", padding: "34px" }}>
              <div style={{ fontFamily: "'Work Sans', sans-serif", fontWeight: 700, fontSize: "12px", letterSpacing: "0.1em", color: "#8A93A6", marginBottom: "14px" }}>
                02 / POSTDOCWORKS
              </div>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "21px", color: "#182D5A", lineHeight: 1.35, marginBottom: "14px" }}>
                Your record, finally read as a whole.
              </h3>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "14.5px", lineHeight: 1.7, color: "#4B5468" }}>
                PostdocWorks gives institutions and researchers a more intelligent way to meet: verified credentials, meaningful context, and a career signal
                that goes beyond a title.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= PREVIEW 3: RING THE BELL ================= */}
      <div style={{ width: "100%", boxSizing: "border-box", padding: "88px 48px 24px", display: "flex", justifyContent: "center", background: "#FFFFFF" }}>
        <div style={{ maxWidth: "1080px", width: "100%", display: "flex", gap: "64px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 380px", minWidth: "320px" }}>
            <PreviewKicker>PREVIEW · DOC2POSTDOC</PreviewKicker>
            <PreviewHeading>Your circle, reachable in one ring.</PreviewHeading>
            <PreviewBody>
              Ring the Bell reaches the people who already said yes to helping you first — your accepted connections, all at once, with a two-hour window.
              Only if nobody answers does it widen further. eyewee delivers the ring itself, never an anonymous alert.
            </PreviewBody>
            <IllustrativeNote>Illustrative example — Doc2Postdoc matching isn&rsquo;t open yet.</IllustrativeNote>
          </div>

          <ChatCard>
            <UserBubble>I need someone who&rsquo;s actually run a BSL-3 facility — my PI wants me starting tomorrow and I&rsquo;ve never worked in one.</UserBubble>
            <EyeweeBubble>
              You have 4 connections in your network — ringing them now, all at once. First to accept gets you sorted. If nobody responds in two hours, we
              widen the search.
            </EyeweeBubble>
            <div style={{ background: "#FFFFFF", border: "1px solid #E7E9F0", borderRadius: "12px", padding: "16px 18px" }}>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "13.5px", color: "#182D5A", marginBottom: "12px" }}>
                Ringing the Bell — 4 connections
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "13.5px", color: "#4B5468" }}>Priya R. — GI Fellow, PGY-4</div>
                  <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#206B39", background: "#EAF6EE", borderRadius: "999px", padding: "3px 10px" }}>ACCEPTED</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "13.5px", color: "#8A93A6" }}>3 other connections</div>
                  <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#8A93A6", background: "#EBEEF4", borderRadius: "999px", padding: "3px 10px" }}>WINDOW CLOSED</div>
                </div>
              </div>
            </div>
            <SuccessPill>Connected — Priya accepted in 12 minutes</SuccessPill>
          </ChatCard>
        </div>
      </div>

      {/* ================= PREVIEW 4: TRAVEL COMPANION ================= */}
      <div style={{ width: "100%", boxSizing: "border-box", padding: "24px 48px 96px", display: "flex", justifyContent: "center", background: "#FFFFFF" }}>
        <div style={{ maxWidth: "1080px", width: "100%", display: "flex", gap: "64px", alignItems: "center", flexWrap: "wrap-reverse" }}>
          <ChatCard>
            <UserBubble maxWidth="92%">My parents land in Chicago the same week as my grant deadline. I can&rsquo;t get to O&rsquo;Hare myself that day.</UserBubble>
            <EyeweeBubble>
              Checking who else has a pickup near that date. Matched you with a connection also meeting someone at O&rsquo;Hare on the 18th — same
              high-scrutiny safety check applies before any contact details are shared.
            </EyeweeBubble>
            <div style={{ background: "#FFFFFF", border: "1px solid #E7E9F0", borderRadius: "12px", padding: "16px 18px" }}>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "13.5px", color: "#182D5A", marginBottom: "10px" }}>Travel Companion match</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13.5px", color: "#4B5468" }}>
                <div>
                  <span style={{ color: "#182D5A", fontWeight: 600 }}>Arrival:</span> O&rsquo;Hare (ORD) — Dec 18
                </div>
                <div>
                  <span style={{ color: "#182D5A", fontWeight: 600 }}>Matched with:</span> Postdoc, same metro, pickup same day
                </div>
                <div>
                  <span style={{ color: "#182D5A", fontWeight: 600 }}>Coordinating:</span> pickup date and time
                </div>
              </div>
            </div>
            <SuccessPill>Trip matched — both earn a badge once it&rsquo;s completed together</SuccessPill>
          </ChatCard>

          <div style={{ flex: "1 1 380px", minWidth: "320px" }}>
            <PreviewKicker>PREVIEW · DOC2POSTDOC</PreviewKicker>
            <PreviewHeading>Someone at the gate, even when you can&rsquo;t be.</PreviewHeading>
            <PreviewBody>
              When your parents are flying in and a deadline won&rsquo;t let you leave the lab, Travel Companion matches you with someone else already headed
              to the same airport — the same safety layer as every other Doc2Postdoc connection, and a badge for both of you once the trip is done.
            </PreviewBody>
            <IllustrativeNote>Illustrative example — Doc2Postdoc matching isn&rsquo;t open yet.</IllustrativeNote>
          </div>
        </div>
      </div>

      {/* ================= PREVIEW 5: NAVIGATE — REAL QUESTIONS ================= */}
      <div style={{ width: "100%", boxSizing: "border-box", padding: "24px 48px 96px", background: "#FFFFFF", display: "flex", justifyContent: "center" }}>
        <div style={{ maxWidth: "820px", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <PreviewKicker>PREVIEW · NAVIGATE</PreviewKicker>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "28px", color: "#182D5A", lineHeight: 1.3, marginBottom: "14px" }}>
              Real questions, from a real community.
            </h2>
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "15.5px", lineHeight: 1.7, color: "#4B5468", maxWidth: "560px", margin: "0 auto" }}>
              Not hypotheticals — this is what shows up in a postdoc group chat every week, and how eyewee actually answers.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <QuestionCard
              quote="&ldquo;Is anyone currently staying at Maple Pine? I need info on the management before I sign.&rdquo;"
              tone="brand"
              label="EYEWEE CONNECTS YOU"
              answer="Found a postdoc already living there, opted in to intros — matched through Doc2Postdoc, not a guess."
            />
            <QuestionCard
              quote="&ldquo;Is anyone here on a J1/J2 visa? I&rsquo;d love to know their real experience.&rdquo;"
              tone="brand"
              label="EYEWEE CONNECTS YOU"
              answer="This is better answered by someone who&rsquo;s lived it than a policy page — matched with postdocs on J1 status willing to share."
            />
            <QuestionCard
              quote="&ldquo;How do I change my address with USCIS while my green card is processing?&rdquo;"
              tone="answer"
              label="EYEWEE ANSWERS DIRECTLY"
              answer="The E-COA tool in your USCIS online account updates every pending case at once. Form AR-11 by mail is the fallback — both within 10 days of moving."
            />
          </div>
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", fontStyle: "italic", color: "#8A93A6", textAlign: "center", marginTop: "24px" }}>
            Illustrative examples — eyewee&rsquo;s live conversation isn&rsquo;t open yet.
          </p>
        </div>
      </div>

      {/* ================= WAITLIST FORM ================= */}
      <div id="waitlist" style={{ width: "100%", boxSizing: "border-box", padding: "96px 48px", background: "#F1F3F8", display: "flex", justifyContent: "center" }}>
        <div style={{ maxWidth: "620px", width: "100%" }}>
          <WaitlistForm />
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <div
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "48px",
          background: "#FFFFFF",
          borderTop: "1px solid #ECE7DD",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Eye state="idle" size={36} interactive={false} />
          <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "19px", color: "#182D5A" }}>eyewee</div>
        </div>
        <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13px", color: "#8A93A6" }}>Powered by i4iSciences&trade;</div>
        <div style={{ display: "flex", gap: "18px", fontSize: "12.5px", color: "#8A93A6" }}>
          <a href="/terms">Terms of Service</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="mailto:hello@postdocworks.io">hello@postdocworks.io</a>
        </div>
        <div style={{ fontSize: "11.5px", color: "#B7BEC9", maxWidth: "520px", lineHeight: 1.6, marginTop: "6px" }}>
          © 2026 I4I Sciences LLC dba i4iSciences. i4iSciences&trade; is a trademark of I4I Sciences LLC. All rights reserved.
        </div>
      </div>
    </div>
  );
}
