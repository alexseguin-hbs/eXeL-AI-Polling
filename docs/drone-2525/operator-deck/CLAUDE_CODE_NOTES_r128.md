# Drone-2525 — handoff note for r.129 (from Claude Code, 2026-09-19)

HEAD: `drone-2525_v.00.00_r.128.html` (211,344 B, sha256 `6c26f43c…`) — **served as the playable at
`/drone-2525/play.html` on exel-ai-polling.explore-096.workers.dev**, byte-identical to this carried copy and
held under 7.77 MB (bytes) by `frontend/tests/drone-playable.test.mjs`. Nothing in the deck was edited on the
way to production. R-CORE: the best solution ships regardless of which AI wrote it.

Nomenclature `v.00.00_r.NNN`; do not invent skipped revisions. This note does not create r.129 — it tells the
Grok / eXeL AI loop exactly what r.128 already closed so r.129 spends its bytes on real gaps.

## Headless smoke of the served file (Chromium, 390 px)
rev 0.128 · in-file QA **54/55** · 60 fps · 0 page errors. The one non-passing row is `SYNC_DIRECT`, which by
design requires `path==='DIRECT' && sync==='MATCH'` — it MUST stay FAIL on one device. Correct, not a defect.

## Gaps from the r.122 list that r.128 ALREADY CLOSED (verified against the source, line refs in r.128)
| gap (r.122 note) | status in r.128 | evidence |
|---|---|---|
| Stick QA proves only "moved", not signs | **closed** | `LAW_LUP_FORWARD` (fwd>0.9), `LAW_RLEFT`/`LAW_RRIGHT` (lookX sign), `TURRET_LOOK_LEFT` (dpan>0.4 at rx=−1), `driveSign` = displacement *along* the yaw-forward vector (>0.25), `lookSign` — lines ~3541–3575 |
| Raw BroadcastChannel bypasses `commEnv` (no sessionId) | **closed** | no raw `linkSend({…})` / `postMessage({…})` sites remain; PRESENCE goes through `commEnv` (line 3465); `commIn` drops foreign `sessionId` (1290) |
| Two-phone SYNC not a first-class FAIL row | **closed** | `SYNC_LOCAL` / `SYNC_DIRECT` rows (3495–3496); DIRECT+MATCH required |
| QUAL40 live loop counts only rounds/hits | **closed** | `QUAL_TABLES` 20/120s · 10/60s · 10/60s (700), table tower with time expiry + unfired-as-MISS (764–766), per-silhouette `scored`, `qualBadge` 23/30/36, QA rows `QUAL40_TABLES` + `QUAL40_CAP_III` (3589–3595) |
| Updates panel says r.105 | **closed** | no "r.105" remains |
| Duplicate SIM-ACTION via `decide()`+`netEvent()` | **closed** | pop/UAV path calls `decide('SIM-ACTION')` then transmits `last` (the SAME row) via `commEnv` (2109); no second `ev()` |

## Nits (cosmetic, not worth a byte-changing revision alone)
- Light Codex header comment (~2469) and `evidenceNote` (~3655) still say "r0.123" against `revision:'0.128'`.
  (`EVIDENCE FIXTURE r0.103` is CORRECT — that fixture is r0.103 evidence; leave it.)
- Fold these into r.129 only when r.129 carries substance.

## Genuinely OPEN — cannot be closed in-file or on one device (unchanged, honest)
1. **Two real phones**: HOST/JOIN → DIRECT → AMBER both → RED both → same hash → disconnect/snapshot → same
   hash. Local QA green ≠ that proof. This is THE qualification gate; it needs two devices in one room.
2. **3v3+ ordering**: `orderKey` is room + peer + local seq — deterministic replay sort, not a shared session
   clock. Needed before any 3v3 claim; 9v9 stays locked until 1v1 then 3v3 qualify.
3. **Endurance soak**: hours of wall-clock FPS/heap on a device. The 2,016-trial batch is depth, not time.
4. **Alt-C**: keep "true 50–300 m plates" vs "25 m scaled paper" explicitly distinguished (both valid).
5. **Bathymetry** is a proxy, not survey data.

## What the repo side adds around the deck (modular reuse toward Vision 2525, no rework)
- `/drone-2525` (React shell) = the on-ramp: r.066-style intro, guided start (turret-first, CH0 first visit,
  forward-only unlock), amber/red legibility, CONFIG bar folded, **PLAY · r.128** → the deck. The deck is the game.
- Shared primitives already in the repo the deck's SYNC design maps onto: Light Codex (`frontend/lib/light-codex.ts`,
  canonical extended alphabet — space=WBWB, `- _ • :`; exported to `docs/light-codex/`), Atlantis Accords L1–7
  packaged-HTML seal (`frontend/lib/atlantis-package.ts`: AES-256-GCM + PBKDF2, clearance 1–7, burn-on-close),
  crypto-random numeric PIN (`generateSealCode`). When the deck's lobby/6-digit team codes are lifted into the
  Vision-2525 substrate, these are the modules to reuse — not re-derive.

## Suggested r.129 (narrow)
- The two-phone MATCH qualification run, recorded (two devices, one room, the hash on both HUDs, the sidecar
  from each) — evidence, not code.
- Session-clock `orderKey` (Lamport/hybrid) behind a flag, replay sort by it, gated by a two-peer harness.
- The two "r0.123" strings → "r0.129".
