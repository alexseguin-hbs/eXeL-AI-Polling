# Vision-2525 Reuse Catalog

> Shared capabilities & style choices across the Vision-2525 domains (Security · Architect · Health ·
> Education · Manta/Drone-2525). Currently seeded from Security-2525 (the most mature domain) → Architect-2525.

Capabilities and style choices proven in **Security-2525** (`components/security-2525/`) that Architect-2525
already reuses or should reuse next. The goal: every reusable capability becomes a shared `2525-core` primitive so
Architect · Health · Education · Manta/Drone-2525 inherit it instead of duplicating.

Legend: ✅ already reused in Architect · ◻️ candidate (not yet lifted) · 🔷 promote to `2525-core`.

## Interaction capabilities

| Capability | Security-2525 source | Status in Architect | Notes |
|---|---|---|---|
| **Globe drag (orbit camera)** | `mission-planning.tsx` GlobeView `onPointerDown/Move/Up` | ✅ `mini-globe.tsx`, `textured-globe.tsx` | L-drag spin+tilt · R-drag roll. |
| **Pinch-zoom + two-finger twist-rotate + pan** | `mission-planning.tsx` `touch`+`pinch` refs (`~L623`, `L771-825`) | ✅ celestial map (`architect-celestial.tsx` `gestureHandlers`) · ✅ `textured-globe.tsx` (pinch-zoom) | Google-Earth 2-finger model; wheel zoom via non-passive listener. |
| **Wheel zoom (non-passive)** | `useWheel` hook (`L660`) | ✅ celestial + textured globe | `addEventListener("wheel", …, {passive:false})` to `preventDefault`. |
| **Full-screen "big map"** | `fsPane` maximize (`mission-planning.tsx`) | ✅ celestial maximize → fills viewport, readout hidden | zoom into an orbit + rotate. |
| **Draggable ⠿ mini-map panel** (fixed-after-drag · dock-back · resize ◢) | `mission-planning.tsx` `onMiniGripDown` + edge handles (`L5718-5767`) | ✅ `mini-panel.tsx` (MiniPanel) | 🔷 promote to 2525-core. |
| **"•••" edge/advanced expander** | `Toggle3` dots (`security-2525/command-ux1.tsx L93-101`) · `Dots3` (`mission-planning.tsx L1390`) | ✅ `••• Advanced` per-tab (CoreExpander) | Security uses boolean rail-collapse; Architect uses persisted CoreExpander + "•••" glyph. |

## Data / model capabilities

| Capability | Source | Status | Notes |
|---|---|---|---|
| **R-CORE capability lanes** (COMM·EDGE·SYNC·LINK·UCRS) | `security-2525/rcore.ts` `RCORE_LANES` | ✅ shell ribbon + MiniPanel | shared import, single source. |
| **GeoLabel constant-screen-size** law | `security-2525` GeoLabel primitive | ✅ Architect map labels | labels don't scale with zoom. |
| **Natural-Earth borders** (vector coastlines/countries) | `/security-2525/borders-ne50m.json` | ✅ `mini-globe.tsx` (Earth) | 518KB, module-cached. |
| **Corner-voxel / MGRS site framing** | `security-2525` mgrs | ✅ SUN·SKY 4-corner lot | one lat/lon → structure·sun·moon·terrain. |
| **Replay engine / timeline** | `security-2525` replay | ◻️ Architect ReplayPanel exists | 🔷 unify under 2525-core replay. |

## Style tokens (Vision-2525 palette)

| Token | Value | Where |
|---|---|---|
| Accent (Security) | cyan `#19c8cf` | Toggle3 dots · MiniPanel border · zoom badge |
| Accent (Architect · Design primary) | **cyan `#19c8cf`** (Mission-Planning parity, 2026-07-17) | Vision Tree · Alvar · map tools · master key · Advanced ••• dots |
| Accent (Architect · Trinity/HI) | violet `#c084fc` (`C.violet`) | HI/AI·Vision · Trinity glyphs · retained where semantic |
| Active pill bg | `#221833` | nav/subnav active |
| Panel bg | `#111826` (`C.panel`) | cards, panels |
| Border | `#1e2b3a` (`C.border`) | all frames |
| Collapsed rail width | `56px` (expanded `260px`) | Security edge rails — 🔷 reuse for Architect rails |

