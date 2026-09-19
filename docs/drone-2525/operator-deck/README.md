# Drone-2525 · operator deck — the carried package

**HEAD is `drone-2525_r.129.html` — SERVED AS THE PLAYABLE at `/drone-2525/play.html`.** r.129 (Claude Code,
2026-09-19, from r.128 by asserted exact patches — `HASHES_r129.sha256`) closes three operator items: the
BODY moves along the airframe heading, never the head's pan (L-up drove QUAD/VTOL backwards whenever the gimbal
was panned behind — `camOf` folds the pan into the pilot's camera yaw and `phys` used the camera forward);
every standing target carries a white-circle bullseye in T13.SI; once HIT the T## slot clears with the box; in
a LIVE room the red box needs TWO SEPARATE humans (a locally-marked target cannot be self-approved — solo CH0
practice keeps SOLO HI-2). The deck's in-file QA gained `BODY_FWD_PAN180`, `HIT_CLEARS_SLOT`, `LIVE_TWO_HUMANS`.
Previous HEAD r.128 (Grok + eXeL AI) — see below.
the best solution ships regardless of which AI wrote it; `frontend/tests/drone-playable.test.mjs` holds it
byte-identical to this carried copy and under 7.77 MB). r.105 → r.128 (Grok + eXeL AI, 2026-09-18/19): r.122
the 50 m RANGE (42 lanes, Alt-C silhouettes at true metres, PRACTICE UP/STAY/QUAL 40, ASM_QUAL40 fixture) ·
r.124 the Grok/eXeL AI collaboration · r.128 **blue/red revisions + the Blizzard-style multiplayer LOBBY with
6-digit team-specific codes** (the operator's key add). `CLAUDE_CODE_NOTES_r122.md` is the current handoff
(doctrine, locked stick signs, do-not-regress list, honest open items). Hashes in `HASHES_r105_r128.sha256`.
The operator's own build across r.003 → r.128, plus the prompts, the
notes files (r.042→r.047, r.047→r.050, r.051), the r.066 gap-close, the SSSES/SPIRAL-99 audit (md + json), the
roster and the Cup — carried **byte-for-byte** and never regenerated. `sha256` for r.051→r.075 is in
[`HASHES_r051_r079.sha256`](HASHES_r051_r079.sha256); r.093→r.102 in
[`HASHES_r093_r102.sha256`](HASHES_r093_r102.sha256); r.003→r.050 in
[`docs/asks/2026-09-16_operator_deck_r042.sha256`](../../asks/2026-09-16_operator_deck_r042.sha256).

HEAD moved r.050 → r.079 on 2026-09-17: r.051 (state truth: `phase:'amber'` on the object) · r.052 (turret R
stick right edge, 3D wire box) · r.066 (intro cinematic + SELECT CITY/CRAFT/RANGE, WIFI/WebRTC HOST/JOIN) ·
r.068 (stick geometry so you can move around the lawn) · r.073 (Lake Travis buoys, MASS-AI walk, SSSES/SPIRAL
corrections) · r.075 (CH5·FOILS, defensive loop hardening) · r.076 (WALLS collide MASS-AI + drones; WATER confines ARK/MINI) · r.079 (VTOL FOIL is ONE craft; multi-water Austin picker: Lady Bird / Lake Austin / Colorado). Diffs and the reconciled 48-agent + Grok audit
live in the plan (`ROUND 12`). `ASM_CUP_99.*` and `SSSES_SPIRAL_99.*` stay read-only fixtures.

**THE r.093 → r.102 NETWORKING/DETERMINISM ARC (Grok, carried 2026-09-17; built in our port as P2, AFTER the
demo on-ramp).** This arc built the COMM/LINK/SYNC layer our React port has not yet built. THE ONE LAW to carry:
**ONE EVENT → ONE REDUCER → ONE WORLD → ONE HASH** — a canonical event is created once, transmitted as that
exact row, and applied to world state only through a single deterministic reducer `applyWorld(state, row)`;
never local mutation on the sender plus log replication. Closed across r.094/095: WebRTC offer/answer carries
`{room, description}` and the joiner adopts the host room · `appendCanonicalEvent` advances evSeq + appends
events/replay + reduces + dedups · HELLO compares `replayHash` → **MATCH/DIVERGED** + ACK carries the hash ·
SNAPSHOT replays through the reducer and verifies the hash · byte-count size gate via `new Blob([html]).size` ·
Bluetooth honest (only "ready" with a writable characteristic, else `BT SCAFFOLD · NO 2525 CHAR`) · SIM runs
separated from human plays. STILL OPEN at r.102 (do NOT inherit): a real two-peer COMM/SYNC gate (F04_NO_DIRECT
proves the opposite) · one-decision-one-canonical-event (r.095/098/102 still double-count SIM-ACTION via
`decide()`+`netEvent()`) · unmeasured device metrics must be null not 100 · a successful SIM-ACTION path in the
batch (r.102 had `fires:0`) · exported hash histogram / unique-count / mismatch stats · concurrent ordering
(`orderKey` not yet in the hash) before 3v3/9v9 · real 5-hour endurance (ALL_NIGHT_SIM's 2,016 trials ran in
952 ms — an accelerated batch, NOT 8 wall-clock hours). The two-phone MATCH qualification: A TARGET → B amber →
B APPROVE → both red → A sim action → both worlds + hashes match → disconnect → snapshot → hash verified →
reconnect → next event → still match. `ALL_NIGHT_SIM_r101.json` is the preserved r.101 batch evidence.

**r.104 (eXeL AI, carried 2026-09-18)** is the first eXeL AI / MoT-coordinated build (141,677 B, JS
node --check clean). On top of the reducer arc it adds: **Light Codex Double-Helix metadata**, a **6-digit
human pairing** authorisation flow, and a **separate crypto layer ECDH P-256 → HKDF → AES-GCM-256** (the six
digits authorise the two humans; they are NOT the encryption key; WebRTC DTLS underneath as well) — the
operator's "Light Codex / SKL-for-Link-16 / Atlantis L1-7 packaged-HTML SYNC" directive, realised in the deck.
It also corrected r.103 evidence (336 trials/challenge, CH5 top 700, r.103 batch SHA-256 embedded, missing
digests marked not-exported not faked, cohort-aware trial-hash qualification) and adopts periods-not-spaces
for the BBBB space/0 ambiguity (our `light-codex.ts` fixes that at the alphabet level: space = WBWB). Our
port's own P2 (reducer + Light-Codex-encoded, 6-digit-keyed, Atlantis-L1-7-wrapped SYNC on the real repo
primitives — `atlantis-package.ts` AES-GCM/PBKDF2 + `generateSealCode`) is planned; the deck is the reference.

