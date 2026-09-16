# Drone-2525 · operator deck — the carried package

Nine revisions of the operator's own build, plus the prompts and the Cup, carried **byte-for-byte** and
never regenerated. `sha256` for every file is in
[`docs/asks/2026-09-16_operator_deck_r042.sha256`](../../asks/2026-09-16_operator_deck_r042.sha256).

```
cd docs/drone-2525/operator-deck && sha256sum -c ../../asks/2026-09-16_operator_deck_r042.sha256
```

## Read-only, and one of them emphatically so

`PROMPT_ECO2525_r042.md` says it plainly: **"Do not overwrite `ASM_CUP_99.*` (seed 2525 regression
fixture)."** A baseline that can be regenerated is not a baseline. `ASM_CUP_99.json` and `.md` are the
published result a later build has to still reproduce, and nothing in this repo may write to them.

| file | what it is |
|---|---|
| `ASM_CUP_99.json` · `.md` | **the fixture.** Seed 2525, 99 runs × levels 1–5. Baseline: 6v6 **BLU 3–1**, 3v3 **BLU 5–0**, pairs 1–3 RED, pairs 4–6 BLU |
| `ASM_ROSTER.csv` | the twelve seats — six BLU (Enki, Thor, Odin, Athena, Krishna, Enlil) against six RED (Sofia, Aset, Pangu, Christo, Thoth, Asar) |
| `PROMPT_ECO2525_r042.md` | the doctrine and the six fixes that define gameplay truth |
| `PROMPT_ECO2525_r040.md` | its predecessor |
| `drone-2525_r.003 … r.042.html` | the build, nine revisions |

## The doctrine, quoted

> PLAY → RECORD → REPLAY → COMPARE → QUALIFY → IMPROVE → SHARE
>
> R-CORE coordinates. HI is authority. **Civic sim only — Capitol lawn is a virtual arena, not a live-fire
> planner.**
>
> Compare next sims on designation rate, HI holds, auth failures, handoffs, FPS, replay hash — not winners
> only.

## What is stable across all nine, and what is not

Checked rather than assumed. These four are **identical in every revision from r.013 to r.042**, so the
contract has been settled since r.013 and only the app around it grew:

| | value | first seen |
|---|---|---|
| `window.CONTROLS` | schema `EXEL-2525-CONTROLS-1`, md5 `e2667541` of the block minus its revision field | r.013 |
| `AIR` | `{L:3.2, B:2.4, H:0.55, glyph:8}` | r.013 |
| `T13` | md5 `7dfe3c58` | r.013 |
| seats | `pilot {f:0.18, u:0.12}` · `tgt {f:-0.15, u:-0.04}` · turret separation 0 | r.013 |

What grew: r.035 → r.042 added `decide`, `feed`, `rcoreStep`, `asmTick`, `challengeSpec` and `replayScrub`
and dropped nothing — r.042 is a strict superset of r.035.

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
