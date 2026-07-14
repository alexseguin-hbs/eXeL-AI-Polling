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
| Accent (Architect) | violet `#c084fc` (`C.violet`) | tab active · expander headers |
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

## Determinism note
All Architect visuals are deterministic from inputs (date, lat/lon, HU): seeded/period-based, local texture assets
(no runtime external fetch), so identical inputs → identical render → replayable (Vision-2525 U-WF-08).