```
cd docs/drone-2525/operator-deck && sha256sum -c ../../asks/2026-09-16_operator_deck_r042.sha256
```

`CLAUDE_CODE_NOTES_r047_r050.md` (on top of `CLAUDE_CODE_NOTES_r042_r047.md`) is the operator's handoff to
this repo and is the file to read first. Its standing instructions: **r.050 is HEAD · next file is r.051
only if something actually changes · do not skip revision numbers · do not resurrect TG as a second level
system · do not place live-fire or turret-siting advice on the real Capitol · keep CONTROLS unburied · leave
`ASM_CUP_99.*` alone.**

## The r.049 / r.050 fire gate — amber → red

Verified in the r.050 source, not taken from the notes: `approveDesig()` (:957) is the **only** writer of
`phase='red'`, and `fireN()` (:971) refuses anything else.

```
click / TARGET / voice target    →  AMBER box + Tn   (#F0A020)   cannot fire   toast AMBER · SECOND HI APPROVE
APPROVE (HI-2 or net peer)       →  RED box          (#E24B3B)   can fire
FIRE / double-click / voice fire →  only if phase==='red'
```

FIRE with no box → `NO_RED_BOX`; FIRE on amber → `AMBER_NO_APPROVE`. Both are refused **and recorded** as
decisions. Double-click does not skip APPROVE.

**Said plainly, because the notes only say "solo second-authority button still allowed":** on one device
the same person may self-approve as `HI-2` (r.050 :960 permits it by comment, with no check). Solo play is
therefore a **two-step** rule; with a second tab or a net peer (`BroadcastChannel {k:'APPROVE', id}`) it
becomes a **two-person** rule. Both are honest; they are different claims.

## What r.047–r.050 closed, verified by reading the source

The r.040 and r.042 review items are genuinely closed, not merely claimed:

