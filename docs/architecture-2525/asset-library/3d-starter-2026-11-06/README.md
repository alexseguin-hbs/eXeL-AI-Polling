# Architect-2525 3D Asset Starter Pack

True reusable 3D starter models generated from the attached concept board.

**Assets:** 18

## Included
- `models/*.glb` — true 3D binary glTF assets
- `metadata/*.json` — dimensions, pivot, rotation, placement, room and authority
- `plan/*.svg` — simple PLAN-mode footprints
- `manifest.json` — library registry
- `schemas/asset.schema.json` — metadata validation contract
- `loader/architect2525AssetLoader.ts` — Three.js intake example
- `docs/CLAUDE_CODE_INTAKE.md` — Claude Code instructions
- `source/build_assets.py` — rebuild contract/source scaffold

## Important
The models are intentionally lightweight browser-ready geometry, not photoreal CAD.
If a model is replaced with a higher-fidelity version, preserve its semantic ID,
dimensions/pivot contract, rotation/placement metadata, and truth-boundary authority.

## Material interpretation
Only actual wood surfaces use wood coloration. Appliances, fixtures and non-wood
elements use neutral/metal/glass materials.
