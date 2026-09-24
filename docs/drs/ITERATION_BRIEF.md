# PRJ-34 · CrisisCommand Future State — the iteration brief (read this whole file before each round)

You are one round of the 99-iteration programme the operator asked for on 2026-09-24 (`docs/asks/2026-09-24_prj34_99_iterations_overnight.md`).
One round = twelve reviewer lenses read the deck → each writes a 111-word summary → an AAR names ≤9 concrete edits → the edits are applied to
S1–S18 → the gates run → the round is committed and pushed. The next round reads what this round shipped. Nothing is asserted that the record
does not carry; nothing is edited that the AAR did not name.

## What the deck is
The Innovation Pod deck for PRJ-34 (`frontend/lib/innovation-slide-seed-drs.ts`, S1–S18, `hi` = the slide, `ai` = the speaker note and a
superset of `hi`). The founder of CrisisCommand.ai (https://www.crisiscommand.ai/products) will read it as a PDF, and so will investors,
future customers, innovators who want to add functionality, business owners, system thinkers without analytics know-how and execution geniuses.
It must read in the year 2525 as easily as today, speak to R-CORE, Vision 2525 and the hearts, minds and spirits of humanity, and be easy to
update as AI tools improve. The masters it derives from: `docs/drs/drs.v00.00.json` (`futureState`, `platform`, `financialModel`, `decisions`,
`asmReview`, `iterations`), the v0.9 sources under `docs/drs/sources/PRJ-34_drop/canonical/`, `docs/VISION_2525.md`, `docs/MODE_R-CORE_SPEC.md`,
`docs/R_CORE_SIMULATION_ARCHITECTURE.md`, `SSSES.md`, and the defence outcomes know-how already in this repo (Drone-2525 / Security-2525:
named-human-before-any-machine-action, the one-ninth qualification gate, replay, the decision record, the ladder pilot → replay → qualify →
certify → adopt → educate → expand).

## Laws that never move (a round that breaks one is reverted, not committed)
1. ONE platform: CrisisCommand.ai carries every aspect of the benchmark's critical-event job (Everbridge 360 AI / Bridge) inside the governed
   leadership record, absorbed by qualification — 2027 reachable · 2030 native, function by function, one-ninth gate, alerting last and certified
   · 2525 humanity's shared crisis memory. Never "layer above, replace none". Rave (EDU) and PagerDuty (TECH) are comparators and inbound feeds.
2. Humanity decides. Technology assists. Trust must be proven. Every outbound action carries a named human approver. No feature that ships today
   is presented as new. No claim of technical-restoration minutes.
3. Money is DECLARED (IA): every dollar on the deck derives from `financialModel` (single-customer baseline · ramp · ten-year), is labelled IA or
   declared, and is never presented as buyer-validated. The Pod's linked fields (S1 chart · S2 / S3 profile · S8 charts · S10 grid) derive from the
   row's digital inputs (`nreK`, `fullRev10yM`, `REVPLAN_QTY`, `valueDrivers`, BU seed) — change the inputs, never a printed number.
4. One master: `PROJECT_INTEL["PRJ-34"].valueProp` === `futureState.master.statement`; the three `segmentValueProps[i].prop` === the three
   `futureState.segments[i].statement`. Edit both carriers or neither. The title stays "Project 34 — CrisisCommand Future State" (≤40 ch).
5. Provenance footer on every slide: `… · final authority: De-Risking Strategies / Human Intelligence · v1.0 · rev 0.NNN` — bump the rev in the
   seed's `PROV` constant and the row's `provenance` every round.
6. Slide density: a cell that overflows its panel is a defect (S1's top row — value prop + market table — and S9 / S14 have overflowed; keep
   `hi` cells short, move detail to `ai`). Every `hi`/`ai` cell keeps its field id and shape (string / string[] / string[][] with the same column
   count); `ai` is never shorter than `hi`; no cell is emptied.
7. Append, never edit, the record: `revisions[]`, `decisions[]` (D-numbers) and `iterations[]` in the master only grow; a changed decision is a
   new D that names the one it supersedes.

## The round, step by step
1. Read: this file · the seed · the master's `platform`, `financialModel`, `decisions`, the last three `iterations[]` entries · the previous
   round's file `docs/drs/iterations/0.<N-1>.md` · the two asks of 2026-09-24. Skim the doctrine files only for the sections you cite.
2. Write `docs/drs/iterations/0.<N>.md` with exactly these H2 sections: `## Twelve lenses` (Aset · Asar · Athena · Christo · Enki · Enlil · Krishna ·
   Odin · Pangu · Sofia · Thoth · Thor — for each: five SSSES numbers 0–100 on the BUSINESS CASE and a 111-word summary addressed to the founder,
   investors and future customers, in that lens's voice, counted) · `## Spiral test` (one line per audience the operator named: what they now
   understand from S1 alone, what they still cannot) · `## AAR` (per slide S1–S18: keep | fix | cut with one reason; then the ≤9 edits you apply this
   round, each naming slide · field · what changed · why; then decisions taken, each as a new D-number) · `## Gates` (the exact lines the door printed).
3. Apply the edits to the seed (and the master / row where a law says both), with exact-string anchors — a miss refuses. Append the iteration entry
   (`revision`, `n`, `date`, `author`, `ssesMeans`, `edits`, `decisions`) and, if any, the decisions to the master; append `revisions[]` 0.<N>
   (kind release, commit PENDING) and set `project.revision` to 0.<N> (the renderer refuses a master whose project.revision is not the last entry) and fill the previous entry's PENDING commit with the sha the door printed last round (`git log -1 --format=%h --
   docs/drs/iterations/0.<N-1>.md`). Bump `PROV` / `provenance` to `rev 0.<N>`.
4. Run the door: `scripts/prj34-iterate.sh 0.<N> <commit-message-file>` (add `full` when N is a multiple of 11). It runs tsc · drs-render + --check ·
   drs-crs · innovation-time (and test:ci + build when full), commits, pushes both refs and prints `SHA … | pushed main=… branch=…`. A red gate is a
   stop: fix your own edit or revert it, never loosen a lock, never leave the tree red. Paste the door's last lines into the round file's `## Gates`
   before the commit (write the file, then run the door; the door adds the file to the commit).
5. Return the structured result: revision, sha, means, edits applied, slides touched, decisions, gates green.

## Voice
Plain English a founder reads once; the future tense earned by the record; numbers only where they change a decision; the citizen present on the
page; no model names; no marketing adjectives; every "will" backed by a horizon and a gate.
