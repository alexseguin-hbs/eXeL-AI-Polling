# Architect-2525 · Room Designer — capabilities & pure libs (S1–S9)

The "better than Minecraft" exploded 10×10 room editor (`components/architect-2525/room-designer.tsx`) drives BOTH a
2D floor plan and a 3D isometric voxel from ONE model. All logic lives in pure, unit-tested libs so the component is
just render + wiring. Reuse-first: MiniPanel · compass-2525 · RCORE_LANES · use-rcore-gestures · mep-runs.

## Layout modes
- **Stacked** (default): two independent panes (top + bottom), each its own view (2D/3D) + camera/angle; palette between.
- **Floating**: one main pane + a draggable/resizable/maximizable MiniPanel. Toggled via the `SquareStack` icon;
  persisted at `localStorage["arch2525.roomLayoutMode"]`.

## Capability ladder (S1–S9)
| Slice | Capability | Lives in |
|---|---|---|
| S1 | Doors/windows **slide along their wall** (locked at grab, perpendicular axis pinned) | `wallOf`, `slideAlongWall` (room-objects) |
| S2 | **Real low-fi 3D shapes** (bed=slab+pillow, desk=top+legs, toilet=bowl+tank…) | `shapePartsOf` (room-objects) + voxel3D extrude |
| S3 | **Context-aware palette per room** (M/B/C/L/K/D/O/S/E) + structural **shell** assets | `ROOM_ASSETS` (versioned), `paletteForRoom` |
| S4 | **Mission-Planning gesture parity** (wheel 1.15, pinch damp 0.5) + `sensitivity` knob | `rcore-gestures` (RCORE_CFG) |
| S4b | **Mobile**: pinch inside the designer never zooms the page | `touch-action` (palette none · root pan-y) |
| S5 | **CAD dimensions on move** (R.O. / O.C. / AFF, feet-inches) | `lib/dim-annot.ts` (`ftIn`, `annotateObject`) |
| S6 | Inspector parity — feet-inch readout + N/S/E/W wall chip | room-designer detail block |
| S7 | Palette **grouped by system** (Sleep·Living·Kitchen·Bath·Openings·Shell) | `groupOf`, `groupPalette` (room-objects) |
| S8 | Mirror available in **both 2D and 3D** on every pane | paneHeader |
| S9 | **Guided play-test / demo** — layout→structural→electric→water→sewer→HVAC | `lib/architect-playtest.ts` (`runPlaytest`) |

## Pure libs & test suites (pure-node, `npm run test:all`)
| Lib | Purpose | Suite |
|---|---|---|
| `lib/room-objects.ts` | model, footprints, variants, mirror, wall slide, 3D shape parts, room-asset taxonomy + grouping | `room-objects` (61) |
| `lib/dim-annot.ts` | feet-inch CAD dimension callouts | `dim-annot` (20) |
| `lib/mep-runs.ts` | deterministic MEP routes + length sums (water/sewer/wire/duct) | `mep-runs` (30) |
| `lib/rcore-gestures.ts` | shared MP-parity gesture math (pan/rotate/tilt/pinch/wheel) | `rcore-gestures` (24) |
| `lib/architect-playtest.ts` | scripted guided-demo engine (6 systems, totals == live libs) | `architect-playtest` (16) |
| `lib/architect-guard.ts` | WireGuard sanitizers — unknown kinds/variants drop | `architect-guard` (35) |

## Determinism & trust boundary
- No `Math.random`, no runtime network — every lib is replay-safe.
- `sanitizeObjects` (architect-guard) whitelists on `kind in OBJECT_SPEC` + valid `rot` + known `variant`; unknown /
  injection kinds are dropped (tested). Adding a kind to `OBJECT_SPEC` auto-opens the whitelist to it.

## Held for a live-verifiable session (blind-risk on a praised surface)
- **Play-test runner UI** (the S9 engine is shipped; the narrated Next/Prev runner that drives the live Design state).
- **Full room-designer `t()` i18n** — the file currently has no `t()`; needs one lexicon group + all labels together
  (a partial pass would break the consistency thread).
- **Splitting the 468-line component** — sub-renders are already factored as closures; extraction needs prop-threading.
