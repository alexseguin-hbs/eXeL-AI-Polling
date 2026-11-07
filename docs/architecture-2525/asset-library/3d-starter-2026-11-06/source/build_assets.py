"""
Architect-2525 3D Asset Generator
================================
This package was generated with Python + trimesh.

Contract:
- Units: meters
- Axes: X=width, Y=depth, Z=up
- Pivot: floor-center at (0,0,0)
- Export: binary glTF (.glb)
- Models are lightweight browser geometry, not engineering-certified CAD.

Claude Code can replace any GLB with a higher fidelity rebuild IF it preserves:
1) stable asset ID from metadata
2) nominal dimensions contract
3) floor-center pivot
4) mounting/snap semantics
5) authority = ILLUSTRATIVE unless separately promoted
6) PLAN symbol linkage

The executable generator used in this export is represented by the package's
generated GLBs and per-asset metadata. For richer rebuilds, use Blender Python
or trimesh and export to the same model path / ID.
"""

ASSET_REBUILD_REQUIREMENTS = {
    "format": "GLB / glTF 2.0",
    "units": "meters",
    "coordinateSystem": "X width, Y depth, Z up",
    "pivot": "FLOOR_CENTER",
    "target": "browser-lightweight",
    "rotation": "metadata.rotation.allowedDegrees",
    "placement": "metadata.mounting + metadata.snap",
    "truthBoundary": "ILLUSTRATIVE by default"
}
