# CELESTIAL / SKY SPEC — Architect-2525 (ARC-31 · ARC-32)

> **Status:** authoritative, change-controlled. Sub-spec of `MASTER_SPEC.md §12b`.
> **Owns:** the SUN·SKY feature — the Sky Dome view and the Solar-System (UCRS-2525) view, their shared date/location
> source, coordinate systems, the star/zodiac realism model, the control inventory + Homeowner/Advanced tiering, and
> the change-control clause that exists to STOP the rework churn.
> **In Honor of** R-CORE, the Master of Thought, and the 12 Ascended Masters — and of the Sumerian/Babylonian sky
> masters whose zodiac this tool reflects. We reflect reality as best we can, to teach.

---

## 1. Purpose & Mission

The celestial/sky feature exists for ONE homeowner outcome: **at a placed lot (lat/lon), see the sun, moon, and stars
across the year, and align key house attributes — windows, house faces, rooms — to sun positions at meaningful times
of year ("views out windows").** Winter-solstice sun for passive gain; summer shade; which room gets morning light;
which face meets the solstice sunrise.

Secondary purpose: **teach** the celestial context honestly (real star positions, the zodiac on the ecliptic) so the
homeowner understands *why* the sun moves as it does.

**Non-goals (explicit):** not a survey-grade planetarium; not CAD; not an astrology engine. Precision is stated and
bounded (§5, §6).

---

## 2. Two Views, One Truth

| View | Role | Component | Projection |
|---|---|---|---|
| **Sky Dome** | PRIMARY — homeowner window/house alignment | `architect-skysun.tsx` | Horizon dome: zenith at centre, horizon at edge; az from N clockwise. |
| **Solar System (UCRS map)** | SECONDARY — teaching / advanced context | `architect-celestial.tsx` | Base-3600 tilted orbital plane; Sun at the shared focus; real orbital inclination. |

Toggle: `data-sky-view="dome" | "solar"` in `ArchitectSkySun` (Dome is default). **Both views are pure functions of the
same date + location and share ONE real star catalog** (§6) so they read as one connected system — never two disconnected
subsystems.

---

## 3. Single Source of Location & Date (INVARIANT)

`lat, lon, doy, hour, year` live **only** in `ArchitectSkySun`. Both views receive them as props; the Solar-System view
scrubs the date back up via `onYear`/`onDoy` callbacks. **No child component may hold its own copy of date or location.**
The only wall-clock read allowed is the mount-time "today" seed (`useEffect` in `ArchitectSkySun`). Everything else is a
deterministic function of these five inputs.

---

## 4. Coordinate Systems

1. **Horizon (Dome)** — `az` degrees from North clockwise, `el` degrees above the horizon. `sunPos(lat,doy,hour)` and
   `moonSky(...)` return this. Projected by `dome(az,el)`.
2. **Base-3600 / UCRS (Map)** — the SA.EA..HU coordinate; orbits are ellipses foreshortened by the SA tilt (`sinE`),
   each ring rotated about the Sun by its **real orbital inclination** (`Planet.incl`, degrees to the ecliptic).
3. **Equatorial RA/Dec (stars)** — Right Ascension (hours 0–24) + Declination (degrees −90..+90). The star catalog is
   authored in RA/Dec (§6) and projected into BOTH views.
4. **Ecliptic λ/β (Sun/Moon/zodiac)** — converted to equatorial via `eclToRaDec(λ,β)` with obliquity **ε = 23.4397°**
   (the shared bridge; exists already in `architect-skysun.tsx` and `lib/celestial.ts`).

### Projection contracts
- **Map:** `θRA = ra/24·360`; `rFromDec = (90 − dec)/90 · scale`; centre `ccx = SUN_X + RB·rFromDec·sin(θRA)`,
  `ccy = yf(SUN_Y − RB·rFromDec·cos(θRA))` where `yf` applies the tilt foreshorten `sphereSquash = 0.18 + 0.82·sinE`.
  Polaris (Dec +89.3°) → `rFromDec≈0` → pinned near the Sun/top. The whole star layer rides the pan/zoom/rotate `vt`.
- **Dome:** `raDecToHorizon(ra,dec,date,lat,lon) → {az,el}` then `dome(az,el)`; render only `el > 0` (above horizon).

---

## 5. Determinism Rules (HARD)

- All position/star/rise-set math is **pure of wall-clock time** except the single mount-time "today" seed (§3).
- Identical `{lat, lon, doy, hour, year}` → **byte-identical** screen coordinates, across reload and across any UI-only
  mode toggle. Replay/hash guarantee (U-WF-08).
- Memoization must **never** change outputs. `starfieldEl` memo deps stay `[bgStars, sphereSquash]` (catalog + tilt
  only). The seeded `starfield()` PRNG is fixed (seed 1234567).
