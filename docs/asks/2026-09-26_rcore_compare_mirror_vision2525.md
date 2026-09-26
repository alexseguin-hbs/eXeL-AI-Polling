# R-CORE compare panel → mirror the Vision-2525 "WHAT CHANGED" compare EXACTLY (operator 2026-09-26)

## Verbatim ask
> heres what we have implemented vs what we have in image 2 for compare feature. Mirror Vision-2525
> implementation exactly

Image 1 = our current R-CORE Version-History panel (SoI-2525). Image 2 = the Vision-2525 living-document
"WHAT CHANGED" compare. Image 3 = the living-document chrome (the ⇄ compare toggle).

## Target (image 2) vs current (image 1) — the gaps to close
The R-CORE panel (`frontend/components/2525-core/rcore-revision-panel.tsx`, using
`frontend/lib/2525-core/revisions.ts` `compareRevisions`) must MIRROR the Vision-2525 compare exactly:
1. **Before / After SCRUBBER SLIDERS** (not plain dropdowns): a range slider over the revision index with
   revision TICK MARKS colored by kind/impact, `‹` `›` steppers, and the label "Before · v.NN rX · <TITLE>" /
   "After · v.NN rX · <TITLE> (CURRENT)". (Living doc: `renderCompare()` ~19349, `.cmp .cmp-ctl` CSS ~455-475.)
2. **Preset buttons**: "vs previous" and "v1 vs latest" (living doc `#cmpPrev`, `#cmpFirst`).
3. **Stat chips** matching the labels exactly: `added N` · `revised N` · `carried unchanged N` · `N releases
   crossed` (we currently say "carried", not "carried unchanged").
4. **Summary line**: "N changes across M sections · highest impact: <top fields> · removed 0 — append-only".
5. **KEY IMPROVEMENTS · rX → rY** — a NUMBERED list (01, 02, …) of the crossed revisions' improvement titles,
   each with a per-item impact chip (L1–L5). (Living doc: `renderKeyImp()` ~19335, `improvements(v)` ~18293.)
6. Keep the deterministic before/after word-diff we already have (that maps to the living doc's Exact-Diff).
7. Header stays "⊕ R-CORE · Version History"; keep icon→wordmark→panel, bottom-of-page, transparent PNGs,
   theme-agnostic `accent`, mobile-first 390px. Reuse `lib/version-diff.ts` + `compareRevisions` — extend,
   never fork (R-CORE reuse law; COMPARE_UX_SPEC.md).

## Canonical source to mirror
`docs/COMPARE_UX_SPEC.md` (the consolidated R-CORE compare spec) + the living-document implementation it maps:
`docs/SOI_VISION2525_LIVING_DOCUMENT.html` — `compare(a,b)` ~18269, `improvements(v)` ~18293,
`renderKeyImp()` ~19335, `renderCompare()` ~19349, CSS `.cmp/.cmp-ctl/.cmp-sum/.k-add/.k-rev/.k-rem/.k-car`
~455-475. The impact ladder (L1 editorial · L2 clarification · L3 functional · L4 governance/economic ·
L5 constitutional) and category rules already live in `revisions.ts` (impactOfRevision / tagsOf) and match
the spec — reuse them; the R-CORE model is per-REVISION (each entry = one improvement), so "changes across
M sections" adapts to the crossed revisions across their distinct categories, and KEY IMPROVEMENTS = the
crossed revisions' titles each with impactOfRevision.

## Data to add to compareRevisions (revisions.ts) — small, deterministic
- Per-crossed-revision impact (expose `impactOfRevision` or return `crossed` with an `impact` on each).
- `sectionsAffected` (distinct categories among crossed) + a "top highest-impact areas" list (the categories
  of the L4/L5 crossed revisions) for the summary line.
- `changes` = crossed.length; the summary reads "N changes across M sections · highest impact: … · removed 0
  — append-only" (removed is always 0 — the record is append-only, which the spec asserts).

## 2026-09-26 ADDENDUM (operator) — "include html download / and all features for Vision-2525 / once parity is reached on both style, make all revisions the same format as vision-2525"
- **HTML download**: add the Vision-2525 ↓ download to the R-CORE panel — a self-contained, single-file HTML
  of the surface's revision history / current state (the same affordance image 3 shows: the ↓ button by the
  version badge). Mirror the living document's download (it serialises a standalone HTML). For the R-CORE
  panel, download a self-contained HTML of the full ledger + the current compare (rev list w/ date · kind ·
  what-changed · D# · commit sha, plus the before/after diff), openable offline, dark-ground, no JS required
  to read. Reuse the living doc's download builder pattern where possible.
- **ALL Vision-2525 features**: mirror the whole compare/reader feature set the living doc exposes for
  revisions, not only the listed gaps — per COMPARE_UX_SPEC.md's components: the modes (Overview · Meaning
  (AI, labeled) · Exact Diff · Evolution — default Overview), the Change-Intelligence timeline/scrubber, the
  diff strip of changed blocks with impact badges, the change cards (Before → After → Why → Impact → Risk
  reduced → Evidence → Human Authority), the version/"latest" badge, and the download. Scope to what the
  R-CORE per-revision model supports; where a feature needs data we don't have, adapt faithfully (state it),
  never fake it. AI/Meaning mode must work with AI disabled (deterministic default), per the spec.
