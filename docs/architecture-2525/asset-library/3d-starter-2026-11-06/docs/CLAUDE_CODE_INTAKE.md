# Claude Code Intake Instructions

## Goal
Treat this directory as an Architect-2525 native 3D asset-spec package.

Do **not** reconstruct these assets as React boxes unless a GLB fails validation.
Load the provided GLB first. The GLBs are true 3D geometry and can be translated and rotated.

## Required intake sequence
1. Read `manifest.json`.
2. For each asset, read its `metadata/*.json`.
3. Load `models/*.glb` with `GLTFLoader`.
4. Convert package Z-up to Three.js Y-up once at the loader boundary.
5. Preserve the stable `id` from metadata as semantic identity.
6. Use `rotation.allowedDegrees` for placement rotation.
7. Use `mounting` and `snap` to constrain placement.
8. Use `plan/*.svg` for PLAN-mode footprints/symbols.
9. Keep authority `ILLUSTRATIVE`; placement must not mutate canonical project truth.
10. Cache loaded GLBs and clone instances for repeated placement.

## If a GLB is not visually good enough
Rebuild or replace the geometry, but preserve:
- metadata ID
- dimensions contract
- floor-center pivot
- room compatibility
- mounting + snap semantics
- rotation contract
- model filename/path if practical

A higher-fidelity replacement remains the **same semantic asset**.

## Coordinate contract
Package:
- X = width
- Y = depth
- Z = up
- meters
- origin = floor-center

Three.js application:
- convert once to Y-up on load
- user yaw becomes Y-axis rotation after conversion

## Placement
Recommended state record:

```ts
type PlacedAsset = {
  instanceId: string;
  assetId: string;
  roomId: string;
  positionM: { x: number; y: number; z: number };
  rotationDeg: number;
  authority: "ILLUSTRATIVE";
};
```

Do not store copied GLB geometry in canonical Runtime state. Store semantic asset ID + placement state.

## Validation
Before accepting an asset:
- GLB parses
- nonzero geometry
- dimensions are positive
- pivot sits on floor
- rotation does not tilt asset off floor
- room compatibility is valid
- asset does not silently alter project_hash
