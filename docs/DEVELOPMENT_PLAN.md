# eyewee — Full Build & Architecture Plan

> **v6 — 2026-10-08.** Ranjit answered all five open §8.2 product decisions. Everything each
> answer unblocked is now built and live-tested — see §8.2 for the detail on each. Headline
> changes: (1) a new **internal-testing mechanism** (`/api/internal/enable-testing`) lets the team
> test real Claude replies without touching the public crisis-response switch, which stays exactly
> as closed as before; (2) **Memory's write path is built** (suggest → approve → save, with a
> locked content-exclusion filter, edit/delete support); (3) **pricing's structural shape is
> built** (device tier field, feature-flag table, real usage numbers feeding the `Eye` component's
> `usagePercent` tint) — no billing, no enforcement, exactly as instructed. New migration
> `202610080001_eyewee_tier_and_usage.sql` — applied directly to the live database this pass (this
> sandbox could reach the Postgres host directly this time, unlike the previous migration which
> needed the Supabase dashboard; verified via a live round trip before and after). Also: a bug
> surfaced by live-testing the memory-suggestion feature (Claude's API rejects a turn list ending
> in an assistant message) was caught and fixed before being reported as working — see
> `lib/eyewee/claude/memorySuggestion.ts`.
>
> **v5 — 2026-09-30.** The four missing "locked" documents from §8.1 (v4) were supplied and are now
> built in:
> - **Six-layer "crack the project" pipeline** — `lib/eyewee/leverage/pipeline.ts`, live-tested:
>   the scope guard (`assertLayerInScope`) correctly throws for layers 3/4/5 and allows 2/6; the
>   novelty-check and deck-generation endpoints now run *through* this pipeline
>   (`lib/eyewee/leverage/adapters.ts` wires the injected-service interfaces to the real
>   implementations) instead of calling them directly, so the boundary is structurally enforced,
>   not just documented. This also changed the deck-generation contract from 3 variants to 2
>   locked editions (layman + technical, technical requires a reversal line on every slide) — see
>   `lib/eyewee/leverage/decks.ts` and the updated `DeckGeneratorPanel.tsx`.
> - **The real 5-state eye model** (Idle, Wake, Listening, Thinking, Spark — no "Wake"/"Listening"
>   before, no "Stuck" now) — `components/eye/Eye.tsx` fully replaced, plus a new `usagePercent`
>   color-overlay prop. This dropped two things the old component had that the locked spec doesn't
>   mention (pointer/arrow-key gaze tracking, "excited" grow-on-type) — not reintroduced, since the
>   locked reference doesn't call for them and the component is explicitly meant to be controlled,
>   not self-animating beyond its 5 states. All call sites updated; static/branding usages
>   (nav, footer, legal pages) moved from `idle` (now means *asleep*, eyes closed) to `wake` (open,
>   alert) since a closed-eye logo mark isn't the right default outside an actual conversation.
>   The voice mic (built last session) now drives real state transitions: click → `wake` →
>   `listening` while recording → `thinking` while transcribing/replying → `spark` on reply.
> - **Trust pillar's locked copy** — recorded in §1 below and folded into the Claude system prompt
>   (`lib/eyewee/claude/systemPrompt.ts`) alongside Translate/Navigate/Leverage. Not yet given its
>   own landing-page section — that's a marketing/design call, not built without being asked.
> - **The biomedical-first field-scope doc** — one concrete fix applied here: `pipeline.ts`'s Layer
>   4 description de-jargoned per the doc's own worked example ("build the missing method or tool"
>   instead of "develop new assays and protocols"). The doc's other two action items (generalizing
>   the `PMID` field, reserving Doc2Postdoc taxonomy placeholders) are **`postdocworks` schema
>   changes, not eyewee's** — flagged in §8.1, not done here without being asked to work in that
>   repo.
>
> All of this was live-tested (`tsc`, `eslint`, `next build`, real endpoint calls against the
> actual live PubMed/GenBank/EMBL APIs) before being written up here.
>
> **v4 — 2026-09-30.** Real Claude wiring (`lib/eyewee/claude/{client,systemPrompt}.ts`) and real
> voice I/O (`lib/eyewee/voice/{stt,tts}.ts`, Deepgram + ElevenLabs as swappable defaults —
> §6.3) are now code-complete and wired into the send-message endpoint and `PersonaExperience.tsx`.
> **The crisis-response gate is still closed** (`EYEWEE_CRISIS_RESPONSE_GATE_OPEN` unset/false) —
> adding a working `ANTHROPIC_API_KEY` does not and must not flip it; that stays a deliberate,
> separate switch pending legal + mental-health-professional clearance. Storage-connect was live-
> tested end to end this pass with real Zenodo/OSF/Dryad/Figshare OAuth app credentials — all four
> correctly redirect to the real vendor login/consent screens now. One env-var naming mismatch was
> found and fixed: the credentials had been saved under `CLAUDE_API_KEY` /
> `ZONODO_CLIENT_ID`/`_SECRET` (typo) / `OSF_CLIENT_ID`/`_SECRET` / `DRYAD_ID`/`_SECRET` /
> `FIGSHARE_CLIENT_ID`/`_SECRET` — renamed in `.env` (gitignored, local-only) to the names this
> codebase's provider registry (`lib/storage/providers/registry.ts`) and Claude client actually read
> (`ANTHROPIC_API_KEY`, `ZENODO_OAUTH_CLIENT_ID`/`_SECRET`, `OSF_OAUTH_CLIENT_ID`/`_SECRET`,
> `DRYAD_OAUTH_CLIENT_ID`/`_SECRET`, `FIGSHARE_OAUTH_CLIENT_ID`/`_SECRET`) without touching the
> values themselves. Also raised this pass, not yet resolved: whether/how eyewee should access a
> specific postdoc's real PostdocWorks data — see the new §10, a real fork this plan flags rather
> than guesses at, since eyewee and postdocworks share the exact same live Supabase project and
> getting this wrong risks one postdoc seeing another's data.
>
> **v3 — 2026-09-28.** The account-model question in §9 is resolved: **eyewee stays account-free**.
> Phases 1, 2, 2.5, 2.6, 6 (read), and 8's routing hook are now implemented in code against a
> device-scoped architecture (an anonymous, random id in a long-lived httpOnly cookie —
> `lib/eyewee/session/deviceId.ts` — not an account: no login, no email, no password). A new
> migration (`supabase/migrations/202609280001_eyewee_device_scoped_schema.sql`) adds the
> corresponding tables **but has not been applied to the live database** — this sandbox can reach
> the Supabase REST API over HTTPS (confirmed working) but not the direct Postgres host over its
> wire protocol (network egress only allows HTTP/HTTPS here), so DDL has to be run by the user via
> the Supabase dashboard's SQL editor or `supabase db push` from a machine that isn't network-
> restricted this way. **Heads up if using `db push`:** the three tables from the *old*
> `eyewee_conversations`/`eyewee_waitlist` migrations already exist on the live database (confirmed
> via a live read this session) but with no local CLI migration-history link — a first `db push`
> would try to reapply them and likely fail on `create type` (no `IF NOT EXISTS` support in
> Postgres for types). Simplest path: apply just the new migration file's SQL directly via the
> dashboard SQL editor rather than `db push`.
>
> **v2 — 2026-09-28.** Revised after a gap review flagged several missing/stale items in v1.
> Corrections applied where source material was locatable in this repo or its sibling
> `postdocworks` repo (`C:\Users\keert\Documents\postdocworks`, checked this pass — see §2 and §8
> for what was and wasn't found there). Items the reviewer referenced that could **not** be found
> in either repo are called out explicitly in §8.1 rather than guessed at — this plan does not
> invent "locked" product copy or architecture it can't verify.
>
> Companion to `docs/SPEC.md` (this repo) / `postdocworks/docs/eyewee-spec.md` (its sibling copy —
> currently identical, both stale relative to this plan in places; see §8.1). Those files remain
> the source of truth for exact schema/endpoint shape where they overlap with this plan; this doc
> owns sequencing and the pieces they don't cover (HIPAA/PHI guardrails, multilingual voice, the
> Leverage novelty-check and deck-generation services, the overall phase plan).

