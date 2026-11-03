# Architect-2525 Simulate/Eco R1–R4 · AsM fleet review (2026-11-03)

Persisted record of the 6-lens Ascended-Masters review + MoT verify/synthesis run (Workflow wf_f123d46a-25b, 7
agents, 0 errors, ~985k subagent tokens) over the shipped R1–R4 work at SHA 168f5de83.

## MoT verdict: GRADE A− · SHIP · no P0 · no P1 · NO product-truth invariant violated

Verified clean, every invariant held:
- **Cost moved? No.** $240,000 (Cube, derived) · $67,000 (Tiny, catalog) · $231,500 (Eco-Sphere, ASSUMED) are pinned
  (architect-one-cost-truth 16/0); no on-screen or PDF headline is a hardcoded literal — all are live function reads;
  the eco geometry module imports nothing and `areaFactor` reads `areaFt2`, not the module; the floor-derived
  build-instructions dome is untouched.
- **Portrait PDF changed? No** (architect-sim-print 40/0). **✦ shifts the score? No** — fixed-width slot + tabular-nums
  in BOTH the PDF (MatrixScore) and the on-screen matrix.
- **Machine words on the human path? No** (banned set clean; "tessellation" was a clarity nit, now reworded).
- **Horizontal scroll at 390px? No** — matrix scrolls inside its own track; the ⬇ PDF chip is one line.
- **A01 over 25 MiB? No** — 18.64 MiB (> 3, < 25), served in out/, reachable.

## Lens results
- **Thoth (product-truth & cost):** CLEAN. One-truth-per-home across card + ratings + compare + PDF.
- **Enlil (correctness):** CLEAN. Grids, MatrixScore, hex derivation, lightbox all sound; no runtime defect.
- **Christo (mobile/UX 390px):** structural phone-safety holds; one P2 — touch targets on the *pre-existing* clustered
  toggles (Compare-as chips, labor-mode) are ~15px with 4px gaps, and a mis-tap on labor-mode zeroes markup.
- **Sofia (voice & copy):** one P2 (voice gate didn't cover the new label module) + a "tessellation" nit.
- **Aset (accessibility):** two P2 — the A01 modal had no Escape-to-close and no focus management; one WCAG-2.5.3 nit
  (visible "(A01)" missing from the aria-label).
- **Thor (deploy & asset):** CLEAN on the deploy-break question; one P2 (the 18.6 MiB image had no loading affordance)
  + nits (no Git LFS, no explicit long-cache header on the PNG).

## Applied in R4c (this revision — the in-scope, non-UI-altering fixes)
- A01 modal: Escape-to-close + focus moves into the dialog on open and returns to the trigger on close (a11y P2).
- A01 image: `decoding="async"` + a "Loading concept…" affordance until the 18.6 MiB render arrives (mobile P2).
- Voice gate now covers `lib/architect-eco-geometry.ts` (its labels ARE human copy) — closes the gate-coverage P2.
- "tessellation" reworded to "how they tile across the dome"; the trigger aria-label now contains its visible "(A01)".
- Gate architect-eco-a01 strengthened 17→22 to lock the Escape/focus/decoding/loading/aria fixes.

## QUEUED (not applied — need an HI decision or are infra, per the deploy rule / Release Process #6)
- **Touch targets on the clustered toggles (P2):** enlarging them changes UI the operator did not ask to change
  (Release Process #6 — ASK first). Recommended: `min-h-[32px]` + `gap-1.5` on the Compare-as + labor-mode rows only
  (does not conflict with the "one line" PDF-chip directive). Awaiting HI go-ahead.
- **Git LFS for public/architect-2525/*.png (nit):** infra — each A01 re-render adds ~18 MiB to history forever.
- **Long-cache header for the A01 PNG (nit):** public/_headers is gate-held (cache-headers); a targeted immutable rule
  for /architect-2525/*.png is a safe perf win, queued to avoid touching the gated file mid-revision.
- **Matrix caption precision (borderline):** "Only the Cube's cost comes from the full cost calculator; the others are
  rough estimates" — the Eco cost does flow through the engine (area-scaled, ASSUMED); only the Tiny is truly outside.
  Pre-existing copy; optional reword.
