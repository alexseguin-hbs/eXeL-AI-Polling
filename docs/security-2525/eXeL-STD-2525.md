# eXeL-STD-2525 — Symbology Specification

> SECURITY-2525 symbology standard. Doctrine base: **MIL-STD-2525C/D + NATO APP-6** (verified
> 2026-07-06 against MIL-STD-2525D, Carmenta 2525C Appendix A, ADP 1-02, Esri/milsymbol
> reference renderers — sources at bottom). eXeL-STD-2525 = doctrine-accurate core + eXeL
> extensions (wireframe silhouettes, swarm echelon, sim animation layers).
> Training-simulation UI with generic/simulated data only.

## 1. Affiliation Frame Law (doctrine-verified)

The FRAME communicates affiliation before the icon is read. Shape is co-primary with color
(must survive monochrome / low-light / compressed displays).

| Affiliation | Land UNIT | Land EQUIPMENT | Air / Space | Sea Surface | Subsurface |
|---|---|---|---|---|---|
| **Friendly** | Rectangle (1.5:1) | **Circle** | Arc, open bottom ("dome") | Circle | Arc, open top |
| **Hostile** | Diamond | Diamond | Top-half diamond, open bottom | Diamond | Bottom-half diamond, open top |
| **Neutral** | Square | Square | Bracket ⊓, open bottom | Square | Bracket ⊔, open top |
| **Unknown** | Quatrefoil (4-lobe clover) | Quatrefoil | 3-lobe, open bottom | Quatrefoil | 3-lobe, open top |

Rules of thumb:
- Closed frames = land + sea surface; open-bottom = air/space; open-top = subsurface.
- **Unit vs equipment matters:** a Patriot *battery* (unit) = blue rectangle; a Patriot
  *launcher* (equipment) = blue circle.
- **ENY fallback (monochrome):** if red unavailable, hostile graphics drawn in black with
  **"ENY" placed in at least two places** (ADP 1-02). Unframed hostile icons get "EN" at
  lower right. Hand-drawn monochrome hostile frames are double-lined.

## 2. Color Law (doctrine hex values, MIL-STD-2525D color tables)

| Affiliation | Light (fill) | Medium (frame/stroke, dark bg) | Dark (frame/stroke, light bg) |
|---|---|---|---|
| Friendly | Crystal Blue `#80E0FF` | `#00A8DC` | `#006B8C` |
| Hostile | Salmon `#FF8080` | `#FF3031` | `#C80000` |
| Neutral | Bamboo `#AAFFAA` | `#00E26E` | `#00A000` |
| Unknown | Light Yellow `#FFFF80` | `#FFFF00` | `#E1DC00` |
| Civilian | `#FFA1FF` | `#800080` | `#500050` |

**eXeL rendering law (R-CORE aligned):** current command-UX palette (friendly `#38bdf8`,
hostile `#ef4444`) is the eXeL dark-theme operational set; doctrine Medium values are the
strict-2525 mode. RED-CHANNEL DISCIPLINE: red reserved for hostile frames, political /
operational boundaries, and critical warnings. Selected = gold; elevation/AGL emphasis =
gold, flipping to red only on risk trigger. Focus outline = user-set orange (hybrid
red/orange locked).

## 3. Internal Icon Law (doctrine-verified glyphs)

| Function | Glyph | Notes |
|---|---|---|
| Infantry | X saltire spanning frame | "crossed bandoliers" |
| Armor | Horizontal ellipse | "tank treads" |
| Artillery | Filled dot (cannonball) | centered |
| **Air defense** | Upward arc anchored at bottom corners | the "protective dome/umbrella" |
| AD missile unit | Dome + vertical missile shape | light/med/heavy by amplifier |
| Anti-tank | Chevron ∧, legs to bottom corners | piercing action |
| **Recon / cavalry** | ONE diagonal slash, lower-left → upper-right | NEVER a letter "R" |
| Engineer | "E" rotated 90°, prongs UP | stylized bridge |
| Medical | Cross spanning frame | |
| HQ / command post | Staff line down from bottom-LEFT corner | staff tip = actual HQ position |
| **Radar (equipment)** | Zig-zag "lightning" arrow | EM-emission glyph — NOT radiating arcs |
| Fixed-wing UAV | Flying-wing / batwing silhouette | air track `S*A*MFQ---` |

Radiating "Wi-Fi squiggle" arcs on emitters (Sentinel etc.) are an **eXeL sim-animation
layer** — permitted in the UI, never presented as 2525 doctrine.

## 4. Amplifiers — echelon, quantity, swarms

- **Echelon (units only), marks above frame:** Ø team · ● squad · ●● section · ●●● platoon ·
  | company · || battalion · ||| regiment · X brigade · XX division · XXX corps · XXXX army.
- **Quantity (equipment):** 2525D amplifier **C** — a number ABOVE the equipment symbol
  ("6" above a drone symbol = 6 airframes). Echelon dots are NOT used for equipment.
- **Swarms:** no dedicated 2525 symbol exists. eXeL extension: **3-ship echelon glyph**
  (lead high + two trailing wingmen) for count > 1, optionally paired with the doctrine
  count-above amplifier. Implemented for X-BAT in `asset-icons.tsx` (`AssetIcon count`).

## 5. Asset Catalog — physical wireframe cues + SIDC

SIDC = MIL-STD-2525C 15-char (`*` = affiliation/status; friendly present = `SFGP…`).
Name label rendered beside symbol (standard TOC practice).