| item | state in r.047 |
|---|---|
| boot order — 42 turrets before `const units` | **closed**, the loop runs after |
| QUAD `D1Q` · VTOL `D1` · FOIL `D1F` kept distinct | **closed** |
| one challenge spine, TG not competing | **closed** — `setTG` is gone and `tgSpec()` is a one-line shim returning `challengeSpec()` |
| decision record on every action | **closed** — `decide()` writes `decisionId`, `designated`, `hiApproved`, `authorityLevel`, `actor`, `challenge`, `diff` |
| canonical event line | **closed** — `ev()` emits `t \| role \| verb \| id \| result` |
| `pack()` exports the collections | **closed** — `events`, `decisions`, `metrics`, `replayHash` |
| deterministic replay hash | **closed, and correct** — FNV over `seq\|challenge\|diff\|role\|verb\|id\|designated\|hiApproved\|authorityLevel\|result\|blu\|red`, with no wall-clock, no ISO, no FPS and no SID, exactly as specified |
| metrics reducer | **closed** — `metricsOf()` yields designation rate, HI holds, auth failures, handoffs |

## Four defects found in r.047 / r.050 while reading them

Reported rather than fixed here, because this directory is a carried copy and nothing in this repo may edit it.

1. **`metricsOf()` stamps `rev:'0.044'`** while the file declares `revision:'0.047'` three times elsewhere.
   A sidecar written from r.047 would attribute its metrics to r.044 — which is precisely the comparison the
   sidecar exists to make trustworthy. One-character fix, high consequence.
2. **`replayScrub()` reads fields the canonical schema no longer has.** It renders
   `(ev.k||'') + ' ' + (ev.id||'') + ' ' + (ev.x||'')`, but `ev()` rows carry `verb` and `result`, not `k`
   and `x`. So scrubbing the replay strip shows the id alone — the verb and the result are silently blank.
   The schema canonicalisation in r.043 broke the scrubber and nothing caught it.
3. **`feed(m)` routes free-form text through `ev('FEED','',m)`**, so arbitrary strings enter the canonical
   event stream and therefore the replay hash. Today that is harmless because scores are already hashed via
   `blu`/`red`. It stops being harmless the moment any feed line contains a clock, an FPS figure or a SID —
   the four things the hash spec explicitly excludes. Worth a guard rather than a convention.

4. **`designate()` does not set `phase:'amber'` on `state.desig`** (found by eXeL AI, 2026-09-16, on r.050).
   It records `DESIGNATED … AMBER` and broadcasts `phase:'amber'`, but the local `state.desig` object is created
   without the field. `fireN()` distinguishes `AMBER_NO_APPROVE` only when `state.desig.phase==='amber'`, so a
   premature fire on a fresh mark falls through as `NO_RED_BOX` — the wrong refusal, and the wrong decision on
   the record. The repository's port sets amber by construction (`slots.ts designate()`), and `tests/drone-slots`
   holds it as an explicit acceptance test: a fire on a fresh mark must read `AMBER_NO_APPROVE`, never
   `NO_RED_BOX`. Also noted by the same review: the r.050 receive side updates peer / RTT / sequence state but
   the uploaded source does not show it applying an incoming `{k:'APPROVE'}` — the two-direction proof lives
   in this repository's `scripts/drone-crew-e2e.mjs`, not in the deck.

## Read-only, and one of them emphatically so

`PROMPT_ECO2525_r042.md` says it plainly: **"Do not overwrite `ASM_CUP_99.*` (seed 2525 regression
fixture)."** A baseline that can be regenerated is not a baseline. `ASM_CUP_99.json` and `.md` are the
published result a later build has to still reproduce, and nothing in this repo may write to them.

**The fixture cannot answer the new questions, and that is not a flaw in it.** It preserves wins, points,
teams, pairings and the seed — but not designation rate, HI holds, auth failures, handoffs, FPS or replay
hashes. Those need a **non-destructive sidecar** beside it (`exel-2525-sidecar.json`), which is what r.043's
SAVE already writes. The fixture stays untouched; the sidecar carries the new axes.

| file | what it is |
|---|---|
| `CLAUDE_CODE_NOTES_r047_r050.md` · `r042_r047.md` | **the handoff to this repo.** Read first |
| `ASM_CUP_99.json` · `.md` | **the fixture.** Seed 2525, 99 runs × levels 1–5. Baseline: 6v6 **BLU 3–1**, 3v3 **BLU 5–0**, pairs 1–3 RED, pairs 4–6 BLU |
| `ASM_ROSTER.csv` | the twelve seats — six BLU (Enki, Thor, Odin, Athena, Krishna, Enlil) against six RED (Sofia, Aset, Pangu, Christo, Thoth, Asar) |
| `PROMPT_ECO2525_r042.md` · `r040.md` | the doctrine and the fixes that define gameplay truth |
| `drone-2525_r.003 … r.050.html` | the build, eleven revisions |

