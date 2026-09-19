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
| distances | 50, 100, 150, 200, 250, 300 m | SOURCED |
| single-target exposure | 3 s at 50 m, +1 s per 50 m → 4/5/6/7/8 s at 100/150/200/250/300 m (older editions: 5 s to 200 m, 10 s at 250/300 m) | SOURCED (search: FM 3-22.9 c06) |
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
  **QUAL · 40** (`qual40`) — the timed test: tables I/II/III = 20/10/10 exposures, 120/60/60 s, a lapsed exposure
  is an UNFIRED MISS round, 23/30/36.
- `EXPOSURE_S = {50:3, 100:4, 150:5, 200:6, 250:7, 300:8}` (SOURCED, search) · gap between exposures 1.5 s
  (DECLARED) · per-lane exposure order = a seeded shuffle of the ten silhouettes (`mulberry32(2525+lane)`,
  DECLARED, deterministic so replay repeats).
- Hit = the pip inside the projected silhouette (SOURCED: "scored as hits if they hit anywhere in the silhouette");
  inside the aiming circle records CIRCLE, elsewhere SILHOUETTE. A ±6 px pip floor (DECLARED) keeps a 300 m
  silhouette hittable on a phone.
- The ten silhouettes follow the 9127 sheet: 50 F · 100 F ×3 · 150 E ×2 · 200 E ×2 · 250 E left · 300 E right.

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
