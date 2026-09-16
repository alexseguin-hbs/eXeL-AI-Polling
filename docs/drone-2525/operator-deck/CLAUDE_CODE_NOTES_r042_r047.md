# Claude Code notes — Drone-2525 r.042 → r.047

Play file now: `drone-2525_v.00.00_r.047.html`  
Nomenclature: `v.00.00_r.XXX` only. After r.043 the live line is 044, 045, 046, 047. Do not invent skips.

Doctrine: PLAY → RECORD → REPLAY → COMPARE → QUALIFY → IMPROVE → SHARE  
R-CORE coordinates. HI is authority. Capitol lawn is a **civic simulation arena only**.

Do **not** overwrite `ASM_CUP_99.md` / `ASM_CUP_99.json` / `ASM_ROSTER.csv` (seed 2525 fixture).

---

## From eXeL AI on r.040 (closed in r.042)

1. Boot failure: 42 turrets were written before `const units`. **Closed in r.042** — TEAM loop runs after `const units`.
2. QUAD / VTOL / FOIL identity: `applyMode('foil')` must label **D1F** only. D1 stays VTOL. D1Q stays QUAD.
3. One challenge spine: CH1–CH5 + DIFF 1–5 is the only gameplay truth. TG must not compete.
4. CH5: every action needs a decision record (`decisionId`, designated, hiApproved, authorityLevel, actor). No approve → HOLD, not a shot.
5. Replay line: `time | actor | verb | id | result`
6. Keep the 99× cup as regression fixture. Compare more than winners.

---

## From eXeL AI on r.042 (closed in r.043)

Do not run the next 99× until instrumentation exists.

* TG picker was hidden but `tgSpec()`, `setTG()`, `state.game` still ran. **r.043:** picker gone, `setTG` gone, spawn uses CH only. `tgSpec()` is a dead shim → `challengeSpec()`.
* `state.decisions` existed but `pack()` did not export it. **r.043:** `pack()` exports `decisions`, `events`, `metrics`, `replayHash`.
* Replay mixed free-form `BLU +250` with canonical lines. **r.043:** `ev()` is the schema.
* No replay hash. **r.043:** FNV of `seq|challenge|diff|role|verb|id|designated|hiApproved|authorityLevel|result|blu|red`. Do **not** hash wall-clock, ISO, FPS, or SID.
* SAVE writes `exel-2525-sidecar.json`. Fixture stays untouched.
* Next QUALIFY: seed 2525 × 99 × CH1–5 → sidecar → compare designation rate, HI holds, auth failures, handoffs, FPS distribution, replay hash — then winners.

---

## HI feedback after r.043 (landed in r.044, then 045–047)

Phone was still on r.043. Right stick off-screen. Landscape stage collapsed to black.

**r.044 (official successor to 043; later 045–048 stamps were collapsed then re-issued in order):**
- Sticks `position:fixed` above dock + safe-area.
- Landscape stage min ~42vh; layout retries if canvas height < 80.
- TARGET paints object LOCK red and stamps **T1 / T2 / T3**.
- HI lock: AsM must not steal designate; TARGET must not slew the camera onto another pop; lockOn prefers current desig while `dot > 0.82`.
- VTOL forward: stick-up = nose forward. `along = vmin + fwd*vmax` (do not `max(vmin, …)` or forward input is thrown away).
- Top chrome: dropdowns, not a chip wall. MODE / PLATFORM / MoT / CH / DIFF / HAL. MORE holds AsM, RELINQUISH, seat cycle.

**Do not skip revision numbers.** User: “stop making up r numbers we go from 43 to 44.”

---

## r.045 — controls are paramount

- CONTROLS and VOICE live on the **main bar**, not only inside MORE.
- Sticks + TARGET + FIRE are the operator surface.
- Voice (Web Speech API) is a path for TARGET, not a replacement.

Phrases already parsed:
- `target` → designate pip
- `target 1|2|3` / `t one` → slot then designate
- `fire` / `fire 3`
- `capture`

---

## r.046 — voice is a toggle

- VOICE / VOICE ON, `aria-pressed`, `.on` class.
- Top bar and dock stay in sync (`voiceSync()`).
- Off = mic stopped.

---

## r.047 — default is click to target

- Single click / tap on a mark **immediately** designates (red + T-slot). No 280 ms wait.
- Double-tap = FIRE if red.
- TARGET button and voice `target` do the same designate.
- Do not call `targetN()` slew on a simple click.

---

## Still true across 042–047

| Rule | Detail |
|---|---|
| Names | QUAD = hover D1Q · VTOL = D1 · FOIL = fixed wing D1F |
| Fire gate | No red, no shot. CH5 needs `hiApproved` |
| AsM | Default SPOT only. FIRE is opt-in. Cannot overwrite `hiLock` |
| Authority | HI. R-CORE does not dominate |
| Map | Texas Capitol civic sim, origin 30.27467 N, 97.74035 W, +Z south |
| Roster fixture | BLU Enki Thor Odin Athena Krishna Enlil · RED Sofia Aset Pangu Christo Thoth Asar |
| Cup (immutable) | 6v6 BLU 3–1 · 3v3 BLU 5–0 · pairs 1–3 RED · 4–6 BLU |

---

## What Claude Code should do next

1. Treat **r.047** as HEAD.
2. Next file is **r.048** only if there is a real change.
3. Do not resurrect TG as a second level system.
4. Do not place live-fire or turret-siting advice on the real Capitol.
5. If you run 99× again, write a **sidecar**, leave `ASM_CUP_99.*` alone, hash the canonical event projection only.
6. Keep CONTROLS (sticks, click-target, voice toggle) unburied.
