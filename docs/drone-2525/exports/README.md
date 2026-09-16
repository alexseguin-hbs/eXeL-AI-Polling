# Drone-2525 · exports

Two kinds of file live near each other here, and the difference matters.

## Generated — never hand-edit

`foil-1.111.*` and `foil-11.111.*` are produced by `node scripts/build-foil-model.mjs` from ONE source:
the drawing at `docs/security-2525/xbat-wireframe/xbat.wire.json`, scaled and axis-mapped by
`airframe.geometry` in `docs/drone-2525/drone-2525.v00.00.json`. `npm run test:foil-model` (in `test:ci`)
regenerates them in memory and refuses on any difference, so an edit made here is silently reverted at best
and fails the build at worst. Edit the model.

| file | for | axes | units |
|---|---|---|---|
| `.wire.json` | the canonical model | x forward · y right · z up | m |
| `.obj` | any DCC, Blender, three.js | X=east Y=north Z=up | m |
| `.py` | matplotlib `Line3DCollection` | X=east Y=north Z=up | m |
| `.cs` | Unity `MonoBehaviour` | X=east Y=up Z=north | m |
| `.h` + `.cpp` | Unreal `AActor` | X=north Y=east Z=up | **cm** |
| `.hash.json` | the provenance record | — | — |

Both scales are the same 1,755 segments; only the metres differ.

- **`foil-1.111`** — span 1.111 m, nose-to-tail 0.7777 m, depth 0.2522 m. The demo / laser-tag scale, and
  the one the app flies (operator 2026-09-16: *"make fix wing aircraft 1 m foil and proportional"*).
- **`foil-11.111`** — span 11.111 m, nose-to-tail 7.777 m, depth 2.5226 m. Full scale.

Depth follows the geometric mean of the span and length scales, which is the rule the operator's own
manifest states. Against the source drawing the declared foil stretches the fuselage 3.07 %; that is
intentional, and `frontend/tests/airframe-truth.test.mjs` asserts it rather than letting it pass unnoticed.

## Carried — never regenerate

`../foil-package/` holds the operator's own artefacts byte-for-byte, with `sha256` in
`docs/asks/2026-09-16_foil_1m_five_levels_world.sha256`. His `FOIL_DualScaleGameWireframeActor.h` is the
hand-written ancestor of `foil-1.111.h` / `foil-11.111.h` above — kept as the record of what was asked for,
superseded as the thing to build against. Hand-writing the same silhouette once per engine is the drift
WIREFRAME-CORE U-WF-05 exists to prevent.

## Also here

`DRONE-2525_PARITY.html` — the single-file parity harness for an outside implementer. It carries the
contract as data, runs a reference implementation, and scores conformance clauses. Open it and press
**RUN CONFORMANCE**.
