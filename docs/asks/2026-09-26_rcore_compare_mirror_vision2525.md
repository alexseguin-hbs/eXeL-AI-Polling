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

## Execute (QUIET window — after the DRS visionary passes finish + the drone r.153 tab fix; it edits the
## compiled panel, which collides with the visionary tsc/test:ci)
Rework rcore-revision-panel.tsx to the above; extend compareRevisions; keep every existing data-* hook
(data-rcore-panel/-list/-impact/-select-a/-select-b/-close) so tests/rcore-revisions.test.mjs stays green,
add data hooks for the new scrubbers/presets/key-improvements. tsc + full test:ci + next build green;
390px screenshot vs image 2; commit + push both refs; Verify Live.
