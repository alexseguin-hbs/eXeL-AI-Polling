# Architect-2525 Complete 3D Asset Library — Claude Code Intake

This package supersedes the earlier 18-GLB starter audit.

## Complete state
- Board placements: **148**
- Exact-name unique assets on the 10 boards: **137**
- Additional verified extras: **2**
- Semantic GLBs in this package: **139**
- GLBs validated: **139/139**
- Missing GLB entries: **0**

Every semantic asset includes:
- `models/<asset>.glb`
- `metadata/<asset>.json`
- `plan/<asset>.svg`

Use `manifest.json` as the registry and `inventory/placements.json` as the source-board placement/provenance ledger.

## Important
These are browser-lightweight procedural starter models derived from the approved asset inventory and visual language. They are real GLB geometry, independently rotatable and placeable. Higher-fidelity models may replace them, but preserve:
1. semantic asset ID,
2. floor-center pivot,
3. meter units,
4. mounting/snap semantics,
5. PLAN symbol linkage,
6. `ILLUSTRATIVE` authority unless explicitly promoted.

Material rule: **only actual wood uses tan**.

Architect-2525 runtime should cache GLBs by semantic asset ID and store placed instances as `assetId + transform`, not copied mesh data.