## The doctrine, quoted

> PLAY → RECORD → REPLAY → COMPARE → QUALIFY → IMPROVE → SHARE
>
> R-CORE coordinates. HI is authority. **Civic sim only — Capitol lawn is a virtual arena, not a live-fire
> planner.**
>
> Compare next sims on designation rate, HI holds, auth failures, handoffs, FPS, replay hash — not winners
> only.

**R-CORE — Recursive Continuous Operational Reality Ecosystem** (operator, from VISION • 2525): a
coordination architecture, not a platform and not a command system, sitting across existing systems while
preserving human judgment, institutional authority and accountability. Its loop is
`REALITY → OBSERVE → RECORD → REPLAY → SIMULATE → VERIFY → IMPROVE → REALITY`; its five layers are
Communications, Coordination, Intelligence, Simulation + Replay, and Continual Evolution; its five systems
are COMM-2525, LINK-2525, EDGE-2525, SYNC-2525 and UCRS-2525. *"R-CORE coordinates; it does not dominate.
Humanity remains the authority."*

## What is stable across all ten, and what is not

Checked rather than assumed. These four are **identical in every revision from r.013 to r.047**, so the
contract has been settled since r.013 and only the app around it grew:

| | value | first seen |
|---|---|---|
| `window.CONTROLS` | schema `EXEL-2525-CONTROLS-1`, md5 `e2667541` of the block minus its revision field | r.013 |
| `AIR` | `{L:3.2, B:2.4, H:0.55, glyph:8}` | r.013 |
| `T13` | md5 `7dfe3c58` | r.013 |
| seats | `pilot {f:0.18, u:0.12}` · `tgt {f:-0.15, u:-0.04}` · turret separation 0 | r.013 |

What grew: r.035 → r.042 added `decide`, `feed`, `rcoreStep`, `asmTick`, `challengeSpec`, `replayScrub`;
r.042 → r.047 added `ev`, `metricsOf`, `replayHash`, `voiceSync` and removed `setTG`. Nothing else was lost.

## Divergences from this repo, recorded rather than silently reconciled

1. **The thirteen colours are not the same thirteen.** The deck's `T13` is a muted instrument palette
   (`PANEL #070B10`, `STROKE #1C2A3A`, `WIRE #7AB8C4`, `ROAD #4A6A78`, `WATER #2A6D88`, `DOME #C9A227`,
   `SI #E8D5B0`, `HI #5BA8FF`, `AI #C084FC`, `LOCK #E24B3B`, `TAG #3DCC8A`, `GIMBAL #F0A020`, `VOID
   #000000`). This repo's is the saturated spectrum in `frontend/lib/trinity-palette.ts`. Both are thirteen;
   they share almost no hue, and `tests/vector-law.test.mjs` refuses any hex outside ours. **Operator
   decision, not an implementation choice** — it changes how Security, Architect, Manta and Celestial look
   too.
2. **Two loops are stated in one package.** The prompt says `PLAY → RECORD → REPLAY → COMPARE → QUALIFY →
   IMPROVE → SHARE` (seven); `RCORE_LOOP` in the code says `REALITY → OBSERVE → RECORD → REPLAY → SIMULATE →
   VERIFY → IMPROVE → REALITY` (eight, cyclic). Compatible in spirit, different in words.
3. **The airframe proportions are inverted.** `AIR={L:3.2, B:2.4}` is longer than it is wide. The drawing
   this repo scales from is **wider than it is long** — span 1.111 m, nose-to-tail 0.7777 m — which is the
   axis error corrected on 2026-09-16 (see `docs/asks/2026-09-16_foil_1m_five_levels_world.md`). The deck's
   1.33 long-to-wide is the pre-correction dart.
4. **PRNG.** The deck declares and uses `mulberry32`; `frontend/lib/drone-2525/swarm.ts` uses its own
   bit-mix, while `DRONE-2525_PARITY.html` declares mulberry32 — so this repo's harness and its app
   disagree. Ours to fix.
5. **Glyph.** The deck has one 8-segment glyph; the app has four bands at 1 / 4 / 12 / 24.
6. **Quorum.** The deck's level 4 is 2/3; `si-pod.ts` uses `QUORUM_FRACTION = 0.5`.
7. **Authority level 2.** The deck covers "one slot T1–T3"; this repo covers one aircraft. **The deck's is
   better** once numbered slots exist, and is the one to adopt.
8. **The fixture declares `revision 0.039`** while the newest build is r.042 — worth confirming which is the
   reference before gating against it.
