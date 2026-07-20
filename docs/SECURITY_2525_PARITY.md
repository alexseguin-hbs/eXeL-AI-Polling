# Security-2525 → Architect-2525 Design-Tab Parity Audit

**Purpose.** Security-2525 (Mission-Planning tactical map) is the mature graphics/rendering
reference in this codebase. Its format, style, and rendering learnings must be **captured once**
and **reused everywhere** in the Architect-2525 **Design** tab (room designer, tiny-floorplan,
voxel-house, layer-tree) — never re-implemented. This doc is the ledger of every learning and its
Architect adoption status, per the Thought-Master directive: *"check any learnings from
Security-2525 format style and rendering are captured and used wherever possible for
Architect-2525 Design tab."*

**Law.** Reuse-first. No bespoke re-implementation when a Security-2525 primitive exists. Any new
Architect rendering behavior is first checked against this table; if Security-2525 already solved
it, adopt the shared primitive (or the shared technique) rather than forking.

---

## 1 · Adoption ledger — learnings and their Architect status

| # | Security-2525 learning / primitive | Where it lives (source of truth) | Architect Design adoption | Status |
|---|-----------------------------------|----------------------------------|---------------------------|:------:|
| P-01 | **R-CORE gesture model** (left-drag pan · right-drag orbit+tilt · wheel/pinch zoom · pointer-capture release on up/leave/cancel) | `lib/rcore-gestures.ts` (`RCORE_CFG`, `rightDrag`, `pinchUpdate`, `wheelZoom`, `pairGeometry`), `components/architect-2525/use-rcore-gestures.ts` | room-designer + voxel-house + tiny-floorplan all drive through `useRCoreGestures` / `RCORE_CFG` — one gesture math source | ✅ |
| P-02 | **RCORE_LANES** header lane layout (the segmented view/tool rail) | `components/security-2525/rcore.ts` (`RCORE_LANES`) | imported directly by `room-designer.tsx`, `mini-panel.tsx`, `architect-celestial.tsx` — no fork | ✅ |
| P-03 | **Compass** (North-up bearing rose) | `components/architect-2525/compass-2525.tsx` (MP-parity port) | rendered on room-designer panes + mini; North-lock links top↔mini bearing | ✅ |
| P-04 | **MiniPanel** (draggable / resizable / maximizable secondary view with portal-max) | `components/architect-2525/mini-panel.tsx` | wraps the mini map/globe across Design + celestial | ✅ |
| P-05 | **••• Expander** rails OUTSIDE the map (Security rail method, not overlays) | `components/2525-core/expander.tsx` | ••• dots to the **left** of text, vertical stack, standardized to ACTIVE ITEMS; must not cover R-CORE | ✅ |
| P-06 | **FACE_SHADE / `shade()`** — per-face brightness so extruded 3D reads solid | `lib/rcore-gestures.ts` (`FACE_SHADE`, `shade`) | room-designer solid faces (FIX-D), voxel-house furniture highlights (FIX-8a), tiny-floorplan | ✅ |
| P-07 | **GeoLabel rendering** — `vectorEffect="non-scaling-stroke"` on label halos so stroke stays crisp at any pane zoom/scale | Mission-Planning `GeoLabel` usage; law in task #36 (shared GeoLabel primitive) | `room-designer.tsx` dimension-label halos (chain-seg `<text>` + note `<text>`) — commit `7d066fc` | ✅ |
| P-08 | **`paintOrder:"stroke"` label halo** — text stroke painted under fill for legibility over busy maps | MP tactical labels | Architect CAD dimension labels + notes use `paintOrder:"stroke"` halo | ✅ |
| P-09 | **Polygon-filled faces** (radar-dome / cone technique) — build 3D shapes from filled `<polygon>` faces, not wireframe | `mission-planning.tsx` radar dome | `shapePartsOf` + voxel3D filled faces per furniture kind | ✅ |
| P-10 | **Click-splash + FPS-profiled scripted play-test** driving the REAL UI via DOM events + data-attributes | `components/security-2525/play-test.ts` | `lib/architect-playtest.ts` (pure step oracle, tested). On-screen DOM runner with click-splash/FPS = **pending** (interactive; verify by SHA) | ◑ |
| P-11 | **`EDGE_FINE` thin voxel edges** (symbology-first, edges don't dominate) | Security `EDGE_FINE=0.6` | Architect voxel edges use the same fine-edge weight | ✅ |
| P-12 | **Right-click context-menu suppression** on voxel surfaces (`onContextMenu` preventDefault so right-drag orbit doesn't pop the browser menu) | `mission-planning.tsx` | voxel-house + room-designer suppress context menu on the voxel container | ✅ |
| P-13 | **Constant screen-size labels on zoom** (labels don't scale with the map) | MP GeoLabel law | Architect dimension/metric labels hold size via `non-scaling-stroke` + fixed `fontSize` | ✅ |

Legend: ✅ adopted · ◑ partially adopted (pure/gated done; interactive on-screen part pending live-verify) · ☐ not yet.

---

## 2 · The one remaining gap (P-10, interactive)

`lib/architect-playtest.ts` holds the **pure step script + expected per-step state** and is
pure-node locked (the ORACLE). What Security-2525 has and Architect does **not yet** have is the
**on-screen DOM runner** that mirrors `security-2525/play-test.ts`: arm a palette item
(`data-arch-tool`) → tap the map (`data-arch-roomdesign-2d`) to place → toggle each view
(`data-arch-room-view`, `data-arch-roomdesign-3d`) → orbit, with a cyan **click-splash** at each
tap and per-section FPS profiling. This is interactive and **not headless-verifiable** (proxy
403s workers.dev), so it is gated (tsc/build/test) then confirmed live by SHA — it is deferred
to a live-verifiable slice per the plan, with the pure oracle already asserting that the DOM
script would place the SAME kinds at the SAME cells as each pure frame.

---

## 3 · Standing rule for future Design-tab work

Before adding any new rendering behavior to the Architect Design tab, check this table:

1. **Gesture / camera** → `useRCoreGestures` + `RCORE_CFG` (never a second handler on the same surface).
2. **Header rail / lanes** → `RCORE_LANES` + `compass-2525` + `MiniPanel`.
3. **Expanders** → `2525-core/expander.tsx`, rails OUTSIDE the map, ••• to the left of text.
4. **3D solidity** → `FACE_SHADE`/`shade()` + filled `<polygon>` faces (radar-dome technique).
5. **Any text label** → `paintOrder:"stroke"` halo **and** `vectorEffect:"non-scaling-stroke"`
   (GeoLabel law) so it stays crisp and constant-size at every pane zoom.
6. **Scripted demo** → extend `lib/architect-playtest.ts` (pure oracle) first; the DOM runner
   mirrors `security-2525/play-test.ts`.

Anything not covered here that Security-2525 already does is a **capture gap** — add the row,
adopt the shared primitive, and cite the commit SHA.