- **Uniform format across every surface**: the R-CORE panel is ONE shared component
  (rcore-revision-panel.tsx) mounted on SoI-2525 · Security · Settings · easter-egg · Architect · Celestial ·
  Drone, so reaching Vision-2525 parity in it makes ALL surfaces' revision histories render in the identical
  Vision-2525 format automatically. Confirm each surface's history renders in the new format (screenshot a
  couple). "Make all revisions the same format as Vision-2525" = this shared-component parity.

## BLUEPRINT (read-only mapping agent, 2026-09-26) — the exact mirror
Live line refs in docs/SOI_VISION2525_LIVING_DOCUMENT.html: renderCompare 21735-21990 · renderKeyImp 21512 ·
compare 20345 · improvements 20384 · diffImpact/Category/Title/diffResult 20396-20450 · ticks/stepper machinery
21536-21595 · CSS .cmp/.cmp-sum/.k-* 474-489, .imp.l1..l5 492-496, .cmp-hi 497-498, .cmp-top 499-505,
.cmp-sl 643-646, .sl-ticks 656-659, .sl-step 668-672.

A) STRUCTURE (verbatim), top→bottom, built as one HTML string into `#cmp`:
  1. slim pair bar `.cmp-bar` (shown when scrolled): `⇄ ` vLbl(lo) ` → ` vLbl(hi) [` (current)`] + `<button>Change</button>`.
  2. pick block `.cmp-pick`: `<h4>⇄ What changed — {vLbl(lo)} → {vLbl(hi)} [ (current)]</h4>`; then TWO scrubbers `.cmp-sl`:
     `<label>Before · <span id=cmpALbl>{cmpLbl}</span></label>` + `<div class=sl-row>‹-stepper <span class=slwrap><input type=range id=cmpA min=1 max=VMAX step=1 aria-label="Before release"><span class="sl-ticks tap"></span></span> ›-stepper</div>` and the same for After (cmpB, aria "After release"). cmpLbl = `v.NN rX · <code/title>` → ours: `Before · r{rev} · {title}`.
     presets `.cmp-ctl`: `<button id=cmpPrev>vs previous</button><button id=cmpFirst>v1 vs latest</button>` (+ optional `this view vs current` — OMIT for us, no active-rev concept).
  3. stat chips `.cmp-sum` (order, verbatim): `added <b>N</b>`(if>0) · `revised <b>N</b>`(if>0) · `removed <b>N</b>`(if>0) · `carried unchanged <b>N</b>`(always) · `{N} release[s] crossed`. add/rev/rem double as filters.
  4. summary `.cmp-hi`: `{N} change[s] across <b>{M}</b> section[s]` [` · highest impact: {id,id joined ", "}` if any L4/L5] ` · removed {R}` [` — append-only` if R===0]. Example: `6 changes across 3 sections · highest impact: unit.ceiling, gov.wall · removed 0 — append-only`.
  5. KEY IMPROVEMENTS `<ul class=cmp-top><h5>Key improvements · {relLabel(lo)} → {relLabel(hi)}</h5>` then per top-item `<li class=xref data-id=..><span class=rk>NN</span><span class=ti>{title}</span><span class="imp l#" title={category}>L#</span></li>` — NN zero-padded 01..; top-7 sorted by impact desc then version desc.
  STEPPERS move to the prev/next MEASURED-CHANGE keyframe (not ±1), disabled at ends; aria "Step back/forward to the previous/next changed release". TICKS: one `<i style=left:{pct}%>` per keyframe, class `hi` (gold) when top impact ≥ L4; tap a rail → snap to nearest keyframe. GUARDRAIL: Before strictly < After (slA.max=VMAX-1, slB.min=cmpA+1); `input`=re-label live, `change`=recompute; picking a pair never navigates.