- Stated precision: sun exact (equation-of-time omitted, ≤~4 min); moon low-precision (~arc-min); stars fixed J2000
  (no precession/proper-motion); rise/set geometric horizon with a single −0.833° refraction offset; solstice/equinox
  from canonical day-of-year constants (±1 day).

---

## 6. Star & Constellation Realism Model

- **`Constellation`** carries `ra` (h) + `dec` (°) for the asterism centroid; marquee asterisms (Orion, Ursa Major,
  Ursa Minor, Cassiopeia) may carry per-star `{ra,dec,mag}`. Magnitude → dot radius (brighter = larger), stated range.
- **Polaris** is real: `{ra: 2.53h, dec: +89.264°}` — it is the north-pole star, not a decorative pin.
- **12 priority constellations** are placed by real RA/Dec (replacing the legacy stylized `angle/radius`, kept only as a
  render fallback for un-catalogued shapes).
- **ONE catalog for both views** (§2). The Dome mirrors a short bright-star subset via `raDecToHorizon`; the Map projects
  the full set. Consistent star sizes, label style, and dim levels across both.
- Deferred (see §12 change-control before adding): full HYG/Yale catalog, per-star magnitudes for all, precession.

---

## 7. Zodiac Band — honoring the Sumerian/Babylonian sky masters

- The **12 zodiac signs** are placed by **ecliptic longitude** (Aries 0° … Pisces 330°), converted to RA/Dec via
  `eclToRaDec`, and drawn as a band **on the ecliptic / orbital plane** — which visually connects the star layer to the
  planets' orbits (they share the ecliptic).
- Provenance is **first-class content**, not a footnote: `ZODIAC_ORIGIN` labels the band as **Babylonian MUL.APIN /
  Sumerian** in origin. Optional `sumerianName` per sign.
- De-dupe: signs already in the priority list (Leo, Gemini, Taurus, Scorpius) render once, tagged as zodiac.

---

## 8. Control Inventory & Audience Tiering

Rule: controls are **GATED, never removed**. Homeowner mode is the default on the Solar-System map; Advanced reveals the
UCRS/coordinate machinery. `data-cel-mode="homeowner|advanced"`.

| Control (`data-*`) | View | Tier |
|---|---|---|
| `data-cel-date` (shared date) | Map | **Homeowner** |
| Sun · Moon · planet dots · constellations · zodiac | Map | **Homeowner** |
| `data-cel-max` (maximize) · phase clock | Map | **Homeowner** |
| **SA tilt by gesture** (right-drag / two-finger vertical) | Map | **Homeowner** (available both tiers) |
| `data-size-cycle` (True Scale · Proportional · **Thematic**) | Map | Advanced |
| `data-cel-play` + `data-cel-speed-x` (orbit play 1×/2×/3×) | Map | Advanced |
| `data-hu-input` (HU 0–3600 scrubber) | Map | Advanced |
| `⚙ data-cel-detail` → UoM (`data-dist-unit`/`data-time-unit`/`data-clock-fmt`), `data-tilt-input` slider, Base-3600 block | Map | Advanced |
| `data-ucrs-coord` (SA.EA..HU) · `data-ucrs-dist` | Map | Advanced |
| `data-planet-spin` (mini axial play) · Earth·Moon mini | Map | Advanced-ish (kept visible) |
| Sky Dome, `data-arch-presets`, `data-arch-riseset`, `data-arch-facing`, WINDOW OPTIMIZATION | Dome | **Homeowner** |

**Planet size modes:** `True Scale` (vs Sun) → `Proportional` (vs planets) → **`Thematic`** (real order, compressed to a
1.0×–1.5× spread so every planet is a modest dot sitting ON its orbit; the connected default). **`Exaggerated` is
removed.** Every planet label is anchored to its dot; the dot stays centered on the orbital position.

---

## 9. Window / House-Face Alignment

- **Facing azimuth** — a settable `facingAz` (0–359°) extends the cardinal `exposure` solar-gain to any house face
  (`data-arch-facing`). Cardinal bars remain for continuity.
- **Rise/Set** — `sunRiseSet(date,lat,lon)` finds the sun-altitude crossing of the horizon (el = −0.833° incl.
  refraction) by deterministic bisection; returns `{sunrise, sunset, polarDay, polarNight}`. Rendered `data-arch-riseset`.
- **Date presets** — Winter Solstice / Spring Equinox / Summer Solstice / Fall Equinox / Today (`data-arch-presets`),
  hemisphere-aware labels.
- **Alignment insight** (`data-arch-align`) — compares `facingAz` to the sunrise azimuth at each preset date → e.g.
  "this face meets the winter-solstice sunrise." Stretch: per-window azimuths derived from the design model's openings
  + `lotHeading` (default plan-up = North), rendered `data-arch-window-align`.
