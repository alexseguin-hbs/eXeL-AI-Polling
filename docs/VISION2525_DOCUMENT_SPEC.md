# Vision • 2525 — Document Architecture Spec

**Version:** 17 (in progress — the 33 passes have not run) · **Revision:** r72 · **Live:** `/vision-2525/white-paper`
**Open questions:** `docs/V17_OPEN_QUESTIONS_REGISTER.md`
**Status:** LIVE · locked at release 40, extended to three views at release 41; spec surfaced in-document at release 42 · gated by `scratchpad/lv-gate.mjs`
**Applies to:** `docs/SOI_VISION2525_LIVING_DOCUMENT.html` and its dated release copies

> **The rule this spec exists to enforce:** there is exactly **one** Vision 2525 document.
> Any additional reading — a brief, a regulator's cut, a translation, a one-pager — is a
> **view over the same ledger**, never a second file. Two files making the same claims are
> two chances to be caught contradicting yourself.

---

## 0. Why this spec exists

Until release 40 the short read shipped as a separate HTML file. When the document was renamed
at release 39, the brief did not follow — it had to be found and hand-patched to match. **Two
artefacts making the same claims began to disagree within a single day.** That is precisely the
failure the framework exists to prevent, reproduced in the framework's own deliverables.

The fix was structural, not editorial: stop having two artefacts.

---

## 1. Core model

The document is **never stored**. It is reconstructed on demand from an append-only ledger.

```
LEDGER      append-only array of { v, id, why, html }
            v    release number the entry was written at
            id   block identifier (stable across releases)
            why  the reason recorded at the time — never backfilled
            html the rendered content

replay(v, order)  =  for each id in `order`:
                       take the newest LEDGER entry with e.id === id and e.v <= v
                       if one exists, emit it

                     same (v, order) in  ->  same bytes out. always.
                     no clock, no randomness, no hidden state.
```

**Last-write-wins per block id.** A revision supersedes; it never deletes. There is no delete
operation and there never will be — see §6.

---

## 2. Views

A **view is an ORDER, not a template.** Both views replay the same ledger with the same function.

```js
const VIEWS = {
  paper:  {order: PAPER_ORDER,  label: "White paper", hash: "paper"},
  ledger: {order: LEDGER_ORDER, label: "Ledger",      hash: ""},
  brief:  {order: BRIEF_ORDER,  label: "Brief",       hash: "brief"}
};
let view = "paper";                 // the default landing view
const VIEW_CYCLE = ["paper","ledger","brief"];
function ORDER_FOR(){ return VIEWS[view].order; }
```

| View | Order | Size at r41 | The question it answers |
|------|-------|:-----------:|-------------------------|
| `paper` | `PAPER_ORDER` | 15 blocks | What is this, and why is it shaped this way? |
| `ledger` | `LEDGER_ORDER` | 74 blocks | What changed, when, and for what recorded reason? |
| `brief` | `BRIEF_ORDER` | 8 blocks | Can I have the twenty-minute version? |

**The white-paper view carries no release numbers.** A stranger arriving at the framework does not care
that we were wrong at release nine. The ledger view is where change history lives; keep them separate.

### A view can be younger than the record — the fallback rule (r49)

A view's order is a list of ids **written at some release**. Replay that order at an earlier release and
it returns nothing, because none of the ids existed yet. `PAPER_ORDER` was written at r41; between r1 and
r40 it replays to **zero blocks**.

This is not hypothetical. It shipped. From r41 to r48 the default view rendered a **completely blank page
for releases 1 to 40** — forty of forty-nine releases, unreachable from the front door — and the gate did
not catch it because the structural checks pin `setView('ledger')` first (§7), which is exactly the
decision that hid it.

```js
function blocksFor(v){
  const own = replay(v, VIEWS[view].order);
  if (own.length){ fellBack = null; return {blocks: own, order: VIEWS[view].order}; }
  fellBack = {view, label: VIEWS[view].label, first: viewFirstRelease(view)};
  return {blocks: replay(v, LEDGER_ORDER), order: LEDGER_ORDER};   // the complete record, from v1
}
```