| Asset | Wireframe cues | SIDC + composition | Role |
|---|---|---|---|
| **THAAD** | M1075 10-wheel truck, slant-raised 2×4 canister pack | `S*G*EWMAT-` circle + dome + missile, "THAAD"; battery `S*G*UCDMH-` | Upper-tier terminal BMD |
| **Patriot MIM-104** | Towed trailer, slant box of 4 (PAC-2) / 16 (PAC-3) canisters | `S*G*EWMAL-` "PATRIOT"; battery `S*G*UCDMM-/H-` | Lower-tier area defense + anti-TBM |
| **M-SHORAD "Sgt Stout"** | Stryker 8×8 + RIWP turret: Stinger pod + 30mm XM914 + 4 RADA panels | `S*G*EWMAS-` "SGT STOUT"; unit `S*G*UCDS--` | Maneuver SHORAD |
| **Avenger AN/TWQ-1** | HMMWV, rotating turret, twin 4-tube Stinger pods in a V | `S*G*EWMAS-` "AVENGER" | SHORAD / point defense |
| **AN/MPQ-64 Sentinel** | Flat square phased-array panel tilted back on rotating pedestal, towed 2-wheel trailer | `S*G*ESR---` circle + zig-zag lightning arrow, "SENTINEL" | Radar — cues SHORAD/NASAMS/C-RAM |
| **AN/TPY-2** | Very large tilted array slab + cooling/electronics/generator trailers | `S*G*ESR---` "TPY-2" | Radar — BMD surveillance / THAAD FC |
| **C-RAM / LPWS** | 20mm six-barrel Gatling under white dome radome, trailer-mounted | `S*G*EWA---` (AD gun: dome over vertical gun line), "C-RAM" | Point defense vs RAM + UAS |
| **NASAMS** | 3 towed box launchers × 6 slant AMRAAM canisters + Sentinel + FDC van | `S*G*EWMAS-/I-` "NASAMS" | Short/medium point-area defense |
| **Coyote / LIDS (C-UAS)** | Tube-launched mini turbojet interceptor, strakes + 4 flip-out fins; multi-tube box launcher; KuRFS radar | launcher `S*G*EWMAS-` "COYOTE"; KuRFS `S*G*ESR---` | Counter-UAS interceptor |
| **X-BAT (eXeL)** | 3rd-pass wireframe: `docs/security-2525/xbat-wireframe/` — projected front view in `asset-icons.tsx` | hostile air frame + UCAV silhouette; swarm = 3-ship echelon + count | OPFOR UCAV / swarm threat |

Future UCRS-2525 plotted assets (same pattern, not yet drawn): jets, bombers, submarines,
surface combatants, rotary wing, space assets.

## 6. Overlay Law (MGRS wireframe integration)

Symbols are **overlays** — never part of the terrain mesh.
- Terrain: green wire = land · blue wire = water surface · cyan dashed = bathymetry/subsurface ·
  red solid = boundary/shoreline/critical warning · dim white = MGRS/UTM grid · gold = selected.
- Symbol layer sits above terrain; each symbol carries a metadata packet: symbol ID,
  affiliation, entity type, icon, lat/lon, DMS, UTM zone/easting/northing, MGRS, elevation m,
  AGL, confidence, source dataset, timestamp, classification, export policy, replay ID.
- Renderer NEVER decides affiliation — it comes from trusted input, operator entry, scenario
  config, or the controlled simulation layer.
- Build order: affiliation → frame → icon → location → elevation → coordinate conversions →
  source/classification metadata → render overlay.

## 7. Security / Export Modes

| Mode | Symbols allowed |
|---|---|
| Public | Generic training symbols only |
| Training | Simulated friendly/hostile/neutral/unknown |
| Internal | Controlled scenario symbols |
| Restricted | Sensitive symbols only where layer policy allows |
| Certified export | **Blocked** if symbol source, classification, or export policy unknown |

Never mix live sensitive tactical data with public export mode.

## Sources

1. MIL-STD-2525D — http://www.mapsymbs.com/MilStd2525D.pdf
2. MIL-STD-2525C — https://worldwind.arc.nasa.gov/milstd2525c/Mil-STD-2525C.pdf
3. Carmenta 2525C Appendix A (SIDC list) — https://docs.carmenta.com/pages/milstd2525c_appendix_a.html
4. NATO Joint Military Symbology — https://en.wikipedia.org/wiki/NATO_Joint_Military_Symbology
5. Esri 2525D color tables — https://github.com/Esri/dictionary-renderer-toolkit/blob/master/docs/assign_color_by_team_for_MIL-STD-2525D.md
6. spatialillusions/milsymbol (2525E reference renderer) — https://github.com/spatialillusions/milsymbol
7. ADP 1-02 Terms and Military Symbols — https://irp.fas.org/doddir/army/adp1_02.pdf
8. MGRS-Mapper symbol guides — https://mgrs-mapper.com/blog/military_symbols_fundamentals/
9. DTIC ADA484484 (Crystal Blue naming) — https://apps.dtic.mil/sti/tr/pdf/ADA484484.pdf
10. Sgt Stout — https://www.army.mil/article/277091/ · NASAMS — https://en.wikipedia.org/wiki/NASAMS · Coyote — https://en.wikipedia.org/wiki/Raytheon_Coyote

**Caveats:** neutral-medium green has a one-channel source discrepancy (`#00E26E` milsymbol
vs `#00E200` Esri) — milsymbol taken as authoritative; friendly-rectangle 1.5:1 ratio
confirmed from reference-renderer geometry, not a quoted line of the standard; for
pixel-accurate doctrine glyphs render SIDCs via milsymbol rather than hand-authoring.
