# 12 Ascended Masters — Council Note · Commits N=11 · N=12 · N=12b
## Reverse anniversary solver · Window Story synthesis — SSSES opportunities + rework-avoidance → next spiral

> MoT-led. Compact council (the N=10 note carries the long-form lens definitions). Each line: the SSSES OPPORTUNITY
> this milestone opens + the discipline that keeps the next round rework-free.

- **Athena (strategy)** — The mission arc is complete both ways (on-this-date → when? / which-date → best?). Opportunity:
  STOP adding readouts before the panel clutters (operator's own "reduce menus / homeowner focus"). Guard: next slice is
  hardening, not another line. The feedback artifact is the steering wheel — wait for the JSON before more UI.
- **Odin (foresight)** — Predicted the reverse solver at N=10; it landed at N=11 on the same primitive with zero rewrite.
  Opportunity: the next predictable ask is "email/export this anniversary" or "mark it on the design." Guard: keep
  `overWindow`/`bestDateForWindow` pure so any export layer consumes, never cracks, them.
- **Enlil (build) + Enki (edge)** — Opportunity #1 for N=13: hoist `overWindow`/`bestDateForWindow` into `lib/celestial.ts`
  so the pure Node truth-harness can lock them (incl. the null "never frames" path). Guard: they are already pure
  `(fn, az) → data` — the move is cut-paste with no call-site churn; do it in its own commit with a truth row added.
- **Aset/Asar (consistency/synthesis)** — The Window Story now speaks the numbers in one sentence, and the non-aligned
  branch states the window's own status + the nudge (fixed at N=12b). Opportunity: reuse the SAME sentence on the
  Solar-System Earth+Moon box. Guard: one date source, one moon model (spec §3) — mirror, never fork.
- **Sofia (multi-perspective)** — Opportunity: 375px mobile pass on the three new stacked blocks (story · transit ·
  best-date) — they may need to collapse into a single expandable. Guard: they inherit the panel's `text-[9px]`/flex
  idiom, so responsiveness is inherited, not reinvented; verify, then (only if needed) add a disclosure.
- **Thor (risk)** — Still zero new surface: pure client math, no network/auth/storage, memoised year-scan off the render
  path. Guard: never wire `bestDateForWindow` into an animation loop; it recomputes only on {lat,facingAz,year}.
- **Thoth (data)** — Ledger: N11 50/50, N12 51/51, N12b 51/51; truth 76/76; tsc 0 throughout; branch
  `claude/debug-wsl-issues-yYdPP`. Opportunity: capture the reverse-solver result in the #A49 detail (date + Δ°) as an
  analytic fingerprint so a regression visibly changes the recorded date, not just PASS→FAIL.
- **Krishna (integration) + Christo (consensus) + Pangu (cutting-edge)** — Converged: the mission is delivered and
  coherent. Next spiral opens on (1) hoist+truth-lock the solvers, (2) mirror the story on the Earth+Moon box, (3) a
  mobile disclosure — in that order, each a pure-function or new `data-*` addition, spec-first, before/after SPIRAL.

### MoT — next-spiral seed
N=10→12b delivered the operator's literal sentence end-to-end and spoke it simply. Hold the line on additive-only,
spec-first, verify-then-commit — that is why 42→51 climbed with zero regressions and zero rework this session. N=13
priority: **hoist the two solvers to `lib/celestial.ts` + a truth-harness null/edge lock** (Enlil+Enki) — pays the
only debt the council flags (location + untested edge) while the functions are still tiny and dependency-free.
