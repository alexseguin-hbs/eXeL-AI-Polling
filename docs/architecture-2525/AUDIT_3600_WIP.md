# AUDIT_3600 — Celestial-2525 Base-3600 / A.B..C timing inventory
**State:** WIP (Part 1 incomplete — paused 2026-11-09 15:44 CST for eXeL revenue priority)
**Branch:** `feat/celestial-3600-dual-clock` @ origin/main `46efc6b91`
**Doctrine:** Do **not** change doctrine in this audit; flag decisions only.

## Conventions in play

| Convention | Where | Rule |
|---|---|---|
| UCRS HU | `frontend/lib/ucrs-2525.ts` | HU 0 = perihelion, HU 1800 = aphelion, HU 3600 = full orbit (= `3600.3600..3600`); orbit-play wraps `% 3600` → 0 |
| A.B..C grammar | `frontend/lib/abc-3600.ts` | B,C digits `0000..3599` (Vision r154/r156); N unpadded; `3600` only as full-unit / rollover writing |
| MoT financial | `frontend/lib/financial-2525/mot.ts` | 1 revolution perihelion→perihelion = 3600 A; Earth whole = **365.259636 d** anomalistic; print TRUE A (`3600.0000..0000`); `3600.3600..3600` / `3599.3599..3599` are Equal predicates, not print substitutes |
| Financial calendar | `frontend/lib/financial-2525/calendar.ts` | Sourced perihelion table; default year anchor = perihelion; Austin **CST STANDARD UTC−6 never daylight** |
| SoI calendar seed | `frontend/lib/soi-calendar.ts` | Separate perihelion seed table (CONFIRM ANNUALLY) |
| Vision living | abc-3600 header cites r154/r156 | `N.mmmm..ssss`; digits 0000–3599; 3600 only as rollover/full |

## Inventory (file:line → convention)

### `frontend/lib/ucrs-2525.ts`
- L2–11: Base-3600 UCRS master header; HU 0 perihelion, 3600 full orbit
- L40: Earth `tDays: 365.2422` (tropical/mean — **not** anomalistic 365.259636)
- L41: Mars `tDays: 686.980` (sidereal; matches mot Mars Earth-days)
- L49–53: Moon radius + `MOON_SIDEREAL_DAYS=27.3217`, `MOON_SYNODIC_DAYS=29.5306` — **no anomalistic month**
- L95–96: `huToNu(hu) = (hu/3600)*360`
- L109–115: `ucrsAt` — `spotu=hu/3600`, `rtu=round(hu)`, `ltu` from period seconds
- L129–132: `fmt3600` → `"N.0..0"` (zeros sub-units); `FULL_ORBIT = "3600.3600..3600"`
- L147–159: `tzFromLon` political EST/CST/MST/PST bands (no DST); Pfield → CST −6
- L174: `3600` as seconds-per-hour in `fmtTime` (SI, not Base-3600)

### `frontend/lib/abc-3600.ts`
- L2–29: A.B..C Base-3600; B,C 0000..3599; cites Vision r154/r156 `N.mmmm..ssss`
- L32–33: `SUB=3600`, `POSITION_SCALE=7200`
- L114–115: `FULL_UNIT_ABC = "3600.3600..3600"`
- L125–126: spatial azimuth 0000..3600, elevation 0000..1800

### `frontend/lib/financial-2525/mot.ts`
- L1–34: MoT law; Earth anomalistic **365.259636 d** = 3600 A; Mars 686.98 Earth days / 668.5991 sols; `SOL_SEC=88775.244`
- L38–39: `SUB=3600`; `CST_OFFSET_MIN=-360` (fixed, never CDT)
- L48–57: `EARTH_REVOLUTION_DAYS`, `MARS_REVOLUTION_*`, `SOL_SEC`
- L65–67: `FULL_ABC`, `FULL_MOT = "3600.3600..3600"`
- L79–98: `motABC` / `spanABC` / `isFull` / `fmtMot` — never clamp past 3600
- L152–218: CST stamps `YYYY.MM.DD_HH.MM..SS` via fixed UTC−6

