# Sensor Fusion 2525 — 19 rounds of SSSES · SPIRAL · AsM reviews, as notes for Grok (2026.10.04_17.16..44 CST)

> Operator, verbatim (2026.10.04): "perfect; once done with Drone-2525
> do BELOW (CAPTURING botes in new MD FOR GROk review and exeution).
> RUN SSSES, SPIRAL, and ASM reviews in 19 rounds of updates executing enhancements over the next 6 hours for Sensor Fusion 2525"

**When:** after the Drone-2525 19 rounds finish.

**Who builds:** Grok. Claude Code reviews and writes the notes; it does not edit Sensor Fusion code (operator: "you are working drone-2525
while Grok works Sensor Fusion").

**Each round:**
1. Twelve reviewer lenses in three pods review the live Sensor Fusion page and code as they stand. Each gives SSSES 0–100 per pillar and a
   SPIRAL forward/backward check. The forward chain runs capture → labels (L1/L2, XML, Light Codex) → training JSON → model folder → page →
   alerts setting.
2. One note per round is written for Grok: `rNN_<CST stamp>_for_grok.md` in this folder.
   - Methods, files and tests only, no code, ranked.
   - Fixes Grok already shipped are checked first, so a round never repeats a landed fix.
3. Each note is committed and pushed. Grok builds from the newest note, one revision at a time. The next round reviews what is then live.

**Records:** `SCORES.md` in this folder (SSSES and SPIRAL per round). Six hours is the ceiling.

## Addendum — who builds changed (operator 2026-10-04 evening CST)

Grok hit his weekly limit (resets Wednesday 2026-10-07 02:05). The operator approved Claude Code to edit Sensor Fusion code and run
these 19 rounds itself, alternating one Sensor Fusion revision with one Drone-2525 revision, each waiting for Verify Live
(ask: `docs/asks/2026.10.04_18.57..21_sensor_fusion_claude_completes_19_rounds_for_grok.md`, Addendum 1).

So each round note `rNN_<CST stamp>_for_grok.md` now records what was **built and shipped** (files, tests, the SF ledger revision, the
Verify Live run) plus what is left for Grok — not only methods. Round 0 (SF ledger rev 41) fixed `test:sf-r4a`, which had blocked
every deploy since 2f58089. The closing note `HANDOFF_for_grok.md` in this folder is what Grok reads first on Oct 7.
