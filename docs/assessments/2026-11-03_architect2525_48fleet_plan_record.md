# Architect-2525 · 48-Agent Fleet plan recreation + readiness (2026-11-03)

Persisted record of the operator-commanded 48-agent fleet run that recreated the Simulate + Eco-Sphere plan of
attack, and the HI-approved plan it produced. The operator paused real-time approvals ("I can't approve in real
time all your tedious access requests") and commanded: *"Master of Thought — activate full 48-agent fleet now to
recreate plan… Report only fleet readiness confirmation and any residual gaps."* The plan was then approved via
plan mode and is executed autonomously, one revision at a time, with an FX artifact served at each gate.

## Fleet composition (as commanded)
12 Master of Thought · 12 Ascended Masters (3 pods × 4) · 36 specialists (3 per AsM: worker A + worker B run
independently → worker C = Voting & Summarizer → AsM packages the pod) → 12 MoT synthesize. Doctrine:
"HUMANITY DECIDES · TECHNOLOGY ASSISTS." Run was **read-only** (read-only access approved), 48/48 agents, 0 errors.

## The seven load-bearing corrections the fleet made to the earlier draft
1. **Landscape fix is a RIGHT RAIL, not a mockup cap.** Per-design page height = header + max(mockup,
   details-column ≈500–530 px) + full-width 13-checks band (≈145 px) + foot. The details column dominates →
   capping the mockup saves ≈0 vertical height (the earlier mockup-cap attempt was a red herring). FIX = a
   landscape-only CSS grid on the per-home page that moves the 13-checks into a ≈230 px right rail (reclaims the
   ≈145 px band). Realistic AFTER ≈600–640 px (slack ≈40–80 px under the 720 px landscape printable). Pixel proof
   is load-bearing; rail/font tuning likely.
2. **Working tree was DIRTY/UNPERSISTED** (M simulate-options.tsx, M simulate-print.tsx, M scripts/sim-pdf-shot.mjs)
   — the portrait one-page fix + the compact ⬇ PDF button were uncommitted. PERSIST FIRST (container-wipe risk).
3. **Branch reality:** remote has `main` + `claude/debug-wsl-issues-yYdPP` only — NO `dev` branch. "push dev+main"
   → push `main` + the working branch.
4. **Eco-Sphere $231,500 is NOT pinned anywhere** (grep of tests/ + lib/ empty) — a cost-firewall gate is needed (R4).
5. **`test:rcore-code-gen` was RED** and the shipped Download-as-PDF deck had no ledger row — reconcile in R0.
6. **A01 PNG is a real binary dependency** — `public/architect-2525/eco-sphere-hex-roof-a01.png` did not exist; the
   operator's latest A01 master is persisted (see docs/asks/2026.11.03_architect2525_eco_geometry_and_a01.md) and the
   web asset is derived from it in R3.
7. **Sandbox cannot verify LIVE** (proxy 403 to the worker) and **`sf-layout-smoke` (SensorFusion) stays
   pre-existing RED** but does NOT block the Cloudflare promote — LIVE is proven only by Verify Live CI + the
   operator's phone stamp.

## Approved plan (R0 → R4) — the sequence being executed
- **R0 · PERSIST + RECONCILE (commit alone).** Persist the geometry specs + A01 master + this fleet record;
  backfill the missing ledger rows (Tiny · IBC · PDF deck); regenerate the R-CORE code record (fix RED
  test:rcore-code-gen). Confirm push targets (main + claude/debug-wsl-issues-yYdPP).
- **R1 · Simulate PDF deck.** Ship pending (portrait one-page + compact ⬇ PDF Vision glyph) + landscape one-page via
  the right-rail grid + 13-checks ✦ fixed-width marker slot + tabular-nums alignment (PDF + on-screen). Gate asserts
  + pixel proof (≤680 px landscape, ≤960 px portrait). FX.
- **R2 · Eco-Sphere feet geometry.** New pure module lib/architect-eco-geometry.ts — DERIVE (never type) the FLOOR
  (900/7) + the ROOF/DOME (40 ft / 10.09°, SEPARATE); two labelled REFERENCE blocks in the Eco-Sphere See-details;
  gate. Floor-derived build-instructions dome stays firewalled.
- **R3 · A01 image + eco-only expand link.** Downscale the A01 master to public/architect-2525/, add the eco-only
  "Hex roof panel concept (A01)" expand link (Experiences lightbox idiom, createPortal); gate (source-scan +
  fs.existsSync).
- **R4 · Hardening + final QA.** Pin Eco $231,500 (cost firewall); 390 px mobile gate; RED-first print-fit clip
  gate; ledger records; SSSES + AsM-simulate + full Playwright + spiral-test all of Architect-2525. FX synthesis.

## Product-truth held throughout
No cost moves (Cube $240,000 · Tiny $67,000 · Eco-Sphere $231,500). All new geometry is REFERENCE / 1st-pass
engineering concept / validation-required. Reuse approved-HI implementations (the Vision-2525 download glyph, the
SoI window.print() idiom, the Experiences lightbox). One revision at a time; never outpace the deploy; FX per chunk.