## New Architect primitives worth promoting to 2525-core (this batch)

- **`TexturedGlobe`** (`components/architect-2525/textured-globe.tsx`) — Canvas equirectangular→orthographic sphere,
  bilinear sampling, day/night terminator, drag-rotate + wheel/pinch zoom, progressive `srcHi` detail. Domain-neutral.
- **`MiniPanel`** (`components/architect-2525/mini-panel.tsx`) — ⠿ drag + maximize + collapse + R-CORE lanes + resize ◢.
- **`astro-moon.ts`** (`lib/astro-moon.ts`) — shared low-precision lunar model (ecliptic position · distance · phase),
  single source of truth for the Sky Dome, the Earth+Moon mini view, and the celestial map.
- **`ucrs-2525.ts`** — Base-3600 planetary math + real orbital periods (perihelion→perihelion) + rotation periods
  (retrograde-aware) + texture map registry.

## New Vision-2525 shared primitives — Design-tab batch (2026-07-17)

| Primitive | Source | Reuse | Notes |
|---|---|---|---|
| **13-colour SoI-Trinity palette** | `lib/trinity-colors.ts` `TRINITY_13` | any domain | anchored ◬cyan · ♡sunset · 웃violet + 10 bridging hues; `trinityHex(i)`. |
| **Alvar iconology** | `lib/alvar-logos.ts` + `alvar-mark.tsx` + `public/architect/alvar*.png` | any domain | ONE masked raster (`alvar.png`) → 13 live colour versions via CSS mask; 13 hi-res pre-tinted PNGs + `.jpg` source. |
| **Expander `dots` variant** | `2525-core/expander.tsx` (`dots` prop) | ✅ shared | renders the Security Toggle3 (3 accent dots) as the collapse control. |
| **In-header key pattern** | `master-readout.tsx` (`inline`) → `architect-design.tsx` `[data-arch-map-header]` | pattern | ride the project key on the map's OWN horizontally-scrolling header (Security R-CORE). |
| **Project rollup + qualification** | `lib/architect-project.ts` | 🔷 promote | `projectRollup` (real spec × gate), `GateReference{frameworkId,gateId,sequence,status}` (NO literal G8), `SssesReadiness{score,status,confidencePct,evidenceIds}`, `paramScale`, `styleEquivalence`. |
| **Recommend placement (HI/AI)** | `architect-layers.ts` `recommendPlacement(mode,homeType,style)` | pattern | deterministic starter builds; a real provider can replace the AI branch without changing callers. |
| **Drag-drop → house** | tree rows `draggable` → `[data-arch-dropzone]` `onDrop` → `addSpecIds` | pattern | DnD add-to-model via the reused add path; branch drops all leaves, leaf drops itself. |
| **Per-item estimate chip** | `layer-tree.tsx` + `componentEstimate` | pattern | every buildable leaf shows starting `$·d`. |
| **Cloud saved-files** | `lib/architect-saved-files.ts` + `supabase/migrations/022_*` | 🔷 promote | workspace snapshot → Supabase (best-effort); missing table → calm "Local only", never a false retry. |
| **Collapsed rail width** | `56px` (expanded `264px`) | ✅ Architect Design rails | horizontal bar <md / vertical rotated-label rail ≥md (Security parity). |

## Determinism note
All Architect visuals are deterministic from inputs (date, lat/lon, HU): seeded/period-based, local texture assets
(no runtime external fetch), so identical inputs → identical render → replayable (Vision-2525 U-WF-08). The new
`projectRollup` / `paramScale` / `styleEquivalence` / `recommendPlacement` are pure functions — same inputs → same
output → replayable.
