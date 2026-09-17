# eyewee — standalone build folder

This is a **separate folder from `postdocworks`**, for building and iterating on eyewee
independently before its pieces get ported into the live app at
`postdocworks/app/eyewee/`.

## Why a separate folder

`postdocworks` is the live Next.js + Supabase app (postdocworks.io). eyewee's chat surface,
storage-connection OAuth, and memory system are not launched there yet — several are explicitly
gated (see `docs/SPEC.md` §2.1, the crisis-response hold on live message-sending). Building and
demoing eyewee pieces here keeps unfinished/gated work out of the live app's routes until it's
ready to be wired in for real.

## What's already live in postdocworks (don't rebuild these here)

- `/eyewee` landing page — `postdocworks/app/eyewee/EyeweeLanding.tsx`. Master line + the three
  confirmed crossing punchlines (Translate/Navigate/Leverage), linked from the main nav.
- A placeholder "Ask Eyewee" panel inside the Doc2Postdoc workspace
  (`postdocworks/app/doc2postdoc/HomeExperience.tsx` → `POST /api/eyewee`) — a canned,
  pattern-matched responder, intentionally not a real model call.

## What lives here

- `docs/SPEC.md` — full condensed spec: the chat-page data model/API/build order, the
  crisis-response hold, the Organize (PI-side) readiness notes, and the document-search dev
  instructions. Copy of `postdocworks/docs/doc2postdoc-spec.md`'s sibling doc — **if you edit one
  copy, port the change to the other** (or delete this copy and just link to the one in
  `postdocworks/docs/` once this project is no longer being edited standalone).
- `prototype/eyewee-page.html` — the verified, working reference for the actual chat page a
  postdoc sees: sidebar (storage / memory / recent conversations / profile) + main column (the
  animated eye + message thread + composer). Open it directly in a browser, no build step needed.
  This is the exact file delivered by i4iSciences — treat its layout, the eye SVG, and the state
  wiring (`setBehavior("thinking"/"idle"/"stuck"/"spark")`) as the real deliverable; the
  conversation content, memory items, and storage states inside it are illustrative placeholders.
  Search it for `PLACEHOLDER` for every spot that becomes a real API call once ported.

## Integration plan (when a piece here is ready to go live)

1. Port the piece into `postdocworks/app/eyewee/` as real React (a Next.js client component), not
   as a raw HTML file — the rest of the app is React/TSX.
2. Reuse the exact SVG paths/gradients/keyframes for the eye mark — do not redraw it (per the
   source instructions, it's a verified reference asset).
3. Wire it to real Supabase-backed endpoints under `postdocworks/app/api/eyewee/...`, following the
   data model in `docs/SPEC.md` §2.2 (translated from the spec's Mongoose/MongoDB phrasing to this
   repo's actual Supabase/Postgres tables — don't introduce a second database).
4. Respect every gate in `docs/SPEC.md` §2.1 and §2.5 — specifically: build conversation
   list/create/load endpoints freely, but do not enable real message-sending, and do not build the
   Memory write path until the extraction-model decision is made.
5. Once a piece is fully ported and live in `postdocworks`, delete (or clearly mark stale) the
   corresponding file here so this folder doesn't drift into being a second source of truth.

## Not here yet

- The eyewee landing page (already built directly in `postdocworks`, see above — no separate copy
  needed here).
- `repository-connect-workflow.html` and `eyewee_document_search_demo.html` — referenced in the
  spec but their actual file contents weren't provided in the session that created this folder;
  add them here when available, following the same pattern as `prototype/eyewee-page.html`.