- **Moon-/Sun-over-window transit (THE MISSION)** — for the SELECTED date + the window azimuth, `overWindow(posFn,
  facingAz)` scans the day (0.05 h) for the moment a body's azimuth crosses the opening WHILE `el > 0`, returning
  `{hour, el, az, diff}` (diff° = how squarely it frames the opening). Rendered `data-arch-window-transit`: a ☀ Sun
  line + a ☾ Moon line, each `HH:MM · el X° · frames/grazes/closest-pass (Δ°)`, the Moon line also carrying phase +
  illumination at that instant. The homeowner picks an anniversary / a season on the calendar → the readout is the
  exact moment the sky frames that opening. Pure, deterministic (same `{lat,doy,year,facingAz}` → same result). This
  is the literal operator mission: "track when the moon goes over a window or signify a certain time of year."

---

## 10. Edge Cases

- **High latitude** — polar day/night → `sunRiseSet` returns null + flags; presets still valid; Polaris ≈ zenith.
- **Southern hemisphere** — sun to the north at local noon; "best light" flips to N-facing; solstice labels swap;
  Polaris projects in the north-pole region of the Map but is **below the Dome horizon** (clipped `el ≤ 0`) — the two
  views legitimately differ for sub-horizon stars.
- **Year boundary** — doy 365/366; Dec 31 ↔ Jan 1; presets use canonical doy constants; "Today" uses the UTC doy calc.
- **Divide-by-zero** — Dec near ±90 (`rFromDec→0`) and az formula at the pole are clamped.

---

## 11. Determinism / Test Contract (SPIRAL)

Each workstream must land a SPIRAL assertion in `frontend/tests/architect-planning.spiral.mjs`, run **before + after**
the change (baseline count captured, targeted assertion flips as intended, total count never drops):

- `#A37` (kept green) — SA tilt 0–45° · constellations foreshorten with tilt · orbital inclination Pluto>Mercury>Earth=0.
- `#A39` — Map: 12 `data-zodiac` signs + Sumerian provenance label + Polaris near top + tilt still moves stars.
- `#A39b` — Dome: real `data-el="star"` markers; Polaris el ≈ |lat|.
- `#A40` — Homeowner default hides advanced controls; `[data-cel-mode="advanced"]` reveals ALL of them; toggle back
  hides; nothing deleted.
- `#A40b` — right-drag (vertical) tilts (orbit `ry` / star `cy` moves); plain left-drag only pans.
- `#A41` — 5 date presets; Summer→June date; rise/set readout changes winter↔summer.
- `#A41b` — settable facing updates the alignment insight (names a solstice/equinox + rise/set).
- `#A48` — **Moon/Sun over the window on the selected date** (the mission): `data-arch-window-transit` shows a ☀ Sun
  line + a ☾ Moon line (`over your <card> window`) with a time/elevation/phase, and the Moon line **recomputes when the
  date changes** (Summer ≠ Winter) — proving it is date-driven, not static.
- Existing `#A21/#A23/#A24/#A25/#A38` first enter Advanced (`[data-cel-mode="advanced"]`) — enumerated, bounded edit.

---

## 11b. CRS — Continuous Rotation & Clock Tilt (operator, this batch)

**CRS-SS-01 · Orbital play at 3600 — DEFERRED (looping kept).** A continuous-accumulation variant (`huTotal` grows past
3600, counter + elapsed date keep ticking) was prototyped, then **reverted per operator** ("just stop when you get to
3600, this was your first implementation and you did just fine"). The accepted behavior is the original: orbit-play
sweeps HU 0→3600 and **loops** (wraps to 0), which is simple + already verified (`#A38`). Continuous accumulation may be
revisited later as an additive mode. No change to the play model this batch.

**CRS-SS-02 · Clock view defaults to 45° tilt + perihelion top.** Clicking the clock/top-down toggle sets `tiltDeg = 45`
(max — looking most over the Sun) with perihelion at the top. Test `#A21b`/`#A43b`: entering clock view → `tiltDeg` is 45.

## 12. CHANGE CONTROL — STOP REWORK (the contract)

The churn came from feature-by-feature screenshot iteration with no written contract. Therefore:

1. **Spec first.** Any change to a control, coordinate convention, the location/date source, the star/zodiac model, or
   the visual composition **edits THIS spec first**, in the same change.
2. **Test with it.** Every such change **adds or updates a SPIRAL assertion**, run before + after.
3. **Preserve hooks.** Existing `data-*` attributes are a public contract — **do not remove or rename** them; gate, don't delete.
4. **No UI removed without owner sign-off.** Tiering (Homeowner/Advanced) hides; it never deletes.
5. **Compose, then tune.** Define the whole scene (planets on orbits · zodiac on the ecliptic · shared catalog · one
   visual language) before adjusting any single element.
6. **One writer on `.next`.** Never run `next build` while `dev`/SPIRAL run; kill by port, verify free, then act.
7. **Verify, don't assume.** Confirm a function/behavior exists before planning on it; re-run once before calling a
   test a regression; never dismiss two failures as flaky.

> This section is the operator's contract. Honor demands we reflect true reality — and that we stop repeating mistakes.