**The rule, in three parts:**

1. When the open view has nothing at the selected release, serve the **complete record** for that
   release. `LEDGER_ORDER` exists from v1 and must always remain the fallback of last resort.
2. **Say so on the page.** The `.fellback` banner names the view asked for, the release it was first
   written at, and how to get back to it. A silent substitution is worse than a blank page.
3. **Never generate content to fill the gap.** There was no white paper at release 20. Inventing one
   destroys the only property that makes the document worth replaying.

The state hash in the deck must be computed from the order actually rendered — `blocksFor()` returns
both — or it describes a document the reader is not looking at.

### Comparison is a property of the RECORD, not of the view (r49)

`compare(a,b)` and `improvements(v)` **must** iterate `LEDGER_ORDER`, never `ORDER_FOR()`. Two readers in
two different views comparing the same two releases must be told the same thing about what changed. This
was the same defect as the blank page wearing a different coat: in the paper view, comparison of any two
pre-r41 releases returned empty.

### The section index

Every view carries a jump strip in the sticky deck (`.deck-sec > #chips`):

- **Numbered sections** (paper) → their real `§` number, from the `h2.sech` text. Never invented.
- **The record** → one chip per contiguous run of a block-id family (`UNIT`, `FUND`, `GOV`), suffixed
  `·2`, `·3` where a family runs more than once. Governance genuinely appears three times; the suffix
  says which run rather than pretending the record is tidier than it is.
- **A single-family view** (the brief is all `brief.*`) → one chip per block, from the id's tail.

The strip is scrolled by setting `scrollLeft` directly — **never `scrollIntoView`**, which can scroll the
page out from under a reader who only asked to see which section they are in.

### Adding a third view

1. Define `<NAME>_ORDER` as an array of block ids.
2. Register it in `VIEWS`.
3. Write its blocks into the ledger with `L(v, id, why, html)` at the current release.
4. Add the id list to the gate's orphan check, distinctness union, and overlap check (§7).
5. Add it to `VIEW_CYCLE` so the toggle reaches it.

**No engine changes are required.** Slider, Play, Changes, Key improvements, Compare and
Full-doc all operate on `ORDER_FOR()` and inherit the new view for free.

### Rules for view membership

- **Id sets MUST be disjoint.** A block belongs to exactly one view. The gate asserts this.
  (If a block genuinely belongs in two places, that is a signal it should be split.)
- **Every ledger id MUST appear in exactly one view's order.** An id in the ledger but in no
  order is an orphan — invisible content, silently dropped. The gate fails on this.
- **A view must never restate a claim made in another view.** It may summarise, compress or
  reframe. It may not assert something the ledger does not already say, because then the two
  views could disagree, which is the whole failure this design prevents.

---

## 3. The masthead is part of the record

