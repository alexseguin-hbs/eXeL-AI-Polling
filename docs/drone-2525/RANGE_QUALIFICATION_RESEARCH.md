# Range qualification research — what the Drone-2525 range copies, and from where (2026-09-19)

Operator ask (docs/asks/2026-09-19_range_popups.md): "research online army qualification range; ensure we have 3
modes: Training - Reset, Training - Down, Qual - 40. Targets reset after they go down, targets stay down, or we
enter timed test." Searched from the sandbox (WebSearch); page fetches to globalsecurity.org are blocked by the
egress proxy, so the exposure numbers below are as returned by the search index for FM 3-22.9 chapter 6 and are
labelled SOURCED (search) rather than SOURCED (page read). Anything the deck sets that no source states is DECLARED.

## The paper reference the operator sent
Rite in the Rain 9127 — "M16A1 SERIES TARGET · 25-METERS · ALTERNATE COURSE 'C' RECORD FIRE QUALIFICATION": ten
silhouettes scaled to read as 50 M (1), 100 M (3), 150 M (2), 200 M (2), 250 M (1, upper left), 300 M (1, upper
right); "the white dot on each target shows the center of mass aiming point. Bullets should hit within the circle,
but are scored as hits if they hit anywhere in the silhouette." Carried beside the ask as
`docs/asks/2026-09-19_range_popups_altc_sheet.png`.

## Record fire on a pop-up range (FM 3-22.9, chapter 6 — Field Fire / Record Fire)
| item | value | status |
|---|---|---|
| targets engaged | 40 | SOURCED (search: FM 3-22.9 c06; army.mil 232139; sandboxx) |
| positions / rounds | 20 prone supported (foxhole), 10 prone unsupported, 10 kneeling — the deck's tables I/II/III | SOURCED (search: FM 3-22.9 c06) |
| distances | 50, 100, 150, 200, 250, 300 m | SOURCED (the 9127 sheet itself; search: FM 3-22.9 c06) |
| single-target exposure | 3 s at 50 m, +1 s per 50 m → 4/5/6/7/8 s at 100/150/200/250/300 m | DECLARED — taken from a search-index summary of FM 3-22.9 c06 that also quoted older editions as 5 s to 200 m and 10 s at 250/300 m; no FM page could be fetched from the sandbox (fleet lens 11B: a constructed ramp is not SOURCED) |
| scores | 23–29 MARKSMAN · 30–35 SHARPSHOOTER · 36–40 EXPERT · below 23 unqualified | SOURCED (search: army.mil 232139; armytimes 2019-12-29) |
| target not engaged in its exposure | counted as a miss (the deck: UNFIRED MISS) | SOURCED (search: FM 3-22.9 c06, "targets not engaged are scored as misses") |
| new qualification (TC 3-20.40, 2020) | still 40 targets and 23/30/36; positions re-ordered (standing → prone unsupported → prone supported → kneeling), magazine changes under time; not adopted here — the range keeps the three-table record fire the deck already scores | SOURCED (search: armytimes; army.mil 237739) — DECLARED not adopted |

## Pop-up target mechanisms (RETS / SIT)
The Army actuates pop-up targets by computer (RETS / E-RETS); "when munitions or debris strike a target, impact
sensors reset the target into a defilade position and the computer registers a hit" (search: FM 17-12-7 ch10;
Inveris SIT / MF-SIT; Range Systems Pro-SIT). Ranges run lanes; each lane has its own set of targets at the
distances above. That is the operator's "each lane has pop ups at various distances".

