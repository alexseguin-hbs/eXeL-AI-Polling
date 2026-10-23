# Drone-2525 r.229 — H03: 1v1, ONE HI PER SYSTEM, TWO SYSTEMS (2026-10-22)

**Artefact commit 8a96bd2 · carried `drone-2525_r.229.html` sha256 6f6052eef29fa378d6320f54f2a690fbd384e43ffb360e7dd54da0108c5527c2.**

## His words (the night brief, 2026-10-21, verbatim)
*"r.229 · H03. 1v1. HI 2 · systems 2 · partners on one system 0. Each owns one platform and one air track. Each can take
the other. A press does not land on the other system's mark."* (CRS-CL.H03, scene CRS-CL.H01.S.)

He later settled (AskUserQuestion, 2026-10-22) that the concrete engagement object and the layout are **scenario-driven**:
*"depends on scenario; we will create an array of more and more challenging scenarios as we progress from Introductory,
Intermediate, Advanced, and Real-World."* So r.229 builds the 1v1 **mechanics** plus the **Introductory** scenario
(Enki's Spark, one air track each); the richer engagement and the harder scenarios arrive at later rungs.

## Measured before building (the r.228 bytes; every function named is FREE — none in `tests/range-spans.json`)
- **H03 is match=1, not match=2.** The two "systems" are the two team-phones of the already-qualified 1v1 room (one BLU,
  one RED). `QUALIFIED_MATCH` stays 1 (editing it would unlock unqualified 2v2 for the Range). The match transport is
  untouched; `lobby-2525.test.mjs:68/:86` stay verbatim green.
- The lawn was single-system wired: `capIntroTrack()=drones[0]`, `capIntroSeat()='T01'`, one `capRun`, CSTART/CTIME
  hardcoded `system:'A1'`, `capLawnHi()` the whole room. The mark model is a single `state.desig`; marks are not
  system-scoped; a peer's wire rows (MIST/DESIGNATED/APPROVE/HIT) are applied by `applyWorld` on the receiving phone.

## What changed (the patcher `patches/r228_to_r229.py`; every edit a single asserted `rep()` on a FREE function)
- **M1 the discriminator.** `lobbyLaunchSnapshot()` carries `systems:2` when the two seats are on opposite teams (CL.15's
  own frame); same team = 1 (H02).
- **M2 per-system helpers + track.** `capLawnSystems`, `capLawn1v1` (`capIntro && LIVE && launch.lawn && systems===2`),
  `capLawnTeam`, `capOwnSystem` (BLU→A1, RED→A2), `capSystemHi(sys)`, `capOwnHi`; `capIntroTrack()` returns `drones[0]`
  (BLU) or `drones[1]` (RED); `capLawnPeer` returns early in H03 (record-only).
- **M3** `capLawnCrew` is H02 only (`systems!==2`); **M4** `marksPersist`, `approveDesig`/`wireApprove` TWO_HUMANS hold
  for `capLawn1v1` too (own-mark self-approve); **M5** CSTART/CTIME carry `capOwnSystem()`/`capOwnHi()`; **M6** the entry
  toast names the 1v1.
- **M6b** (the play's first fault): `approveWorksHere` + the T1/T2/T3 "other seat" toast tails were only relaxed for
  `capLawnCrew` — extended to `capLawn1v1` so the one HI's self-approve ACTS and the glass does not say "other seat".
- **M6c** (the play's second fault — the heart of no-cross-talk): in H03 a peer's row for the OTHER system's track is
  record-only in `applyWorld` (the row stays on the record for the hash; it drives nothing here), so a mark/approve/HIT
  for the other track is no longer applied here and no HOLD is relayed back.
- **M7** the boot row `ONE_HI_PER_SYSTEM`.

## The gate, red first (`redfirst/r229.md`)
`ONE_HI_PER_SYSTEM` is red on the r.228 bytes (`capLawn1v1` is not defined), green on the cut. `TWO_HI_ONE_SYSTEM` (H02)
stays green — a same-team room is unchanged.

## Played through the real UI (Playwright over WebRTC, DD-148) — the two-phone 1v1 room, opposite teams, 7/7, 0 page errors
Both phones land on the lawn in LIVE on their own systems (A1 host / A2 joiner; `capLawn1v1` true, `capLawnCrew` false);
the entry toast reads `ROOM LIVE · 1v1 · BLU vs RED · ONE HI EACH`; each phone runs TARGET → APPROVE → FIRE on its OWN
track (host UAV-1, joiner UAV-2), red → hit → `HIT 1 · MISS 0 · 1 RD`; each CSTART and CTIME names ONLY its own HI with
its own system; no phone wrote the other system's rows; one replay hash on both. The play drove the two fixes above.

## The twelve, SSSES, one spiral (per DD-148)
Twelve seats (Opus, judged from the two-phone 1v1 play and the gates) — **all SHIP, synthesis SHIP, 0 faults.** Aset/Asar: one record whole on both phones, CSTART and CTIME each name one HI with its own system (A1·fv37, A2·bzb3), both tracks to lifePct 0, one replay hash 97207059 MATCH on both. Athena/Christo: the RED joiner lands on A2, runs TARGET → APPROVE → FIRE on its own UAV-2 self-approving, never touches the host (0 foreign rows). Enki/Krishna: a peer's other-system row is record-only on both seams (applyWorld + capLawnPeer) yet still ingested for the one hash — no cross-talk (host 0 A2 rows, joiner 0 A1 rows), no HOLD relayed. Enlil: every edited/new function FREE (range-frozen 100/0, 0 moved); ONE_HI_PER_SYSTEM red on r.228 (capLawn1v1 undefined → ReferenceError), green on the cut; TWO_HI_ONE_SYSTEM intact. Thor: QUALIFIED_MATCH untouched (lobby-2525 verbatim), no path makes capLawn1v1 true off an opposite-team lawn room. Odin/Pangu: `systems` is an integer and `capSystemHi(sys)` is parameterised — the box carries to H04; roster-teams is the right discriminator and H02 stays byte-identical. Sofia/Thoth: the glass reads YOU / APPROVED BY YOU, never "the other seat", on a one-HI system; the record names each system's one HI. The one set-aside item — each HI taking the OTHER system's track — is deferred to a later scenario (his 2026-10-22), not a fault.

## SSSES, three attempts
All three attempts kept the change AS BUILT (changed=false); the judge kept attempt 1. Scores **92 · 94 · 87 · 90 · 85** (Security · Stability · Scalability · Efficiency · Succinctness), lowest = Succinctness. Security 92: M6c makes a peer's other-system row record-only in applyWorld, so no foreign mark/approve/HIT applies here and no HOLD is relayed; TWO_HUMANS relaxed only to own-mark self-approve under capLawn1v1; match stays 1, so no unqualified 2v2 is unlocked for the Range. Stability 94: the 1v1 play 7/7, one hash MATCH, H02 (TWO_HI_ONE_SYSTEM) green, TRAIN UP byte-identical, QUAL 40 40/40 EXPERT. Scalability 87: the per-system helpers generalise r.228's single shared system, proven at N=2. Efficiency 90: the record-only early-return does net less work than r.228. Succinctness 85 (lowest): the diff adds the most surface (five helpers, a ~40-line boot-QA block, `||capLawn1v1()` threaded through ~5 conditionals); attempts 2 and 3 weighed three reforms and kept none, because each would touch H02's shared scaffolding or the play-asserted toast/wire strings and could not be re-validated read-only. All three rules hold on the kept form: passLine true (each phone owns and drives its own A1/A2 track, a press never lands on the other system's mark, each CSTART/CTIME names only its own one HI, one hash), rangeUntouched true (every edited function free of range-spans.json's frozen spans; range-frozen 100/0, range-2525 118/0; QUALIFIED_MATCH only in a comment), noNewControlOrRow true (ONE_HI_PER_SYSTEM is a boot-QA outcome row like TWO_HI_ONE_SYSTEM, not a glass control).

## One spiral
Forward (this change → the record → the glass on both phones → the magazine per phone → the next press) holds at every stage inside r.229's Introductory 1v1 scope: one replay+canonical hash is recorded at ingest before the selective drive, so a peer's other-track row stays on the record (one hash) while driving nothing here; own-system glass, own magazine, own next press. Backward (the room's roster → each on its own system → the cue → the three presses, self-approve → the one track → the four numbers stored, no cross-talk, one hash) is true on the cut, verified against the 1v1 play JSON. Both directions name the SAME first place where truth would be lost, and it is ONE RUNG BEYOND this revision: the deferred "each can take the OTHER system's track" engagement (his 2026-10-22 — scenario-driven, harder scenarios at later rungs). Because that first-loss is outside r.229, the one closing change is **no change** — the Introductory 1v1 scenario is whole.

## Decisions (reversible in one word)
The discriminator is the roster teams (opposite = two systems, CL.15's own frame; same team = H02) · each phone drives
only its own track (`drones[0]`/`drones[1]`), the opponent's track lives on the opponent's phone · the Introductory
scenario is two air tracks, no A2 ground siting (no invented grid place) · a scenario tag drives the array at later rungs.

## Not here, stated
The richer engagement where each HI takes the other's platform; A2's ground-station siting; the harder scenarios; H04
(r.230, 3v3). Owed, carried: no `test:drone-play` runner in CI (the plays are manual evidence); 428×926 not a CI viewport.