B) MAP to our per-REVISION model (revisions.ts:167 compareRevisions over the chronological `revs` array):
  slider domain min=0 max=n-1 over revision INDEX; label from revs[i]; window = compareRevisions(revs[ia].rev, revs[ib].rev). presets: vs previous = (n-2 → n-1) [already the default 64-65]; v1 vs latest = (revs[0] → revs[n-1], oldest→current). N changes = crossed.length. M sections = distinct categories = impactTags.length. highest impact = distinct categories of crossed whose impactOfRevision is L4/L5, cap 4 (omit clause if none). removed = 0, hardcode "— append-only". KEY IMPROVEMENTS = crossed sorted by IMPACT_RANK[impactOfRevision] desc then newest-first, top 7; each item title = r.title, chip = impactOfRevision(r) (L1..L5), chip title = its category.

C) ADD to RCoreCompare (revisions.ts:137-160 + return 198-213) — pure/deterministic, no existing field changed (gate stays green; test asserts JSON.stringify determinism 51-52):
  changes:number = crossed.length · sectionsAffected:string[] = impactTags (keep identical) · perCrossed:{rev,title,kind,impact,category}[] = crossed.map(r → {rev,title,kind, impact:impactOfRevision(r), category:tagsOf([r])[0]??"other"}) · top:perCrossed sorted (IMPACT_RANK desc, then descending position in crossed) .slice(0,7) · highestImpactAreas:string[] = distinct category of perCrossed items with impact L4/L5, cap 4 · (optional removed:0, categories:Record<string,number>).

D) DATA-* — PRESERVE (asserted by rcore-revisions.test.mjs): `data-rcore-panel`; the source must keep `compareRevisions(` and lexicon keys `rcore.version_history` + `rcore.what_changed` (t("rcore.version_history") title, t("rcore.what_changed") section). Keep data-rcore-close/-impact/-list. If the two `<select>`s become scrubbers, MOVE the testids `rcore-select-a`/`-b` onto the range inputs. NEW hooks: `data-rcore-scrub=a|b`, `data-rcore-step=a-prev|a-next|b-prev|b-next`, `data-rcore-ticks=a|b`, `data-rcore-preset=prev|first`, `data-rcore-stat=added|revised|removed|carried|releases`, `data-rcore-summary`, `data-rcore-keyimp` + `data-rcore-keyimp-item data-impact=L#`, `data-rcore-download`.

E) THEMING (spec 78-81 → keep our accent cyan `#22d3ee`): impact chip L5=purple(#a78bfa/--hi) · L4=gold(#f0b429/--si) · L3=cyan(accent/--ai) · L2/L1=gray(#8fa3a6). stat chips: added=green #34d399 · revised=gold #f0b429 · removed=red #fb7185 · carried/releases=gray. word-diff del=crimson #fb7185 / ins=emerald #34d399 (already ours). Never paint whole paragraphs; every colored state carries a text label.

F) HTML DOWNLOAD (operator addendum): mirror the living-doc ↓ — a `data-rcore-download` button (near the header/version badge) that builds a SELF-CONTAINED single-file HTML of this surface's full ledger (rev · date · kind · title · D# · commit) + the current A→B compare (stat line, summary, KEY IMPROVEMENTS, before/after diff), dark-ground, inline CSS, no JS needed to read; filename e.g. `R-CORE_{surface}_r{VMAX}_{date}.html`. Reuse the living doc's download-builder pattern (find its ↓ handler in the same file); Blob + a[download].