Fixed at release 39, after a defect (#20) in which the title sat outside the replay and every
rename silently rewrote all earlier releases.

```js
const TITLES = [
  {v:1,  h1:"The Unit and The Shield",                     sub:""},
  {v:35, h1:"The Living Ledger of Human Contribution",     sub:""},
  {v:36, h1:"The Living Ledger of Human Contribution",     sub:"Recursive Coordination for Human Continuity"},
  {v:39, h1:"Recursive Coordination for Human Continuity", sub:"The Living Ledger of Human Contribution"}
];
function titleAt(v){ /* newest entry with t.v <= v — same rule as the block ledger */ }
```

`titleAt(v)` drives the `<h1>`, the subtitle and `document.title`. The static HTML carries the
current values as the no-JS fallback.

**Rule:** anything that renders differently at different releases MUST resolve from a table
with a `v` field. Nothing about the document's presentation may be version-blind. The frame is
as auditable as the contents — because nobody audits the frame, which is exactly why it drifts.

---

## 4. Deep links

| Hash | Opens |
|------|-------|
| `#v41` | Ledger view at release 41 |
| `#brief/v41` | Brief view at release 41 |
| `#paper/v41` | White-paper view at release 41 |
| *(none)* | White-paper view at the latest release |

Parsed by `/^#(?:(brief|paper)\/)?v(\d+)$/`. Section anchors inside the paper view (`#sec-8`) are
**intercepted and scrolled**, never navigated — otherwise a jump to §8 would destroy the version hash. The hash is rewritten on every navigation via
`history.replaceState`, so any state a reader reaches is shareable.

---

## 5. Release process

One pass = one full R-CORE cycle. **Append only. Never rewrite history.**

1. **Ship** — add a `VERSIONS` entry and one or more `L(v, id, why, html)` calls. Revising an
   existing id supersedes it; the earlier version stays scrubbable.
2. **Review** — twelve Ascended Masters, honest grades, real findings. **They must disagree.**
   A release where all twelve agree has not been reviewed.
3. **Direct** — one MoT directive naming the single most important remaining gap.
4. **Gate** — raise the version ceiling in `lv-gate.mjs` and run it. Must print `PASS`.
5. **Re-derive** — any new arithmetic independently in Python before it ships.
6. **Release** — copy to `docs/VISION2525_LIVING_LEDGER_YYYY.MM.DD.html`, commit, push to both
   branches, report `SHA | committed | pushed | LIVE-UNVERIFIED` plus the site URL.

### The spec is reachable from inside the document

The ⚙ icon in the replay deck opens a panel stating **the release number, the release code, the title in
force, and the architecture** — view counts, ledger entry count, deep-link grammar, title count, the path
to this file, and the path to the gate. **The panel reads from the live engine** (`VERSIONS`, `VIEWS`,
`LEDGER`, `TITLES`, `*_ORDER`) rather than from a description of it, so it cannot drift from what it
describes. The gate asserts it opens, states a release number, carries at least six rows, and closes.

### Section numbering (paper view only)

Sections render `§N · TITLE` with an `id="sec-N"` anchor and a `↑ contents` link back to `#sec-0`.
The ToC is itself a block (`paper.toc`), so it replays like everything else and cannot drift from
the sections it lists. The gate asserts every ToC link resolves to a real section.

### Every release MUST change at least one block in the `ledger` view

A release that only touches the `brief` or `paper` view leaves the ledger view byte-identical to its
predecessor, which fails both the distinctness assertion and `improvements(VMAX)` — correctly. This has
now fired three times (r40, r41, r42) and the fix is always the same: **find the ledger block the change
genuinely belongs in and revise it**, never weaken the check. Precedent: `corpus.iterations` at r40 and
r41; `frame.soi` at r42.

### Scope discipline: this document is the HOW, not the WHAT

Vision • 2525 (thirteen diagrams) states *what* a coordinated civilization needs. This document is the
*how* for four of those layers, partial on three, silent on five, and deliberately divergent on one
(diagram 12 runs on aligned capital; this funding model has no investors). **That map is published in
§0 of the paper view and summarised in `frame.soi`.** Any release that expands scope must update both,
and must not let the document imply coverage it does not have.

### Corrections

Corrections **supersede in-ledger** so prior errors stay visible and dated. Never tidy an error
away. Precedent: the language count corrected at r12; the 21.3× → 47.9× spread corrected at r35;
the false "earlier titles remain readable" claim corrected at r39.

---

## 6. Invariants

| # | Invariant | Enforced by |
|---|-----------|-------------|
| 1 | `replay(v, order)` is pure — same inputs, same bytes, no clock, no randomness | Gate: 33 identical runs per release |
| 2 | Every release produces a distinct state across the union of all views | Gate: distinctness over `LEDGER_ORDER ∪ BRIEF_ORDER` |
| 3 | Block count never decreases as `v` increases | Gate: monotone check |
| 4 | No ledger id is absent from every view's order | Gate: orphan check |
| 5 | View id sets are disjoint | Gate: overlap check |
| 6 | `compare(a,b)` is order-independent and can never report a removal | Gate: symmetry + zero-removal assertions |
| 7 | The masthead at v1 differs from the masthead at the latest release | Gate: masthead-replay assertions |
| 8 | Zero body horizontal scroll, zero clipped `.scroll` wrappers | Gate: 3 viewports × 2 themes × every release |
| 9 | Zero page errors in either view | Gate: `pageerror` capture |
| 10 | No credential, key, PIN or token appears anywhere in the file | Manual + repo scan before every push |
| 11 | **No release renders blank in any view** — every `view × release` state has content | Gate §2f: `VMAX × 3` states, 0 blank |
| 12 | **Comparison does not depend on the open view** | Gate §2f: `compare(1,VMAX)` identical across all three |
| 13 | **Every view carries a section index of ≥2 entries at every release** | Gate §2f: chip count per state |
| 14 | **The verification path reads no cache** — `replay`/`stateHash` are called with `fresh=true` | Gate §1: cache-poison test |
| 15 | **An optimisation may not change one published state hash** | Rebuild protocol: 147 hashes diffed before/after |

**Invariant 6 in detail.** `REMOVED` is a category that exists in the comparison output and
**always reads zero**. An append-only ledger with last-write-wins has no delete: a block can be
superseded, contradicted, or reduced to a line saying it was wrong, but it cannot be made never
to have existed. A comparison tool showing a column that can never fill would be quietly
misleading, so the document declares the empty category rather than hiding it.

### Caching: reading may be memoised, proving never may (r49 rebuild)

The engine caches replays and state hashes, and indexes `LEDGER` by block id. All three are **pure
derivations of the record** — none is part of it. Two rules keep that honest:

1. **The cache never changes an answer.** `stateHash` memoises the *identical* string r5 published; it is
   not reformulated into a faster hash. Every state hash ever displayed still reads the same value.
2. **`fresh = true` bypasses every cache, and the verification path must always pass it.** The in-page
   "replay every release 33 times" proof and the gate's determinism assertion both recompute from
   `LEDGER`. A memo that answers *"does replay give the same answer twice?"* proves only that the memo
   works — the proof would be circular, and a circular proof of determinism is worse than none, because
   it still prints PASS.

The gate holds this shut by **poisoning the caches and asserting the fresh path ignores them**. If a future
change routes verification through a memo, that assertion fails.

### Rebuild protocol — optimising without minting a release

An optimisation that touches only the machinery does **not** get a new version number, and **must not**
alter the record. The proof is mechanical:

1. Capture all `views × releases` state hashes from the committed build.
2. Optimise.
3. Diff. **Every hash must be identical.** If one moves, it was a content change wearing an
   optimisation's clothes — give it a release number, or revert it.

The r49 rebuild: **147/147 identical**; slider step **66.9 ms → 5.0 ms (13×)**; state-hash sweep 14×;
`VERSIONS` untouched at 49.

---

## 7. Gate

`scratchpad/lv-gate.mjs` — Playwright, headless Chromium at
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. **Never run `playwright install`.**

Sections:

1. **Engine correctness** — determinism (33 runs/release), monotone growth, no duplicate ids
   within a replay, cross-release distinctness over the union of views, orphan ids, view overlap.
2. **In-page proof** — clicks the document's own "replay every release 33 times" button and
   asserts it reports identical.
3. **2b · Compare** — row totals reconcile to block count, zero removals, order independence,
   highlight count matches the changed count, zero page errors.
4. **2c · Masthead replay** — title at v1 ≠ title at latest; v1 and v34 carry the founding
   title; the v35 rename takes effect; v36 carries its subtitle; v39 carries the swapped pair;
   `document.title` tracks the masthead.
5. **2d · Three views** — all three banners render, block counts are distinct and non-zero, each
   hash is deep-linkable in its own grammar, each view's state hash is deterministic, compare
   reports change in each view, the toggle cycles all three in order, all 13 ToC links resolve to
   real sections, and clicking a section link does not alter the version hash.

   **Structural checks must pin the view.** Sections 1, 2, 2b and 2c call `setView('ledger')` first,
   because paper and brief blocks only exist from r40/r41 and would make v1 and v2 render identically.
   **This pin is also what hid defect r49** — see §2f, which deliberately runs in every view instead.
6. **2f · Reachability (r49)** — sweeps `VMAX × 3` view/release states and asserts none is blank, each
   carries a section index, the fallback banner names both the substitution and the release the view
   begins at, `§` numbers are present in the paper index, the record index has no duplicate labels, a
   chip click actually scrolls without touching the version hash, and comparison is view-independent.

   `.chips` is a sanctioned horizontal-scroll container, like `.scroll` and `pre`, and is excluded from
   the overflow detector. The body-h-scroll assertion still covers it and is what protects the page.
7. **Responsive** — 375 / 768 / 1440 × light + dark × every release: zero body h-scroll, zero
   overflowing elements outside `.scroll`/`pre`, zero clipped wrappers at desktop width.

**Never hard-code the version ceiling.** Every loop reads `VMAX` from the page. Release 39 to 48 shipped
with the responsive sweep frozen at `v<=38` while printing "all versions" — ten releases went
unexercised at three viewports. If a loop bound is a literal, it is a latent lie.

### Layout budget

At desktop the reading column is **755 px**. A `.scroll` wrapper whose content exceeds that is
a gate failure at 1440 px. Practical limit: **four columns comfortably, five with short
headers.** Release 36 tripped this with a five-column table needing 782 px; the fix was
shortening headers, not widening the column.

---

## 8. File layout

| Path | Role |
|------|------|
| `docs/SOI_VISION2525_LIVING_DOCUMENT.html` | **Working file.** All edits land here. |
| `docs/VISION2525_LIVING_LEDGER_YYYY.MM.DD.html` | **Release vehicle.** Byte-identical copy, reissued every revision. This is the file the operator opens. |
| `docs/SOI_VISION2525_WHITEPAPER_ORIGINAL_549730b.html` | Frozen provenance — the static predecessor, superseded at r21 by verified concept diff. |
| `docs/VISION2525_HOUR_IS_THE_UNIT_2026.08.03.html` | Frozen provenance — the economics paper. |
| `scratchpad/lv-gate.mjs` | The gate. Must print `PASS` before any push. |

**Retired at r40:** `docs/VISION2525_OFF_SWITCH_BRIEF_2026.08.04.html`. Its content lives in the
ledger as the eight `brief.*` blocks; the standalone file remains in git history.

---

## 9. Locked content constraints

Carried forward unchanged. Do not re-open without an explicit operator directive.

- **웃 (HI)** — denominated in multiples of local minimum wage; higher multiples allowed; hard
  ceiling **9,999 per natural person per year**; goal is to help as many people as possible
  **reach** it; paid over **5 years, guaranteed**; livelihood and continuity, not lump-sum
  wealth. Mint is currency-free at `9,999 ÷ 2,080 = 4.807 웃/hour`; the local wage applies only
  at settlement and is stamped on the ledger entry at mint.
- **33 languages**, English among them. English-only until N ≥ 99, then the language pass.
- **7 + 3 = one ten-year standing.** Clock zero: cumulative Seed Token proceeds reaching
  $1,000,000.
- **Tri-council** on ◬ A.I. / ♡ S.I. / 웃 H.I.
- **Money receives; it never decides.** No contribution buys governance weight at any price.
- **$100bn** founding treasury · **$1,000tn** created, not collected · **1bn people × 9 years
  of runway by 2525**.
- **Austin** = ground zero. **Thesis:** we cannot master what we are not aware of.

---

## 10. Scope

Analysis and architecture only. **Not legal, tax or investment advice.** No security, token or
investment is offered, solicited or marketed anywhere in the document. Every financial figure is
illustrative and exists to demonstrate a formula, never to project a result. Every legal form
and jurisdiction named requires qualified local counsel.

Every claim about the running system cites a real `file:line` and is marked
**IMPLEMENTED / SPEC-ONLY / PROPOSED / LIVE**.