---

## Table of contents

1. [What eyewee is](#1-what-eyewee-is)
2. [Current state — what's actually built today](#2-current-state--whats-actually-built-today)
3. [Proposed target architecture](#3-proposed-target-architecture)
4. [Proposed repo structure](#4-proposed-repo-structure)
5. [Phased development plan](#5-phased-development-plan)
6. [Per-service build plan](#6-per-service-build-plan)
7. [Testing & QA plan](#7-testing--qa-plan)
8. [Decisions & missing source material this plan is blocked on](#8-decisions--missing-source-material-this-plan-is-blocked-on)
9. [Known inconsistencies to reconcile first](#9-known-inconsistencies-to-reconcile-first)
10. [Giving eyewee access to a postdoc's real PostdocWorks data](#10-giving-eyewee-access-to-a-postdocs-real-postdocworks-data)

---

## 1. What eyewee is

**Master line (locked):** *"You say it — eyewee carries it, guides it, and cracks the toughest
problems."*

eyewee is I4I Sciences LLC's AI assistant for postdocs — "the postdoc carrying someone else's
unsolved dream project, alone, in a new country, with no time left over." It sits alongside
i4iSciences' two other products (the landing page frames this as "one company, two decisive
moves"):

- **Doc2Postdoc** — peer matching (Ring the Bell, Travel Companion, Faculty Endorsement). Its own
  detailed spec lives at `postdocworks/docs/doc2postdoc-spec.md` (sibling repo) — this plan treats
  Doc2Postdoc as an adjacent product eyewee can reference/link to, not something built here. See
  §8.2 for why that scope line is drawn there.
- **PostdocWorks** — the credentialing / career-record platform.

eyewee's own scope is the assistant itself, organized around named "crossings"/pillars:

| Pillar | Meaning | Locked primary line |
|---|---|---|
| **Translate** | language crossing | "Say it your way. eyewee carries it the rest of the way." |
| **Navigate** | everyday-logistics crossing | "The guide for everything nobody hands you on day one." |
| **Leverage** | cracking the unsolved research problem | "Your PI handed you the hard problem. We help you crack it." |
| **Trust** | shown as a 4th pillar in UI mockups | Hero line: "…carries your trust the whole way through." Card copy: "Your verified badge status surfaces right inside the conversation — not buried in a profile page. Every match and every contact exchange carries the same safety layer underneath." |

This copy is **confirmed/locked** — don't rewrite it when building, only re-lay it out. Trust's copy
was supplied 2026-09-30 (already live on eyewee.com per the source) and is folded into the Claude
system prompt (`lib/eyewee/claude/systemPrompt.ts`); it doesn't yet have its own landing-page
section in this repo's `app/page.tsx` — that's a design/layout call for whoever owns the marketing
page, not assumed here.

A later, explicitly-not-yet-built pillar for a different audience: **Organize** — PI-facing lab
administration. See §6.7 for the corrected, current scope of that.

---

## 2. Current state — what's actually built today

Confirmed by reading the repo directly (`app/`, `components/`, `lib/`, `supabase/migrations/`)
plus a check of the sibling `postdocworks` repo this pass.

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Supabase
(Postgres + Auth), deployed as a standalone site — this folder is its own app.

**Live today:**
- `/` — public waitlist landing page (`app/page.tsx`): hero, illustrative preview conversations
  (labeled "illustrative — eyewee's live conversation isn't open yet"), the "two decisive moves"
  section, waitlist form. **This page is also where the Leverage novelty-check demo (PubMed /
  GenBank / EMBL) and the three-deck-generation demo (Main / Rehearsal / Layman's) already live as
  static illustrative copy** — see §6.9/§6.10, both of which were missing from v1 of this plan.
- `/home` — the "persona experience" (`components/PersonaExperience.tsx`): working chat *shell*,
  account-free by design (conversations live only in browser React state for the current tab).
  Animated eye states (idle/thinking/stuck/spark) via `components/eye/Eye.tsx`.
- `POST /api/reply` — canned "I'm still being built" response, not a live model call (intentional
  — see §6.6).
- `POST /api/waitlist` — real Supabase insert into `public.eyewee_waitlist`.
- `/privacy`, `/terms`, `/safety` — static pages.
- The eye mark — custom SVG, 4 behavior states (idle/thinking/stuck/spark), gaze tracking,
  wake-up entrance, excited-on-type state.

**✅ Eye-state model — resolved 2026-09-30.** The locked model is confirmed 5 states — Idle, Wake,
Listening, Thinking, Spark — "stuck" was never a real state (it was always Thinking's own
"eyes can pause closed for a moment on a hard one" behavior). `components/eye/Eye.tsx` was rebuilt
to match, verified against the interactive reference (`eyewee_eye_states.html`) supplied this pass.
Voice activation is push-to-talk (click the mic), not a spoken wake word — the reference doesn't
actually require true always-on wake-word detection, just that *a* trigger moves Idle→Wake; a
button press satisfies that.

**Exists in the DB but not wired to anything live today:**
- `public.eyewee_conversations` / `public.eyewee_messages` — built against an authenticated-user
  model (`user_id references auth.users`). The account-free `/home` experience doesn't use these.
  See §9 — this needs a decision before Phase 1 extends it.

**Documented but not started:** storage-connection OAuth, real conversations/messages endpoints,
memory, document search (§6 below), plus everything new in this revision: the Leverage
novelty-check service, deck-generation service, and the six-layer "crack the project" pipeline
(§6.11 — blocked, see §8.1).

---

## 3. Proposed target architecture

```
                                   ┌─────────────────────────────┐
                                   │   Client (Next.js/React)     │
                                   │  landing · persona chat ·    │
                                   │  document viewer · sidebar   │
                                   └───────────────┬──────────────┘
                                                    │ HTTPS
     ┌─────────────┬──────────────────┬─────────────┼─────────────┬───────────────────┬───────────────┐
     │              │                  │             │             │                    │               │
┌────▼────┐  ┌──────▼──────┐  ┌────────▼───────┐  ┌──▼──────────┐ ┌▼─────────────┐ ┌────▼────────┐ ┌────▼─────┐
│ Voice     │  │ Conversation │  │ Storage-connect │  │ Novelty-check│ │ Deck-generation│ │ Document     │ │ Organize │
│ layer     │  │ API layer    │  │ API (OAuth to   │  │ (PubMed /    │ │ (Main/Rehearsal│ │ search       │ │ routing  │
│ (STT/TTS) │  │ (Next.js     │  │ Zenodo/OSF/     │  │ GenBank/EMBL,│ │ /Layman's)     │ │ (find bar +  │ │ hook     │
│           │  │ route        │  │ Dryad/Figshare) │  │ free public  │ │                │ │ PDF text     │ │ (future) │
│           │  │ handlers)    │  │                 │  │ APIs)        │ │                │ │ layer)       │ │          │
└────┬──────┘  └──────┬───────┘  └─────────────────┘  └───────┬──────┘ └────────┬───────┘ └──────────────┘ └──────────┘
     │                │                                        │                 │
     │        ┌────────▼────────────┐                           │                 │
     └───────►│  PHI / guardrail     │◄──────────────────────────┴─────────────────┘
              │  gate (pre-send filter,│         (both need live-model drafting for their
              │  crisis-response hold) │          non-mock output — gated same as chat)
              └──────────┬───────────┘
                          │ only if gate open
              ┌───────────▼───────────┐
              │   Claude API (Messages)│
              │   + system-prompt       │
              │   language-match rule   │
              │   + memory context       │
              │   + [BLOCKED] the        │
              │   six-layer "crack the   │
              │   project" pipeline —    │
              │   see §6.11/§8.1         │
              └───────────┬───────────┘
                          │
     ┌────────────────────┼────────────────────┐
     │                     │                     │
┌────▼────┐       ┌────────▼─────────┐   ┌───────▼────────┐
│ Memory    │       │ Conversation/     │   │ (future) Organize│
│ store     │       │ message store     │   │ PI-facing branch │
└───────────┘       └───────────────────┘   └──────────────────┘
```

### Layer responsibilities (additions this pass in **bold**)

- **Client** — Next.js App Router pages/components; UI state; the eye's behavior state machine
  (pending §8.1 resolution on which state model is actually locked); for voice, mic capture/audio
  playback.
- **Voice layer** — STT/TTS wrap the chat API from outside; Claude never sees audio.
- **Conversation API layer** — owns the request/response shape; anchors the eye's
  thinking/idle transitions.
- **PHI / guardrail gate** — crisis-response hold (master switch) + PHI pattern filter, both must
  pass before any message reaches Claude. **New this pass:** the immigration/visa content boundary
  and any pricing-tier logic are *not* guardrail concerns and don't belong in this gate — see §8.1
  and §9 for where they actually need a home.
- **Claude API** — the model call itself, carrying the language-match system-prompt rule and
  memory context. **The six-layer "crack the project" pipeline referenced in the gap review would
  live here as the actual Leverage reasoning process — it is not implemented anywhere yet and its
  spec (including the "eyewee only touches layers 2 & 6" boundary) hasn't been located. This is
  the single highest-priority missing spec in this plan — see §8.1.**
- **Storage-connect layer** — OAuth to Zenodo/OSF/Dryad/Figshare (postdocs' own deposited data).
  **Distinct from, and previously conflated with, the Novelty-check service below** — see §9.
- **Novelty-check (new)** — a Leverage-pillar service, separate from storage-connect: queries
  public literature/sequence databases (PubMed, GenBank, EMBL/ENA) to tell a postdoc whether their
  finding is actually novel. Demoed on the landing page; had no home in v1 of this plan. See §6.9.
- **Deck-generation (new)** — a Leverage-pillar service: given a postdoc's findings, produces three
  slide-deck variants (Main / Rehearsal / Layman's). Demoed on the landing page and in a separate
  email brief; had no home in v1 of this plan. See §6.10.
- **Memory store** — durable per-user facts; write path blocked on a product decision.
- **Document search** — client-side find bar + (separately scoped) cross-library index.
- **Organize** — routing hook only, no functionality, until a later launch.

---

## 4. Proposed repo structure

```
eyewee/
├── app/
│   ├── page.tsx, home/page.tsx, privacy/, terms/, safety/     # (done)
│   ├── api/
│   │   ├── waitlist/route.ts, reply/route.ts                  # (done)
│   │   ├── conversations/…                                     # Phase 1 — pending §9 decision
│   │   ├── storage/…                                            # Phase 2
│   │   ├── memory/route.ts                                      # Phase 6 (read first)
│   │   ├── voice/{transcribe,speak}/route.ts                     # Phase 5
│   │   ├── leverage/
│   │   │   ├── novelty/route.ts        # NEW — PubMed/GenBank/EMBL lookup (§6.9)
│   │   │   └── decks/route.ts          # NEW — three-deck generation (§6.10)
│   │   └── organize/…                                            # Phase 8, pending §9's role-field question
├── components/
│   ├── eye/Eye.tsx                     # (done — 4-state; do not rebuild against 5-state/wake-word claim yet, §8.1)
│   ├── PersonaExperience.tsx           # (done — evolves into full chat page)
│   ├── document/{FindBar,DocumentViewer}.tsx   # Phase 7
│   ├── voice/{MicButton,useVoiceSession}.tsx   # Phase 5
│   └── leverage/
│       ├── NoveltyCheckPanel.tsx       # NEW (§6.9)
│       └── DeckGeneratorPanel.tsx      # NEW (§6.10)
├── lib/
│   ├── eyewee/
│   │   ├── reply.ts, useGaze.ts        # (done)
│   │   ├── claude/{client,systemPrompt,memoryContext}.ts
│   │   ├── guardrails/{crisisGate,phiFilter}.ts
│   │   ├── voice/{stt,tts}.ts
│   │   ├── search/libraryIndex.ts
│   │   └── leverage/
│   │       ├── novelty.ts              # NEW — NCBI E-utilities + EBI/ENA client (§6.9)
│   │       ├── decks.ts                # NEW — deck templates + slide model (§6.10)
│   │       └── crackPipeline.ts        # NEW, BLOCKED — six-layer pipeline (§6.11, needs spec)
│   ├── organize/categories.ts          # NEW — the 33-item placeholder taxonomy (§6.7)
│   └── storage/providers/{zenodo,osf,dryad,figshare}.ts
├── supabase/migrations/
│   ├── 202609170003_eyewee_conversations.sql   # (exists — reconcile per §9 first)
│   ├── 202609210001_eyewee_waitlist.sql        # (done)
│   └── <new>_*.sql                             # added per-phase, only after §9's account-model question is answered
└── docs/{SPEC.md, DEVELOPMENT_PLAN.md}
```

---

## 5. Phased development plan

| Phase | Goal | Ships | Depends on | Exit criterion |
|---|---|---|---|---|
| **0 — Done** | Pre-launch presence | Landing page, waitlist, persona chat shell, canned replies, eye mark, illustrative novelty-check & deck-gen copy | — | Already live |
| **1** | Real conversation persistence | ✅ Code complete — device-scoped schema + list/create/load/send endpoints (`app/api/conversations/**`), `PersonaExperience.tsx` rewired to them. Send endpoint wired through the crisis gate, still returns the canned reply. **⏳ Pending: migration apply** (§9, live-tested: DB calls correctly 500 with "table not found" until then) | §9 (resolved) | Conversations survive reload — verifiable the moment the migration is applied |
| **2** | Storage connections | ✅ Code complete — OAuth2 authorization-code flow for Zenodo/OSF/Dryad/Figshare (`lib/storage/providers/**`, `app/api/storage/**`), AES-256-GCM token encryption at rest (`lib/eyewee/tokenCrypto.ts`), disconnect removes eyewee's link only. Verified live: connect endpoint correctly returns a clear "not configured" error since no vendor OAuth app is registered yet (§8.1). **⏳ Pending: migration apply + real vendor OAuth app registrations** | §9 (resolved) | Connect/disconnect works once a vendor app + the migration are in place |
| **2.5 (new)** | Novelty-check service | ✅ **Live and working** — real PubMed/GenBank/EMBL lookup (`lib/eyewee/leverage/novelty.ts`, `/leverage` page), verified against the actual NCBI/EBI APIs this session | None — public APIs, no accounts needed | Met |
| **2.6 (new)** | Deck-generation scaffold | ✅ Code complete — UI + API shape (`lib/eyewee/leverage/decks.ts`, `/leverage` page) with clearly-labeled placeholder content. **Content drafting itself needs live Claude (Phase 4)** | None for the scaffold; Phase 4 for real content | Met for the scaffold; real content waits on Phase 4 |
| **3** | Guardrail infrastructure | ✅ Code complete — crisis gate (`lib/eyewee/guardrails/crisisGate.ts`, closed by default) + PHI pre-send filter (`lib/eyewee/guardrails/phiFilter.ts`, wired into the send-message endpoint, returns a 422 with guidance rather than silently passing through) | Phase 1's send endpoint existing | Met — composer warning copy also added to `PersonaExperience.tsx` |
| **4** | Live Claude integration | ✅ Code complete — `lib/eyewee/claude/client.ts` (Anthropic SDK, model `claude-sonnet-5` by default, override via `EYEWEE_CLAUDE_MODEL`), `systemPrompt.ts` (language-match rule, pillar framing, immigration/mental-health boundary defaults — NOT the six-layer pipeline, see §8.1), wired into the send endpoint with conversation history + memory context. Falls back to the canned reply if the gate is closed (default) or if the live call errors. **API key verified working** (`ANTHROPIC_API_KEY`, live-tested this session). **Gate is still closed and stays closed** pending legal/mental-health clearance — a working key is not clearance | Phase 1 + 3 + legal/mental-health clearance | Code met; live behavior waits on the human clearance decision, not more building |
| **4.5** | Six-layer "crack the project" pipeline | ✅ Code complete and live-tested — `lib/eyewee/leverage/pipeline.ts` (locked spec, supplied 2026-09-30), the layer-2/6-only boundary is an enforced guard (`assertLayerInScope`, throws on layers 3-5), wired as the real entry point for both the novelty-check and deck-generation endpoints | Spec supplied | Met |
| **5** | Multilingual voice | ✅ Code complete — push-to-talk mic input via Deepgram (`lib/eyewee/voice/stt.ts`) and spoken replies via ElevenLabs (`lib/eyewee/voice/tts.ts`), both swappable defaults, not the final vendor decision the plan's own evaluation criteria still call for. Wired into `PersonaExperience.tsx` with real eye-state transitions (click mic → Wake → Listening while recording → Thinking while transcribing/replying → Spark on reply). **⏳ Pending: `DEEPGRAM_API_KEY` / `ELEVENLABS_API_KEY`** — neither was provided, so both endpoints correctly return a "not configured" error today (live-tested) | Phase 4 (for anything beyond transcription — the reply being spoken still goes through the same gated `draftEyeweeReply`) | Code met; needs STT/TTS keys to actually produce audio, then the accented-speech test matrix (§7) |
| **6** | Memory write path | ✅ Read path code complete (`lib/eyewee/memory.ts`, `/api/memory`, sidebar list in `PersonaExperience.tsx`) — pending migration apply. Write path still blocked on the extraction-model decision (§8.2) | Phase 4 for write path only | Read path met; write path waits on Ran |
| **7** | Document search | ✅ Done (built previous session) — in-doc find bar + demo page; PDF.js text layer noted for when a real viewer is chosen; cross-library index scoped separately | Independent | Met |
| **8** | Organize readiness hooks | ✅ Category placeholders done (`lib/organize/categories.ts`, locked 33 items) + routing hook done (`lib/eyewee/routing.ts`, stubbed to always return `"postdoc"` since eyewee-standalone is account-free and serves only postdocs). **role field + visibility layer:** with no user schema in eyewee-standalone (account-free), these likely belong in `postdocworks` instead — see §8.2 item 6 (new) | §9 (resolved — clarified the role field's actual home) | Placeholders + hook met; role field/visibility layer redirected to the right repo |
| **9** | Launch QA | Full 6-suite dry run + multilingual + PHI/crisis + guardrail-boundary tests | Everything shipping in that wave | Every suite green |

**Safe to start immediately, no blockers:** Phase 2.5 (novelty-check), Phase 7a (document search
find bar), Phase 2.6's UI scaffold (deck generation shell), Phase 3's guardrail *mechanism* code
(the gate can be built and unit-tested before anything depends on it).

---

## 6. Per-service build plan

*(6.1–6.8 carried over from v1 with corrections noted; 6.9–6.11 are new this pass.)*

### 6.1 Conversations & messages
Unchanged from v1 — see §9 for the prerequisite decision on the account model before extending
`eyewee_conversations`/`eyewee_messages`.

### 6.2 Claude integration
Unchanged from v1 (explicit language-match system prompt rule; STT-detected language as metadata;
memory context once Phase 6 lands; always behind the crisis gate).

### 6.3 Multilingual voice
Unchanged from v1 (STT: Google/Azure/Deepgram/Whisper; TTS: ElevenLabs/Google/Azure; manual
language-lock; "switch language" command; per-language accented-speech testing). **Note added this
pass:** if the eye-state model really does include a "Wake"/"Listening" state plus a wake word
(§8.1), voice activation is a *first-class* UX flow, not an accessory — that would change this
phase's shape (always-listening mic vs. push-to-talk). Don't scope the voice UI in detail until
§8.1 resolves.

### 6.4 Storage integrations (Zenodo, OSF, Dryad, Figshare)
Unchanged from v1. **Clarification added this pass:** this is strictly the "reconnect a postdoc's
own prior deposits" feature. It is **not** the same as, and should not be conflated with, the
Novelty-check service in §6.9 — v1 of this plan made exactly this mistake.

### 6.5 Memory
Unchanged from v1.

### 6.6 Guardrails — crisis-response hold + PHI/HIPAA
Unchanged from v1, plus:
- **New open item:** the reviewer flagged that the **immigration/visa content boundary** (eyewee
  answering things like USCIS AR-11/E-COA questions, shown in the Navigate pillar demo) isn't
  named as its own gate anywhere. Unlike the PHI/crisis gates, this isn't obviously a "block the
  message" situation — postdocs asking visa questions is core Navigate functionality, not a risk to
  filter out. What's actually missing is a **scope-and-liability boundary**: eyewee should answer
  general process questions (forms, deadlines, public procedure) but have an explicit rule against
  giving individualized immigration *legal advice*, with a clear hand-off line ("talk to your
  institution's international office / an immigration attorney") — this needs the same kind of
  locked policy text the wellbeing guardrail has, and doesn't currently exist anywhere accessible.
  Added to §8.1 rather than invented here.

### 6.7 Organize (PI-facing) — readiness only, corrected item list

**Correction this pass:** v1 carried the older 24-item placeholder list from `docs/SPEC.md`, which
predates 9 items that were locked afterward. The current, complete list (confirmed against the
"Dashboard: Parking Lot" reference material) is **33 items across 5 categories**:

| Category | Items | Count |
|---|---|---|
| Research Output | Papers, Reviews, Commentaries, Reply to Manuscript | 4 |
| Grants | National Grants, NIH R01 Grants, International Grants, R21 Grants | 4 |
| People | Students, Trainees, Postdocs, Lab Manager, Visiting Lecturers, Visiting Fellows/Scholars, Performance Improvement Metrics | 7 |
| Lab Administration | Admin, Accounting, Budgeting, Personnel Salaries, Travel, Conferences, Collaborations, Overhead Expenses, Vendors, Think Tank Meeting Organizer & Notes, Lab Meeting Organizer & Scheduling | 11 |
| Lab Resources | Instrument Maintenance, Animal Experiments, Animal Food Supply, Reagents & Chemicals, Kits, Software, Data | 7 |
| **Total** | | **33** |

This should be locked to exactly 33, not carried as a range. `lib/organize/categories.ts` (§4)
should encode this list as a literal constant, not a re-derived count.

The four architectural decisions from v1 (role field, placeholder reservation, visibility-permission
layer, `context.role` routing hook) are unchanged — but note the role field needs an actual user
table to attach to, which is itself downstream of §9's account-model decision.

**New open item:** where do **pricing tiers** live in the data model? Not previously discussed
anywhere in either repo. This has no natural home yet — likely a `subscription_tier` (or similar)
field alongside the new `role` field once §9 is resolved, but the actual tier structure (what's
free vs. paid, and whether it gates Organize, voice, or storage-connect specifically) hasn't been
specified. Flagged in §8.1, not designed here.

### 6.8 Document search
Unchanged from v1 (in-doc find bar now, cross-library search scoped separately; PDF.js text-layer
catch).

### 6.9 Leverage — novelty-check (NEW)

Demoed on the landing page (`app/page.tsx`, "PREVIEW 1: NOVELTY GAP") but had no corresponding
service anywhere in v1 of this plan — this was a real gap, not a documentation nicety, since it's
one of Leverage's two flagship capabilities (the other being deck generation, §6.10).

- **What it does:** given a postdoc's described finding (e.g., "a mutation in the HBV X gene"),
  checks whether it's already been reported — not just in published literature, but in raw
  sequence-deposit databases that a literature search alone misses.
- **Sources, in the order the demo uses them:**
  1. **PubMed** (NCBI E-utilities `esearch`/`esummary` — free, public REST API; an API key raises
     the rate limit but isn't required for normal usage volume).
  2. **GenBank** (NCBI's sequence database — same E-utilities family, `db=nuccore`).
  3. **EMBL/ENA** (EBI's sequence database — free public REST API; the demo notes EMBL mirrors
     GenBank daily via the INSDC sync, so in practice a GenBank hit usually means an EMBL hit too,
     and the service should say so rather than presenting them as independent findings).
- **This is a real, buildable-now service** — no accounts, no paid keys, no crisis-response gate
  (it's a literature/sequence lookup, not a conversational model reply). The only Claude-API
  involvement is optional: using the model to turn raw hits into the plain-language "here's what's
  actually new" summary shown in the demo. That summarization step *can* wait behind the
  crisis-response gate if treated as "eyewee talking," or it can ship now as a simple templated
  summary over the structured hits, with the more natural-language framing added once Phase 4
  lands. Recommend the templated version first — it's a genuinely useful, ungated Phase 2.5.

### 6.10 Leverage — deck generation (NEW)

Demoed on the landing page ("PREVIEW 2: DECK GENERATION") and in more detail in a separate deck-
generation brief (not in either repo, but seen directly in the source material this plan is based
on) — also missing from v1 entirely.

- **What it does:** from a postdoc's described findings, produces **three deck variants
  automatically, not as an extra step:**
  1. **Main Presentation** — clean, podium-ready.
  2. **Rehearsal Presentation** — same content, but with a scripted spoken line added to every
     slide, so a postdoc who blanks out mid-talk has something to say instantly (the demo copy
     calls this the deck's "reversal lines" — i.e., a fallback line to recover if you lose your
     train of thought, not a literal "reversal" of content).
  3. **Layman's Presentation** — same findings, reframed in plain language for a non-specialist
     audience.
- **Build shape:** the deck *content* (turning a postdoc's raw findings into three coherent,
  differently-pitched slide decks) is a generative-writing task — it needs the live Claude model,
  so it's gated the same as chat (§6.6). What can ship now, independent of that gate: the UI
  (`DeckGeneratorPanel.tsx`), the API shape (`POST /api/leverage/decks`), and a slide/deck data
  model (title, slides[], each slide with body + optional rehearsal-line + optional layman's-mode
  copy) populated with template/placeholder content — consistent with the existing "still being
  built" canned-reply pattern elsewhere in this repo, so the feature is demoable end-to-end before
  the model call is ever live.
- **Export format** not yet specified anywhere — needs a decision (PPTX via a library, or a
  print-ready HTML/PDF deck) before the download button in the demo becomes real. Flagged in §8.1.

### 6.11 Leverage — the six-layer "crack the project" pipeline (✅ built 2026-09-30)

The locked spec, supplied 2026-09-30, is implemented in `lib/eyewee/leverage/pipeline.ts`. Six
layers map a postdoc's actual work executing an inherited, unsolved research project:

| Layer | Name | eyewee builds this? |
|---|---|---|
| 1 | Understand | No — the postdoc's own work |
| 2 | Synthesize literature | **Yes** — `runSynthesizeLiteratureLayer`, wraps the novelty-check service (§6.9) |
| 3 | Self-assess | No |
| 4 | Develop | No |
| 5 | Interpret | No |
| 6 | Present | **Yes** — `runPresentLayer`, wraps the deck-generation service (§6.10) |

**The permanent boundary:** eyewee only ever automates layers 2 and 6. `assertLayerInScope()`
throws for layers 3-5 — live-tested this pass, confirmed it actually throws rather than just being
documented intent. Why (per the reference doc): automating layers 3-5 would make postdocs feel
replaced by the tool, and would let a PI use eyewee to justify not hiring a postdoc at all. This
guard is called from both `runSynthesizeLiteratureLayer` and `runPresentLayer`, and both
`/api/leverage/novelty` and `/api/leverage/decks` now call through the pipeline (via
`lib/eyewee/leverage/adapters.ts`) rather than the underlying services directly, so the boundary is
enforced at the real entry point, not just asserted in a doc comment.

**Contract change this introduced:** Layer 6 ("Present") is locked to always generate **two**
editions together (layman + technical, technical requiring a reversal line on every slide) — not
the three-variant Main/Rehearsal/Layman's model in earlier versions of this plan. `decks.ts` and
`DeckGeneratorPanel.tsx` were updated to match; the export-format question (§8.1) still applies to
both editions.

**Naming note:** the pipeline's `postdocId` field has no real identity to fill it in an
account-free app — the API routes pass the anonymous device id (§9) into that slot. Worth
reconciling the field's name with whoever owns the locked spec if eyewee stays account-free
long-term (see §10 for the closely related PostdocWorks-identity question).

---

## 7. Testing & QA plan

Unchanged from v1 (per-language STT/TTS/response/switching tests folded into the 6-suite dry run;
explicit loud-failure test for mis-transcribed accented speech; PHI filter tests across languages;
crisis-gate audit tests; storage-disconnect never-mutates-vendor-data test). **Add once §8.1's gaps
are filled:** a test that Leverage conversations never surface pipeline reasoning outside layers 2
and 6 (once that spec exists), and a novelty-check accuracy test comparing service output against
manually-verified PubMed/GenBank/EMBL results for a fixed sample set of findings.

---

## 8. Decisions & missing source material this plan is blocked on

### 8.1 Missing source material

**Resolved 2026-09-30** — all four items the gap review flagged were supplied and are now built:
the six-layer pipeline (§6.11), the 5-state eye model (§2, §6.3), Trust's locked copy (§1), and the
biomedical-first field-scope doc (applied where it touches eyewee; see below for what doesn't).

**Also resolved 2026-09-30 — deck-generation export format** (§6.10): a self-contained, printable
HTML file per edition (`lib/eyewee/leverage/deckExport.ts`, `/api/leverage/decks/export`,
live-tested), not a generated `.pptx`. Chosen specifically because slide content is still
placeholder text pending the crisis-response gate — a PPTX-generation library is real added weight
for a feature that can't produce real content yet. Zero new dependencies; revisit if a real
`.pptx` deliverable becomes an actual requirement once Layer 6 content is live.

**Still open:**

1. **The field-scope doc's other two action items belong in `postdocworks`, not here** — generalizing
   the credential-application `PMID` field into a source-tagged literature-reference field, and
   reserving empty Doc2Postdoc taxonomy placeholder slots. Both are schema/copy changes in
   `postdocworks`' own migrations and UI, not eyewee's. Not implemented in this pass — flagging the
   redirect rather than guessing at `postdocworks`' exact schema from this repo (same reasoning as
   the Organize `role` field in §8.2 item 8). Say the word if this session should also work in that
   repo.

### 8.2 Product decisions (need Ran, not the developer)

**Answered 2026-10-07/08 by Ranjit — all now built:**

1. **Memory write-path model** — ✅ **hybrid.** eyewee suggests, postdoc approves before anything
   saves; saved facts are visible, editable, and deletable. Locked rule: never suggest or save
   mental-health, medical, immigration-case, or other sensitive personal detail. Built as
   `lib/eyewee/claude/memorySuggestion.ts` (the suggestion call) + `lib/eyewee/memory.ts` (write
   path) + `lib/eyewee/guardrails/memorySafety.ts` (the enforced exclusion filter — not just a
   prompt instruction) + `POST/PATCH/DELETE /api/memory[...]`. Live-tested: a real suggestion came
   back, was approved, edited, and deleted; directly POSTing a sensitive-sounding fact was
   correctly rejected with a 422.
2. **Crisis-response clearance mechanics** — Ranjit: nobody reviewing yet, starts from scratch; two
   written sign-offs needed (privacy/AI lawyer + licensed mental-health professional), he makes the
   final call, developer flips the switch only on his written word. **New mechanism this pass:**
   the public switch (`EYEWEE_CRISIS_RESPONSE_GATE_OPEN`) stays untouched/closed, exactly as
   before — but Ranjit also asked for "chat stays open for internal testing by the team," which
   didn't exist yet. Built `lib/eyewee/guardrails/internalTest.ts` +
   `/api/internal/enable-testing?token=...`: visiting that URL (token only shared with the team,
   not linked anywhere in the UI) marks *that browser* as an internal tester via an httpOnly
   cookie, unlocking live Claude replies and memory suggestions for that browser only — the public
   switch and the public experience are completely unaffected. Live-tested both sides: without the
   token, still the canned reply; with it, a real, detailed Claude response.
3. **Which Claude API configuration** — ✅ confirmed **standard, no BAA, no HIPAA coverage.**
   Recorded directly in `lib/eyewee/claude/client.ts`. The PHI filter and composer warning (§6.6)
   stay on regardless of gate state, per Ranjit's explicit instruction.
4. **Wellbeing/immigration wording** — Ranjit: the current placeholder wording is fine for internal
   testing only, must not reach real users, and counsel/a clinician will supply the approved final
   text. Since it's now gated by the internal-test mechanism above (§8.2 item 2), that requirement
   is structurally satisfied, not just a comment — real users still only ever get the canned
   reply. The immigration line was updated to match his exact framing ("sourced, general process
   answers... routes to International Office or an immigration attorney" for case specifics).
5. **Pricing-tier structure** — ✅ shape confirmed (numbers not decided, billing explicitly not
   built): free core; role-based tiers (`postdoc_base` / `faculty_premium`); paywall activates
   after usage habit forms, not at signup; no feature gating decided yet. Built: migration
   `202610080001_eyewee_tier_and_usage.sql` (`eyewee_device_profile.tier`, `eyewee_feature_flags`
   seeded with `voice`/`storage_connections`/`organize`, all ungated), `lib/eyewee/tier/{profile,
   featureFlags,usage}.ts`, `GET /api/usage`. The "eye turns reddish at 100% usage, no lockout"
   visual was already built last session as `Eye`'s `usagePercent` prop (§6.3's rebuild) — now
   actually wired to real per-device daily message counts via `PersonaExperience.tsx`. The daily
   allowance (50 messages) is a **placeholder constant**, clearly marked in `usage.ts` — swap in
   real per-tier numbers there once decided, no schema change needed.
6. **Whether Doc2Postdoc/PostdocWorks-internal detail belongs in this document.** Resolved for now
   as: **no** — this doc stays scoped to eyewee itself; Doc2Postdoc detail lives in
   `postdocworks/docs/doc2postdoc-spec.md`. Revisit if that's wrong.
7. **Trust surfacing badge/credential data** implies eyewee needs a read path into PostdocWorks'
   badge/credential data — no such integration point exists in this repo today. Worth scoping once
   Trust's locked copy (§8.1.3) exists.
8. **Organize's `role`/`account_type` field's actual home (new).** Now that eyewee-standalone is
   confirmed account-free, there's no user table here to attach a `role` field to (§6.7/§9). Since
   Organize is PI-facing and PIs would plausibly authenticate through `postdocworks` (which does
   have accounts) rather than through eyewee, this field — and the postdoc↔PI visibility-permission
   layer — most likely belong on `postdocworks`' user schema, not here. Not designed in either repo
   yet; flagging the redirect rather than guessing at postdocworks' schema from this repo.

---

## 9. Known inconsistencies to reconcile first

1. **Accounts vs. account-free — RESOLVED 2026-09-28: account-free.** Confirmed by the user: no
   login, no email, no password, ever. `eyewee_conversations`/`eyewee_messages` (the old,
   `auth.users`-based tables) are confirmed orphaned/superseded, not dropped (dropping tables on a
   shared Supabase project is a deliberate, separate call — not done here). The resolution:
   **an anonymous, random device id, minted per browser and stored in a long-lived httpOnly
   cookie** (`lib/eyewee/session/deviceId.ts`) is the key every device-scoped table now uses
   instead of `auth.users`. It is not an account — nothing to log into, no password to reset, no
   server-side notion of "this device belongs to this person" — it exists purely so OAuth tokens
   and memory facts have *something* durable to attach to, since neither can safely live in
   client-side storage. New tables: `eyewee_device_conversations`, `eyewee_device_messages`,
   `eyewee_device_storage_connections`, `eyewee_device_memory_facts` (all in the new migration).
   They carry **no RLS policies for `anon`/`authenticated`** — deliberately policy-less, since
   there's no Supabase Auth session to key a policy on. The trust boundary is entirely server-side:
   only Next.js route handlers touch these tables, using the service-role client
   (`lib/eyewee/supabaseAdmin.ts`), and every query filters on the calling request's own device id
   in application code — see `lib/eyewee/conversations.ts` for the pattern (including an explicit
   ownership check before any read/write keyed by a conversation id, so one device can't touch
   another's rows even if it somehow obtained the row's uuid).
2. **This repo's relationship to `postdocworks`.** Confirmed this pass: `postdocworks` is a real,
   separate sibling repo at `C:\Users\keert\Documents\postdocworks`, containing its own (currently
   stale/identical) copy of `docs/SPEC.md` at `postdocworks/docs/eyewee-spec.md`. `README.md` here
   still frames this folder as a build/prototype staging area whose pieces get ported back into
   `postdocworks/app/eyewee/`; the last two commits and the live landing page's own "one company,
   two decisive moves" framing (eyewee as the entry point linking *out* to Doc2Postdoc/
   PostdocWorks, not a piece of either) suggest this has since become the real, standalone product.
   Confirm which framing is current — it decides whether new work lands here for good or is still
   meant to be ported into `postdocworks` later, and it's a prerequisite for resolving #1 above.

---

## 10. Giving eyewee access to a postdoc's real PostdocWorks data

Requested 2026-09-30: "eyewee should... have access to all their postdoc work." Investigated
rather than built, because of what was found:

**The data genuinely exists and is genuinely reachable.** `postdocworks` has real tables for a
postdoc's actual work — credential applications, Doc2Postdoc signups/matches, profile sections,
reputation, pillar taxonomy, and more (`postdocworks/supabase/migrations/*.sql`). And confirmed
live this session: **`eyewee` and `postdocworks` already sit in the exact same Supabase project**
(`NEXT_PUBLIC_SUPABASE_URL` matches byte-for-byte in both repos' env files). eyewee's service-role
client (`lib/eyewee/supabaseAdmin.ts`) can technically already read every one of those tables — it
bypasses RLS entirely, same as any service-role key.

**The blocker is identity, not connectivity.** `postdocworks`' tables are keyed to `auth.users` —
real accounts, real logins. eyewee is deliberately account-free (§9): no login, no email, nothing
that says "this browser belongs to this specific postdoc." Without that link, there is no correct
answer to "whose credential applications/matches/profile should this request fetch" — the request
carries only an anonymous device id. Building a fetch against postdocworks' tables without solving
this first wouldn't degrade gracefully, it would either do nothing or, worse, silently return the
wrong postdoc's data to whoever happens to be talking to eyewee at the time. That's not a risk to
guess through, especially against a live database with real people's credential/career records —
so this wasn't built without confirming the approach first.

**The consistent way to close this gap:** an explicit, opt-in "Connect your PostdocWorks account"
action — the same shape as the Storage-connect feature already built (§6.4), not a login wall.
A postdoc who wants eyewee to see their PostdocWorks profile clicks a button, authenticates once
(most likely via `postdocworks`' existing Supabase Auth session — e.g. exchanging a short-lived
signed token that `postdocworks` mints for its logged-in user, redeemed here to link that
`auth.users` id to the current device id), and only from that point on does eyewee have anything
to read. Nothing changes for a postdoc who never connects — eyewee stays exactly as account-free
as it is today for everyone else. This needs a companion piece built in `postdocworks` itself (an
endpoint to mint that short-lived link token) — out of scope for this repo alone.

**Not done without a decision:** which of postdocworks' data eyewee should actually be allowed to
read once connected (all of it, or a scoped subset — profile/credentials feel clearly in-scope;
Doc2Postdoc's peer-matching data or reputation/dispute data feels like it needs its own call,
same spirit as the Trust-pillar/badge-visibility question in §8.2 item 7). Flagging the shape of
the solution here; the scope and the exact linking mechanism are for the user/Ran to confirm before
it's built, not something to infer silently.