## BLUEPRINT ADDENDUM 2 (mapping agent) — download reality + the full feature set
DOWNLOAD: Vision has NO client-side serializer/Blob — the ↓ is a static, worker-served prebuilt one-file copy
+ HTML5 `download`. Verbatim (living doc line 1181): `<a id="bDL" href="…/whitepaper/SOI_VISION2525_v.19_LIVING_DOCUMENT.html"
download="SOI_VISION2525_v.19_LIVING_DOCUMENT.html" title="Download this document — HTML, one self-contained file"
aria-label="Download this document"><svg …path d="M12 3v12M7 10l5 5 5-5M5 21h14"…></a>`. Self-contained: no
external fetch/eval, absolute internal links + noopener so it reads offline.
  → MIRROR in R-CORE (the app has no per-surface prebuilt artifact): FALLBACK path (noted divergence) — a
  `data-rcore-download` `<a download>` in the panel header, built at click time via
  `URL.createObjectURL(new Blob([html],{type:"text/html"}))`, `download="R-CORE_{surface}_r{VMAX}_{date}.html"`,
  DETERMINISTIC payload (no clock/random inside), dark-ground, inline CSS, no JS to read; content = the full
  ledger (rev·date·kind·title·D#·commit) + the current A→B compare (stat line, summary, KEY IMPROVEMENTS,
  before/after diff). Reuse the same title/aria/glyph (path `M12 3v12M7 10l5 5 5-5M5 21h14`).

MODES REALITY: the spec's four modes (Overview·Meaning(AI)·Exact-Diff·Evolution) are NOT built in Vision either
— only Overview (summary line + stat chips + KEY IMPROVEMENTS, already top of panel) and Exact-Diff
(Unified/Side-by-side passages + Details table) exist. So mirror those two now; leave Meaning(AI) + Evolution
as LABELLED FUTURE slices (don't fake them).

FULL FEATURE SET to mirror (verbatim ids/labels from the living doc):
  1. **Unified ↔ Side-by-side toggle** over the before/after diff: `<span class="cmp-mode" role="group"><button id="cmpVU">Unified</button><button id="cmpVS">Side by side</button></span>` (our panel is side-only today — ADD Unified + the toggle).
  2. **Change navigator**: `<span class="cmp-nav">‹ Previous change · – / – · Next change ›</span>` when multiple passages.
  3. **Stat chips as FILTERS**: added/revised/removed chips filter the list (aria-pressed + `.on`; a `Filtered: {kind}` chip; self-clears on re-pick).
  4. **Show-all**: `Show all {N} changed sections`.
  5. **Details table (collapsed)**: `<details><summary>Details</summary>` Revision · Kind · Impact · Date · recorded reason.
  6. **Version badge**: `<span class="tag">{stamp} · {rev===current ? 'latest release' : 'historical release'}</span>` — per-revision, driven by rev===history.current.
  7. Keep the slim pair bar + "Change" edit affordance, Escape/close.
  autoCmp was REMOVED in Vision (r250) — deck nav just navigates; compare opens only via the toggle. This
  CONTRADICTS spec R2 "auto compare-to-current" — FLAG to operator; our panel opens compare explicitly, which
  matches current Vision behaviour, so keep as-is.

## Execute (QUIET window — after the DRS visionary passes finish + the drone r.153 tab fix; it edits the
## compiled panel, which collides with the visionary tsc/test:ci)
Rework rcore-revision-panel.tsx to the above; extend compareRevisions; keep every existing data-* hook
(data-rcore-panel/-list/-impact/-select-a/-select-b/-close) so tests/rcore-revisions.test.mjs stays green,
add data hooks for the new scrubbers/presets/key-improvements. tsc + full test:ci + next build green;
390px screenshot vs image 2; commit + push both refs; Verify Live.