### `frontend/lib/financial-2525/calendar.ts`
- L25–47: **SOURCED** perihelion table 2024–2035 (Espenak / Farmers' Almanac / EarthSky / APOD)
  - 2024: `2024-01-03T00:38Z`
  - 2026: `2026-01-03T17:15Z`
  - 2028: `2028-01-05T12:28Z` (note: records soi-calendar seed said 12:11)
- L56–66: `perihelionOf` / `perihelionCst`
- L91–114: `positionInYear` — uses `motABC(elapsed_ms, yearDays * MS_PER_DAY)` (param names say Sec; values are ms — ratio OK)

### `frontend/lib/soi-calendar.ts`
- L9–10, L70–77: perihelion seed (different times):
  - 2024: `2024-01-03T00:39Z` (**+1 min** vs financial)
  - 2026: `2026-01-03T17:16Z` (**+1 min** vs financial)
  - 2028: `2028-01-05T12:11Z` (**−17 min** vs financial 12:28)

### `frontend/lib/pod-clock.ts`
- L74, L92: `3600000` / `3600` as **SI ms/hour and s/hour** only — not Base-3600 doctrine

### `frontend/components/architect-2525/architect-celestial.tsx`
- L11–17, L32–36: Base-3600 map; perihelion at 12 o'clock; HU 0→3600
- L120–146: orbit play sweeps 0→3600 and **loops** `% 3600` (CRS-SS-01 accepted)

### `frontend/app/Celestial-2525/page.tsx`
- L1–6: thin wrapper → `CelestialReader` — **no dual Earth/Celestial clock yet**

### `docs/architecture-2525/CELESTIAL_SKY_SPEC.md`
- L32, L53, L124–125: UCRS / HU scrubber 0–3600
- L207–210: **CRS-SS-01** — continuous HU past 3600 DEFERRED; loop kept
- L213–214: **CRS-SS-02** — clock view 45° + perihelion top

### `docs/asks/2026-09-11_dollars_per_minute_universal_token_direction.md`
- L6, L15–16, L29–30: `$/second` in `A.B..3600` / `N.mmmm..ssss`; same grammar as UCRS; clock `at` = epoch ms zone-free

### `frontend/lib/celestial-guide-data.ts`
- Narrative “perihelion” in planet prose only — not a timing engine

### `frontend/lib/astro-moon.ts`
- Low-precision Moon model; distance terms for perigee/apogee; **no A.B..C / Base-3600 stamp**

### Tests
- `frontend/tests/celestial-*.mjs` — masters/packs/i18n/truth; truth imports PLANETS/MOON periods, **no 3600 converter golden tests yet**
- `frontend/tests/financial-mot.test.mjs` — strong MoT/calendar golden suite (reuse as model)

## Top inconsistencies (do not auto-fix)

1. **3600 as digit vs rollover:** UCRS HU scrubber and orbit-play treat 3600 as wrap-to-0; MoT prints `3600.0000..0000` as TRUE full and keeps `3600.3600..3600` as Equal predicate; abc-3600 digits are 0000–3599 with 3600 only as full-unit writing. CRS-SS-01 already deferred continuous accumulation.
2. **Earth period mismatch:** UCRS Earth `tDays=365.2422` vs MoT/Financial `365.259636` anomalistic. Dual-clock must pick one for Earth Celestial A.B..C (MoT law says anomalistic).
3. **Perihelion epoch drift:** `soi-calendar.ts` vs `financial-2525/calendar.ts` differ by 1 min (2024/2026) and 17 min (2028). Financial table is SOURCED + notes the discrepancy.
4. **Timezone doctrine clash:** Financial/MoT = Austin CST STANDARD **UTC−6 never daylight**; user t170u/t171u ask human-facing **America/Chicago (CST/CDT)**. Dual-clock Earth display needs a decision.
5. **`motABC` unit naming:** params named `*Sec` but `positionInYear` passes milliseconds; ratio-correct, naming leak.
6. **`fmt3600` vs `fmtABC`:** UCRS display zeros B/C (`.0..0`); financial glass uses real 4-digit B/C. Unifier UI should use `fmtABC`/`fmtMot`.
7. **Moon gap:** No anomalistic month (27.55455 d, NASA eclipse notes) or perigee-epoch table in UCRS; only sidereal/synodic. Heliocentric “shared Earth orbit” vs local perigee A.B..C both allowed — pick/document.
8. **Mars gap:** UCRS has sidereal 686.980 d; NASA GISS anomalistic year = **668.6147 sol**; perihelion calendar not in-repo (candidates: 2024-05-08, 2026-03-26, 2028-02-11 UTC from JPL-Horizons-derived public tables — cite before locking).
9. **calendar.ts header stale text:** still says “365 days = 3600 A” in places while code uses 365.259636.

## Decisions needed (user)

D1. Earth Celestial A.B..C: use MoT anomalistic 365.259636 + financial perihelion table (recommended) vs UCRS 365.2422?
D2. Human-facing Earth clock: America/Chicago with DST, or Austin CST STANDARD fixed UTC−6 (Financial doctrine)?
D3. Which perihelion table is canonical (retire soi-calendar seed or keep as SoI-only)?
D4. Moon Celestial stamp: anomalistic-from-perigee, shared-Earth-heliocentric HU, or both shown?
D5. Mars: lock anomalistic sols (GISS 668.6147) vs Earth-days 686.98; approve perihelion epoch sources before coding table.
D6. Dual-clock HU at exact full: show `3600.0000..0000` then roll, or wrap display to `0.0000..0000` (map play today)?

## Part 2 not started
- Shared converter extend of `lib/ucrs-2525.ts`
- Golden tests / dual-clock panel / CLI
- CRS + R-CORE ledger rows / PR merge / deploy

## Sources queued for Part 2 (cite in code; do not invent)
- Earth perihelion: `calendar.ts` PERIHELION + Espenak/Farmers' Almanac / EarthSky / APOD
- Earth anomalistic year: 365.259636 d (already in mot.ts)
- Mars sol: 88775.244 s (NASA GISS Mars24 / mot.ts)
- Mars anomalistic: 668.6147 sol (NASA GISS Mars24 notes)
- Moon anomalistic month: 27.55455 d (NASA GSFC eclipse “Moon's Orbit”)
- Mars perihelion dates: JPL Horizons–derived public table (e.g. 2026-03-26) — verify + cite before merge