## What the deck does with it (r.130)
- Three modes, the operator's names, on the existing `rangeMode` values:
  **TRAINING · RESET** (`bounce`) — a target that goes down comes back up on its next exposure;
  **TRAINING · DOWN** (`stay`) — a target that goes down stays down until RESET;
  **QUAL · 40** (`qual40`) — the timed test: tables I/II/III = 20/10/10 exposures; table clocks **142/75/75 s** (DECLARED, r.131:
  exposures avg 5.2 s + 1.5 s gaps + slack — r.130's 120/60/60 could not fit their own exposures); a lapsed exposure is an
  UNFIRED MISS round; one round per exposure; 23/30/36. **Per-plate scoring caps** (DECLARED, inherited from the deck's
  r.122 tables, no doctrine source): table I 2 hits per plate, table II 1, table III 2 at 50/100, 1 at 150, 0 beyond — and
  from r.131 a table exposes only plates it can score, so 40/40 is attainable. `EXPOSURE_S` falls back to 5 s for any
  distance not in the table (DECLARED).
- `EXPOSURE_S = {50:3, 100:4, 150:5, 200:6, 250:7, 300:8}` (DECLARED from a search-index summary, see above) · gap between
  exposures 1.5 s (DECLARED; it decides whether a table is completable) · per-lane exposure order = a seeded shuffle of the ten silhouettes (`mulberry32(2525+lane)`,
  DECLARED, deterministic so replay repeats).
- Hit = the pip inside the projected silhouette (SOURCED: "scored as hits if they hit anywhere in the silhouette");
  inside the aiming circle records CIRCLE, elsewhere SILHOUETTE. The pip floor is ANGULAR from r.131 — 3 mrad, minimum
  3 px (DECLARED) — so the standard is the same at every zoom and screen size (r.130's 6 px floor was not).
- The ten silhouettes follow the 9127 sheet: 50 F · 100 F ×3 · 150 E ×2 · 200 E ×2 · 250 E left · 300 E right.

## The program of record — Army IWQ Table VI, 40-round day fire (operator-supplied 2026-09-23; r.137)
Source: the operator, verbatim in `docs/asks/2026-09-23_range_modes_iwq_table_vi.md` (sha256 in the sidecar). This supersedes the
r.130 by-distance exposures and the three 20/10/10 tables above, which were DECLARED from a search index and never sourced.

| item | value | status |
|---|---|---|
| structure | 18 engagements in 4 phases: standing → prone unsupported (1–5), prone supported (6–10), kneeling supported (11–14), standing supported (15–18) | SOURCED (operator) |
| engagements 1–14 | 50 R · 100 · 150 · 50/150/200 · 150/200/250/300 · 100 · 150/300 · 200/300 · 250/300 · 150/250/300 · 50/100/200 · 50/200 · 150/250 · 100/150/200 | SOURCED (operator, verbatim) |
| engagements 15–18 | 50/200 · 100/150/250 · 100/200 · 50/100/250 — a mix that consumes exactly the remaining 50×2 · 100×3 · 150×1 · 200×2 · 250×2 | DECLARED (operator: "can differ a little by range computer file — confirm the lane program with the tower") |
| exposure by count | 1 target 5 s · 2 targets 8 s · 3 targets 12 s · 4 targets 16 s (`EXPOSURE_BY_COUNT`) | SOURCED (operator) |
| between engagements | ~3 s down (`ENG_GAP_S = 3`) | SOURCED (operator) |
| between phases | ~8–10 s, mag change + move (`PHASE_GAP_S = 9`) | DECLARED midpoint of the operator's range |
| rounds | one round per silhouette; a target not engaged in its window is a miss (UNFIRED MISS) | SOURCED (operator; FM 3-22.9 "targets not engaged are scored as misses") |
| targets | 40 = 50×6 · 100×7 · 150×8 · 200×8 · 250×6 · 300×5 | SOURCED (operator) — the deck's `IWQ_PROGRAM_IS_40` row and `tests/range-2525.test.mjs` assert these counts |
| 50 m | targets left and right; the 50 R standing shot is first | SOURCED (operator) — `C-50L` added, `C-50` is the 50 R |
| which sibling stands (L/C/R at 100, L/R at 150 and 200) | seeded per lane from the deck's PRNG so lanes differ; the same on both phones of a room | DECLARED |
| order within an engagement | "shoot near to far" — advisory (LOCK prefers the nearest standing target); not scored | SOURCED (operator) as advice, DECLARED as not scored |
| badge | 23 MARKSMAN · 30 SHARPSHOOTER · 36 EXPERT (unchanged) | SOURCED (above) |

### The training modes (operator 2026-09-23, r.137)
- **TRAINING · RESET** ("Target Up"): every target is up; a hit target falls and comes back after `RETURN_S = 3` s (DECLARED — the same ~3 s).
- **TRAINING · DOWN**: every target is up; a hit target stays down until RESET; when all are down the strip says ALL DOWN · PRESS RESET.
- Training has no exposure clock, so nothing lapses in training; LAPSE rows exist only in QUAL · 40.

## Silhouette sizes, magazines and the optic (r.138, operator 2026-09-23 + his two DVIDS photographs)
| item | value | status |
|---|---|---|
| E-type silhouette | 19.5" × 40" = 0.495 × 1.016 m | SOURCED (Range Systems E-type plastic target sheet; Wikimedia "NATO E-type Silhouette Target") |
| F-type silhouette | 19.5" × 20" = 0.495 × 0.508 m | DECLARED (the E-type's family; a sheet was not fetched from the sandbox) |
| what a shooter sees | a 300 m E is 1.6 px tall at 1× on a 390 × 844 phone, a 50 m F 5.7 px; the r.131 angular pip floor (3 mrad, min 3 px) keeps them hittable | DECLARED (the photographs: targets are small on the berms) |
| magazines in IWQ Table VI | four magazines of ten; a change at each position, 8–10 s to move and change | SOURCED (sandboxx; iwtsexplained Table VI; usar.mil IWQ) |
| magazines in training / on every craft | 30 rounds, reload any time | OPERATOR (2026-09-23) |
| optic | turret 3× in qualification, 30× in training; every drone, aircraft, robot and boat 30× optical | OPERATOR (2026-09-23) |
| labels | left targets read to the left, right targets to the right, centre above; same side stacked | OPERATOR (2026-09-23) |
| 75 m | no 75 m target (the operator: a typo) | OPERATOR |

## The dark green plates and the 25 m Alt-C sheet (r.140, operator 2026-09-23)
| item | value | status |
|---|---|---|
| F-type silhouette (prone / kneeling, the wide shouldered plate) | 26" × 21" = 0.660 × 0.533 m, NSN 6920-00-071-4589, OD green polyethylene | SOURCED (NCSS "Plastic Silhouette Target, Green, Prone Position, 26″ x 21″"; Action Target F-Type; ArmyProperty NSN listing) — r.138's 19.5" × 20" was DECLARED and is corrected |
| E-type silhouette | 19.5" × 40" = 0.495 × 1.016 m, NSN 6920-00-071-4780 | SOURCED (Range Systems E-type sheet) |
| 25 m Alt-C sheet | 17" × 22" (0.4318 × 0.5588 m), M16A1 / 25 m Alternate Course C record fire; ten scaled silhouettes: 250 and 300 top corners, 200 × 2, 150 left/right, 100 × 3, 50 bottom centre | SOURCED (Rite in the Rain 9127; Qualification Targets Inc.; edisastersystems 17 × 22) |
| scaling on the sheet | each silhouette scaled by 25 / range so it subtends the real target's angle; the deck measures the on-screen height against the pop-up at its range (0.0 % worst) | SOURCED (the sheet's purpose) + MEASURED (QA `SHEET_SCALES_TO_ANGLE`) |
| sheet height above the lane | bottom edge 1.1 m (a target frame at chest height) | DECLARED |
| paper | never falls: a hit is a hole; TRAINING · DOWN scores a hit silhouette out; QUAL · 40 = the same 18-engagement program on the sheet | DECLARED from the sheet's use (Alt-C record fire is a timed course on the same sheet) |

## Life-size at 12 inches (r.141, operator 2026-09-23)
| item | value | status |
|---|---|---|
| viewing distance | 12 in from the eye | OPERATOR |
| device | iPhone 12 Pro Max: 6.7 in diagonal, 2778 × 1284 px, 926 × 428 CSS px → 6.08 in tall → 152.3 CSS px/in | SOURCED (Apple tech specs) — DECLARED for other phones |
| focal length at 1× | 12 in × 152.3 px/in = 1827.6 CSS px (the eye distance in CSS px; independent of the screen size) | DERIVED |
| what it means | a 50 m F (26 in wide) is 24 px wide at 1×; a 300 m E (40 in tall) is 6 px; the 3 mrad pip floor is 5.5 px | MEASURED (QA `EYE_SCALE_12_IN`, `SILHOUETTES_TRUE_SCALE`) |
| the 50 m pair | ±4.6 m: on the edges of a 390–430 px portrait phone at 50 m (±5.3–5.9 m visible) | DECLARED |
| correction | r.130–r.140 projected with a typed 38° half-angle (a 76° vertical field): the targets were drawn true-size into a field three times too wide | on the record |

## Sources (search index; links as returned)
- FM 3-22.9 ch.6 Field Fire — https://www.globalsecurity.org/military/library/policy/army/fm/3-22-9/c06.htm
- FM 3-22.9 ch.7 Advanced Rifle Marksmanship — https://www.globalsecurity.org/military/library/policy/army/fm/3-22-9/c07.htm
- Army: Soldiers take a shot at Army's new marksmanship qualification — https://www.army.mil/article/232139/
- Army: West Point cadets conduct new Army Rifle Qualification Test — https://www.army.mil/article/237739/
- Army Times 2019-12-29: Army revamps rifle qualifications — https://www.armytimes.com/news/your-army/2019/12/29/new-in-2020-army-revamps-rifle-qualifications-and-small-arms-training/
- Sandboxx: the new Army Rifle Qualification Test — https://www.sandboxx.us/blog/everything-you-need-to-know-about-the-new-army-rifle-qualification-test/
- GAT Daily: TC 3-20.40 changes — https://gatdaily.com/articles/the-army-updates-individual-weapons-qualification-tc-3-20-40/
- ARI report ADA523973 (rifle marksmanship) — https://apps.dtic.mil/sti/pdfs/ADA523973.pdf
- FM 17-12-7 ch.10 Targets and Target Mechanisms (RETS) — https://www.globalsecurity.org/military/library/policy/army/fm/17-12-7/ch10.htm
- Inveris Stationary Infantry Target — https://www.inveristraining.com/live-fire-training/military/stationary-infantry-target-sit/
- Range Systems Pro-SIT — https://www.range-systems.com/military/pro-sit-stationary-infantry-target/
