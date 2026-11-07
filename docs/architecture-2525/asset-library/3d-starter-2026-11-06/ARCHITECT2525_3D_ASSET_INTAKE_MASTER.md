# ARCHITECT-2525 — 3D ASSET INTAKE MASTER
## Claude Code / Fable implementation companion
**Export date:** 2026-11-06  
**Purpose:** Supply Claude Code with a complete, implementation-grade contract for consuming, validating, rotating, placing, snapping, rebuilding, and expanding the Architect-2525 3D asset library.

---

# 0. READ THIS BEFORE IMPLEMENTATION

This file is the **3D asset intake authority companion** for the Architect-2525 asset library.

The PNG boards are **visual/reference evidence**.

They are not 3D models.

The current starter ZIP contains **18 actual GLB models**, plus metadata and PLAN SVGs. Those models are deliberately lightweight and browser-oriented. They are acceptable as native 3D starter geometry, but any model that is visually inadequate may be rebuilt or replaced.

**A rebuild must preserve semantic identity and placement contracts.**

The implementation target is not limited to those 18 GLBs.

The target is:

> **ALL distinct usable assets represented across the approved Architect-2525 asset boards, normalized into one semantic 3D asset library.**

Do not delay GLB support until a later level.

GLB/glTF ingestion is part of the base architecture.

---

# 1. SOURCE PACKAGES VERIFIED AT EXPORT

| Package | Size | SHA-256 |
|---|---:|---|
| `Architect2525_3D_Asset_Starter_Pack.zip` | 0.06 MB | `5595d227eff06aa502b2f9d40eb699a7c812bce7e295a23bbe9fd222479e6c51` |
| `Architect-2525_All_Assets_2026-11-06(1).zip` | 41.54 MB | `272b90e4a93b504aacb9cafc091a4d12c8a07f5929a89e152b2b04b801dd26b9` |
| `Architect-2525_All_Assets_2026-11-06_Part1(1).zip` | 13.75 MB | `37927b14d253fcbef668d98500d142110e81e3878a1d8ad5e6a3301d0d5fcb77` |
| `Architect-2525_All_Assets_2026-11-06_Part2(1).zip` | 13.71 MB | `500f8ab51bb9e285d6665d6d39505c993a1eb8ddedd0bb991b41eb544f768e01` |
| `Architect-2525_All_Assets_2026-11-06_Part3(1).zip` | 14.07 MB | `690d0b050590085697cf490c1ef1b9c8ddf1259ad726125d6ee6b8207b8381c2` |

Observed source coverage:

- Visual asset library: **35 PNG reference boards**
- Full visual archive: **37 files total** including manifest + README
- Current native 3D starter package: **18 GLB models**
- Current PLAN projections: **18 SVG symbols**
- Current metadata: per-asset JSON + registry/schema/support files

The visual archive is broader than the current GLB starter coverage.

Therefore:

> **Do not treat the starter pack as “all assets complete.”**

It is the first native 3D implementation tranche.

---

# 2. CORE ARCHITECTURE

Architect-2525 should become an:

> **ASSET CONSUMER + PLACEMENT SYSTEM**

not a collection of one-off React/Three geometry routines.

The intended flow is:

```text
REFERENCE BOARD
      ↓
NORMALIZED SEMANTIC ASSET
      ↓
GLB + METADATA + PLAN SVG + THUMBNAIL
      ↓
ASSET REGISTRY
      ↓
ROOM / CATEGORY / PHASE FILTERS
      ↓
PLACE / MOVE / ROTATE / SNAP / REMOVE
      ↓
PLAN · 3D · WALK · VOXEL · SIMULATE · BUILD
```

One semantic asset can appear in multiple:

- boards;
- packs;
- rooms;
- categories;
- phases.

That does **not** create multiple truth objects.

---

# 3. REQUIRED FILE PACKAGE PER ASSET

Preferred folder contract:

```text
assets/
  furniture/
    sofa-3seat/
      model.glb
      metadata.json
      plan.svg
      thumbnail.webp
```

A valid asset package should contain:

### `model.glb`
Actual native 3D geometry.

### `metadata.json`
Semantic identity, dimensions, pivot, rooms, phase compatibility, mounting, snapping, rotation, authority, and rebuild information.

### `plan.svg`
Top-down PLAN representation.

### `thumbnail.webp` or `.png`
Asset picker representation.

The thumbnail is not a substitute for the GLB.

---

# 4. GLB REQUIREMENTS

Every placeable asset must eventually have actual 3D geometry.

Preferred runtime format:

```text
GLB / glTF 2.0
```

A valid GLB must:

- parse successfully;
- contain nonzero geometry;
- have positive bounds;
- be viewable from arbitrary angles;
- support translation;
- support yaw rotation;
- preserve a sensible pivot;
- not be a 2D screenshot pasted onto a plane unless the asset itself is intentionally planar;
- not require bespoke React geometry code to exist.

Photorealism is **not** required.

Architectural readability is required.

The model should be recognizable from silhouette.

---

# 5. UNITS + COORDINATE CONTRACT

Use one source convention consistently.

Recommended source/export convention:

```text
Units: meters

X = width
Y = depth
Z = up

Origin = floor-center
```

Example:

A sofa 2.10m wide × 0.86m deep × 0.90m high should have its origin approximately at the center of its floor footprint.

Its lowest intended floor-contact geometry should land at or immediately above:

```text
Z = 0
```

If Architect-2525 uses Three.js Y-up:

> Convert Z-up → Y-up once at the asset-loader boundary.

Do not apply random corrective rotations inside individual room components.

---

# 6. PIVOT CONTRACT

Default pivot:

```text
FLOOR_CENTER
```

This allows intuitive:

- rotate;
- move;
- duplicate;
- snap;
- room placement.

Special cases may define alternate mounting semantics while retaining a documented origin.

Examples:

### Floor furniture
Origin = floor-center.

### Wall cabinet
Origin may remain object-center or lower-back mounting center, but metadata must explicitly declare it.

### Door/window
Origin should make wall-opening insertion predictable.

### Ceiling light
Origin should make ceiling placement predictable.

Do not repair broken model origins with hardcoded per-asset offsets in the UI.

Fix the model or metadata contract.

---

# 7. SEMANTIC IDENTITY

Every asset requires a stable semantic ID.

Examples:

```text
furniture.sofa.3seat.v1
furniture.chair.dining.v1
kitchen.cabinet.base.v1
appliance.refrigerator.v1
bath.toilet.v1
electrical.panel.main.v1
hvac.air_handler.v1
security.camera.v1
site.path_light.v1
```

The semantic ID is more important than the model filename.

A higher-quality model may replace an existing GLB while remaining:

```text
furniture.sofa.3seat.v1
```

Do not bind canonical asset identity to:

- a React component name;
- a temporary filename;
- a thumbnail;
- a source-board position.

---

# 8. REQUIRED METADATA

Minimum metadata contract:

```json
{
  "schemaVersion": "1.0",
  "id": "furniture.sofa.3seat.v1",
  "label": "Sofa · 3-Seat",
  "packs": [2],
  "category": "FURNITURE",

  "model": "../models/sofa_3seat.glb",
  "planSymbol": "../plan/sofa_3seat.svg",
  "thumbnail": "../thumbs/sofa_3seat.webp",

  "dimensionsM": {
    "width": 2.10,
    "depth": 0.86,
    "height": 0.90
  },

  "pivot": {
    "origin": "FLOOR_CENTER",
    "axes": "X=width,Y=depth,Z=up"
  },

  "rotation": {
    "axis": "Z",
    "allowedDegrees": [0, 90, 180, 270],
    "freeRotation": false
  },

  "mounting": "FLOOR",
  "snap": ["FLOOR"],

  "rooms": ["LIVING"],
  "phaseCompatibility": ["INTERIOR_DESIGN"],

  "authority": "ILLUSTRATIVE",

  "placement": {
    "allowTranslate": true,
    "allowRotate": true,
    "allowScale": false,
    "collisionFootprint": "BOUNDING_BOX_XY"
  },

  "rebuildSpec": {
    "targetLOD": "BROWSER_LIGHTWEIGHT",
    "preserveSemanticId": true,
    "preservePivotContract": true,
    "preservePlacementContract": true
  }
}
```

---

# 9. INSTANCE STATE

Do not store GLB mesh data as canonical project state.

Placement state should reference the semantic asset.

Recommended:

```ts
type PlacedAsset = {
  instanceId: string;
  assetId: string;
  roomId: string;

  positionM: {
    x: number;
    y: number;
    z: number;
  };

  rotationDeg: number;

  authority: "ILLUSTRATIVE";
};
```

Architect-2525 should reload geometry through:

```text
assetId → registry → GLB
```

This lets one model serve many placed instances.

---

# 10. PLACEMENT OPERATIONS

Every placeable asset should support, where valid:

```text
SELECT
PLACE
MOVE
ROTATE
REMOVE
```

Optional later operations:

```text
DUPLICATE
ALIGN
SNAP
MIRROR
REPLACE
```

Do not require model reconstruction to rotate a chair.

Rotation is transform state.

---

# 11. ROTATION

Use metadata to define allowed yaw rotation.

Typical orthogonal architectural objects:

```json
"allowedDegrees": [0, 90, 180, 270]
```

Freestanding furniture may optionally permit finer increments:

```json
"allowedDegrees": [0, 15, 30, 45, 60, 75, 90, 180, 270]
```

or:

```json
"freeRotation": true
```

Doors/windows/built-ins should generally snap to architectural orientation.

Do not allow arbitrary pitch/roll in ordinary user placement unless the asset requires it.

---

# 12. MOUNTING + SNAP TAXONOMY

Supported mounting types should include:

```text
FLOOR
WALL
CEILING
SURFACE
BUILT_IN
```

Snap targets should include, as needed:

```text
FLOOR
WALL
WALL_BACK
WALL_CORNER
WALL_OPENING
CEILING
SURFACE
COUNTERTOP
CABINET_UNDERSIDE
CABINET_LINE
ROOF_LINE
ROOF_EDGE
DOOR
```

Examples:

### Toilet
```text
mounting = FLOOR
snap = FLOOR + WALL_BACK
```

### Upper cabinet
```text
mounting = WALL
snap = WALL
```

### Pendant
```text
mounting = CEILING
snap = CEILING
```

### Window
```text
mounting = WALL
snap = WALL_OPENING
```

### Range hood
```text
mounting = WALL
snap = WALL
```

Placement intelligence should prevent obviously invalid states.

---

# 13. ROOM TAXONOMY

Canonical 3×3 first-floor spaces:

```text
MASTER_BEDROOM
MASTER_BATH
MASTER_CLOSET
LIVING
KITCHEN
DINING
OFFICE
STORAGE_LAUNDRY
ENTRY_PORCH
```

Shared assets may use:

```text
GENERAL
```

Do not create new canonical rooms merely because a reference board uses a broad category.

---

# 14. PHASE PROJECTION

Asset existence does not imply universal visibility.

Suggested phase taxonomy:

```text
FOUNDATION
FRAMING
ROOF
PLUMBING
ELECTRICAL
HVAC
SECURITY
INTERIOR_FINISH
INTERIOR_DESIGN
EXTERIOR
SITE
OPERATIONS
```

Use one phase-projection mechanism.

Do not hardcode contradictory phase rules inside every asset component.

Examples:

### Framing
Show:
- studs;
- rough openings;
- roof framing.

Hide:
- sofa;
- dining chair;
- decorative plant.

### Interior Design
Show:
- furniture;
- cabinetry;
- appliances;
- bath fixtures;
- décor.

### Electrical
Show:
- panel;
- outlets;
- switches;
- lighting/systems overlays as supported.

---

# 15. PLAN PROJECTION

Every 3D asset should have a 2D PLAN representation.

Preferred:

```text
SVG
```

PLAN does not need to render full 3D mesh complexity.

The same asset ID drives both:

```text
furniture.sofa.3seat.v1

3D/WALK → model.glb
PLAN    → plan.svg
PICKER  → thumbnail.webp
```

Do not create separate semantic sofa objects for each projection.

---

# 16. ASSET PICKER THUMBNAILS

Thumbnails should be derived from the same asset identity.

Recommended render:

- neutral/dark Architect-2525 background;
- three-quarter isometric view;
- stable camera;
- consistent scale padding;
- cyan/teal Architect visual treatment where appropriate;
- only actual wood rendered tan.

Do not use an unrelated concept-board crop if a native model thumbnail is available.

---

# 17. MATERIAL LANGUAGE

Architect-2525 design rule:

> **ONLY WOOD IS TAN.**

Use:

- true wood → tan / natural wood;
- general furniture/architecture → cyan/teal or appropriate neutral treatment;
- secondary accent → purple;
- glass → transparent cyan/blue;
- metal → appropriate neutral/Architect treatment;
- light emission → white/warm where appropriate;
- electrical semantic highlight → yellow where meaningful;
- security alert → red where meaningful.

Do not color non-wood appliances tan merely for visual harmony.

---

# 18. COMPLETE PACK COVERAGE TARGET

The following is the normalized minimum target represented by the approved library direction.

## PACK 1 — SHELL + STRUCTURE

- Foundation Slab
- Footing
- Stem Wall
- Wall Frame Section
- Door Rough Opening
- Window Rough Opening
- Wall Sheathing
- Roof Truss
- Roof/Ceiling Framing Module
- Roof Sheathing
- Interior Door
- Entry Door
- Sliding Glass Door
- Single Window
- Wide Window
- Skylight
- Exterior Siding

## PACK 2 — INTERIORS + FIXTURES

### Living
- Sofa
- Armchair / Lounge Chair
- Coffee Table
- Side Table
- Media / TV Console
- Bookcase
- Floor Lamp

### Dining
- Dining Table
- Dining Chair
- Sideboard / Credenza
- Pendant

### Kitchen
- Refrigerator
- Range / Oven
- Range Hood
- Dishwasher
- Microwave
- Base Cabinet
- Wall Cabinet
- Kitchen Sink
- Kitchen Island
- Bar Stool
- Pantry Cabinet

### Bedroom
- Queen / King Bed
- Bunk Bed
- Nightstand
- Dresser
- Wardrobe
- Bedroom Bench
- Table Lamp

### Master Closet
- Closet System
- Hanging Rod
- Drawer Unit
- Shelving
- Shoe Rack
- Closet Island
- Hamper
- Mirror

### Bath
- Toilet
- Vanity + Sink
- Shower Stall
- Bathtub
- Mirror
- Towel Bar / Rack

### Office
- Desk
- Office Chair
- File Cabinet
- Bookcase
- Monitor
- Desk Lamp

### Storage / Laundry
- Washer
- Dryer
- Utility Sink
- Storage Shelf
- Storage Cabinet
- Storage Bin
- Workbench / Utility Surface

## PACK 3 — FINISHES + LIGHTING + EXTERIOR

### Interior Finishes
- Drywall
- Paint
- Flooring / LVP
- Tile
- Baseboard
- Crown Molding
- Trim / Casing

### Lighting
- Flush Ceiling Light
- Recessed Light
- Pendant
- Chandelier
- Wall Sconce
- Track Light
- Under-Cabinet Light
- Floor Lamp
- Table Lamp

### Security
- Security Camera
- Video Doorbell
- Motion Sensor
- Smart Lock
- Smoke / CO Detector

### Exterior
- Exterior Door
- Garage Door
- Siding
- Roofing
- Gutter + Downspout
- Deck / Porch
- Fence

## PACK 4 — APPLIANCES + UTILITIES + LIFE SYSTEMS

- Refrigerator
- Range / Oven
- Dishwasher
- Microwave
- Garbage Disposal
- Washer
- Dryer
- Water Heater
- Water Softener
- HVAC Air Handler / Furnace
- AC Condenser
- Air Purifier
- Dehumidifier
- Electrical Panel
- Home Battery
- Inverter
- Generator
- EV Charger
- Solar Inverter
- Leak Detector
- Water Shutoff Valve
- Air Quality Monitor

## PACK 5 — SMART HOME + AUTOMATION

- Smart Thermostat
- Smart Hub
- Router
- Smart Lock
- Entry Keypad
- Scene Switch
- Control Panel
- Motorized Shade
- Motorized Shade Track
- Automated Lighting Controller
- Environmental Sensor
- Occupancy Sensor

## PACK 6 — SITE + LANDSCAPE

- Driveway Pad
- Walkway Pavers
- Front Steps
- Landing
- Fence Section
- Gate
- Planter Bed
- Tree
- Shrub / Plant
- Irrigation Head
- Path Light
- Landscape Light
- Deck
- Patio
- Exterior Utility Pad

## PACK 7 — ACCESSIBILITY + INCLUSION

- Entry Ramp
- Handrail
- Grab Bar
- Lever Door Handle
- Roll-In Shower
- Shower Bench
- Accessible Toilet
- Accessible Vanity
- Clear-Floor-Space Marker
- Threshold Transition

Presence of an accessibility asset must **not** imply code compliance.

## PACK 8 — SUSTAINABILITY + RESILIENCE

- Solar Panel Array
- Home Battery Pack
- Backup Inverter
- Controller
- Rainwater Cistern
- Storm Shutter
- High-Efficiency Equipment
- Backup Power Interface
- Water Capture Components
- Resilience Equipment

Do not attach unsupported performance claims.

## PACK 9 — LIFESTYLE + PERSONALIZATION

- Area Rug
- Accent Chair
- Side Table
- Entertainment Console
- TV
- Bookshelf
- Décor Object
- Mirror
- Wall Art
- Plant
- Decorative Lighting
- Optional Style Variants

These remain primarily illustrative.

## PACK 10 — OPERATIONS + MAINTENANCE

- Tool Cart
- Tool Kit
- Access Ladder
- Service Access Panel
- HVAC Filter
- Water Filter
- Replacement Filter Set
- Shutoff Valve
- Valve Manifold
- Inspection Point
- Service Marker
- Maintenance Access Element

---

# 19. DEDUPLICATION

Normalize duplicate appearances.

Example:

A refrigerator may appear in:

- Kitchen board;
- Pack 2;
- Pack 4;
- room board;
- full-house board.

Do not create five incompatible refrigerators merely because it appears five times.

Preferred semantic entry:

```json
{
  "id": "appliance.refrigerator.v1",
  "packs": [2, 4],
  "rooms": ["KITCHEN"],
  "categories": ["APPLIANCE", "KITCHEN"]
}
```

One model may then appear under several user-facing filters.

---

# 20. CURRENT NATIVE 3D STARTER ASSETS

The existing 3D starter package contains these native GLBs:

| Semantic ID | Label | Model | Metadata | PLAN |
|---|---|---|---|---|
| `furniture.sofa.3seat.v1` | Sofa | `models/sofa_3seat.glb` | `metadata/sofa_3seat.json` | `plan/sofa_3seat.svg` |
| `furniture.lounge_chair.v1` | Lounge Chair | `models/lounge_chair.glb` | `metadata/lounge_chair.json` | `plan/lounge_chair.svg` |
| `furniture.coffee_table.v1` | Coffee Table | `models/coffee_table.glb` | `metadata/coffee_table.json` | `plan/coffee_table.svg` |
| `furniture.bed.queen.v1` | Bed | `models/bed_queen.glb` | `metadata/bed_queen.json` | `plan/bed_queen.svg` |
| `furniture.nightstand.v1` | Nightstand | `models/nightstand.glb` | `metadata/nightstand.json` | `plan/nightstand.svg` |
| `furniture.dresser.v1` | Dresser | `models/dresser.glb` | `metadata/dresser.json` | `plan/dresser.svg` |
| `furniture.dining_table.v1` | Dining Table | `models/dining_table.glb` | `metadata/dining_table.json` | `plan/dining_table.svg` |
| `furniture.dining_chair.v1` | Dining Chair | `models/dining_chair.glb` | `metadata/dining_chair.json` | `plan/dining_chair.svg` |
| `kitchen.base_run.sink.v1` | Kitchen Base Cabinet Run (with Sink) | `models/kitchen_base_run_sink.glb` | `metadata/kitchen_base_run_sink.json` | `plan/kitchen_base_run_sink.svg` |
| `kitchen.upper_cabinets.v1` | Upper Cabinets | `models/upper_cabinets.glb` | `metadata/upper_cabinets.json` | `plan/upper_cabinets.svg` |
| `appliance.refrigerator.frenchdoor.v1` | Refrigerator | `models/refrigerator.glb` | `metadata/refrigerator.json` | `plan/refrigerator.svg` |
| `bath.toilet.v1` | Toilet | `models/toilet.glb` | `metadata/toilet.json` | `plan/toilet.svg` |
| `bath.vanity_sink.v1` | Vanity Sink | `models/vanity_sink.glb` | `metadata/vanity_sink.json` | `plan/vanity_sink.svg` |
| `bath.shower.enclosure.v1` | Shower Enclosure | `models/shower_enclosure.glb` | `metadata/shower_enclosure.json` | `plan/shower_enclosure.svg` |
| `appliance.washer.frontload.v1` | Washer | `models/washer.glb` | `metadata/washer.json` | `plan/washer.svg` |
| `appliance.dryer.frontload.v1` | Dryer | `models/dryer.glb` | `metadata/dryer.json` | `plan/dryer.svg` |
| `opening.door.interior.v1` | Interior Door | `models/interior_door.glb` | `metadata/interior_door.json` | `plan/interior_door.svg` |
| `opening.window.unit.v1` | Window Unit | `models/window_unit.glb` | `metadata/window_unit.json` | `plan/window_unit.svg` |

Treat these as **ready-to-load native starter models**.

They are not final cinematic models.

If one is too primitive:

> REBUILD THE GLB — DO NOT REPLACE THE SEMANTIC CONTRACT.

---

# 21. REBUILD PROTOCOL

If a model is visually inadequate:

1. preserve `asset.id`;
2. preserve or intentionally version dimensions;
3. preserve mounting semantics;
4. preserve snap semantics;
5. preserve pivot convention;
6. preserve room compatibility;
7. preserve phase compatibility;
8. preserve authority;
9. preserve PLAN linkage;
10. replace the model file or increment model revision;
11. rerun validation;
12. visually verify in PLAN, 3D, and WALK.

Higher fidelity must not create a second truth identity.

---

# 22. MODELING QUALITY TARGET

Architect-2525 requires:

> recognizable + lightweight + scalable

not:

> photorealistic + enormous + slow.

Each model should read immediately from silhouette.

Examples:

### Sofa
Use:
- base;
- cushions;
- back;
- arms;
- legs.

Do not use one featureless cuboid.

### Washer
Use:
- cabinet;
- circular front door;
- control strip;
- feet.

### Toilet
Use:
- base;
- bowl;
- seat/lid;
- tank.

### Window
Use:
- frame;
- glazing;
- muntins where relevant;
- sill where relevant.

### Wall framing
Use actual stud/header/sill composition.

---

# 23. LEVEL OF DETAIL

Recommended browser targets:

### LOD0 — Picker / distant
Very lightweight silhouette.

### LOD1 — Standard room / Walk
Default runtime model.

### LOD2 — Close inspection
Optional later.

Do not block basic placement on LOD2.

GLB support belongs in the base asset architecture.

---

# 24. MODEL CACHE

Load each semantic model once when possible.

Recommended:

```text
assetId
  ↓
model cache
  ↓
clone / instance
```

Do not reload the same refrigerator from the network for every placed refrigerator.

Use instancing where sensible for:

- chairs;
- lights;
- framing members;
- repeated site elements;
- shrubs;
- pavers.

---

# 25. ROOM PLACEMENT

Assets should respect nominal dimensions.

The current canonical demo uses 10ft × 10ft rooms.

Do not resize objects randomly to make them appear attractive.

Examples:

- sofa should remain plausible;
- queen bed should remain plausible;
- kitchen cabinetry should use realistic depth relationships;
- toilet/shower/vanity should remain believable relative to room;
- washer/dryer should remain appliance scale.

Asset scale is part of spatial communication.

---

# 26. WALK MODE

Verify every major asset in first-person Walk.

Test:

- near view;
- oblique view;
- doorway;
- room corner;
- mobile portrait.

Prevent:

- floating;
- floor penetration;
- excessive clipping;
- wrong orientation;
- giant scale;
- microscopic scale;
- missing normals/materials;
- transparent-object sorting failure where avoidable.

---

# 27. CANONICAL TRUTH BOUNDARY

The asset system must preserve Architect-2525 authority boundaries.

Placing an illustrative:

- sofa;
- chair;
- rug;
- lamp;
- plant;
- washer;
- décor element;

must not silently mutate:

- canonical Project truth;
- project hash;
- canonical 900 ft²;
- PLAN authority;
- R-CORE architectural revision;
- Budget Target;
- Project Cost;
- portfolio stage.

Default asset authority:

```text
ILLUSTRATIVE
```

Promotion into canonical architectural truth requires an explicit authorized action and supporting contract.

---

# 28. CLAUDE CODE INTAKE ORDER

Claude Code should:

1. preserve the 35 PNG boards as source/reference evidence;
2. load the 18 existing GLBs first;
3. validate the current manifest and metadata;
4. create one `AssetRegistry`;
5. create one GLB loader/cache;
6. create one placement transform contract;
7. create one rotation contract;
8. create one snap/mounting contract;
9. create one PLAN symbol projection;
10. create one authority boundary;
11. create `ASSET_INVENTORY.md`;
12. map all distinct reference-board assets to normalized IDs;
13. mark each as:
   - `READY`
   - `PLACEHOLDER`
   - `NEEDS_REBUILD`
   - `MISSING`
   - `DUPLICATE_NORMALIZED`
14. build missing GLBs incrementally;
15. keep semantic IDs stable;
16. prove placement in the deployed app.

---

# 29. REQUIRED ASSET INVENTORY LEDGER

Create:

```text
ASSET_INVENTORY.md
```

Columns:

```text
REFERENCE NAME
NORMALIZED ASSET ID
SOURCE BOARD(S)
PACK(S)
ROOM(S)
PHASE(S)
GLB STATUS
PLAN STATUS
METADATA STATUS
VISUAL QA
NOTES
```

This ledger determines completeness.

Do not estimate completeness from a screenshot.

---

# 30. MINIMUM TESTS

Automated tests should cover:

### Registry
- unique asset IDs;
- valid paths;
- no duplicate semantic IDs;
- required metadata exists.

### Geometry
- GLB parses;
- geometry count > 0;
- bounds > 0;
- no NaN/Infinity;
- reasonable dimensions.

### Placement
- translate;
- rotate;
- delete;
- duplicate if supported;
- floor placement;
- wall placement;
- ceiling placement.

### Projection
- PLAN symbol exists;
- 3D model exists;
- same semantic ID drives both.

### Truth boundary
- illustrative placement does not change canonical project hash;
- illustrative placement does not create canonical PLAN revision.

### Performance
- cache works;
- repeated model placement does not trigger repeated network/model parse work unnecessarily.

---

# 31. VISUAL QA

For representative assets, capture:

```text
ASSET PICKER
PLAN
3D ROOM
WALK
MOBILE PORTRAIT
```

Questions:

- Is it instantly recognizable?
- Is scale believable?
- Is pivot correct?
- Does rotation behave?
- Does snap work?
- Is material language correct?
- Does it clip badly?
- Is PLAN representation clear?
- Does it remain illustrative unless promoted?

---

# 32. 12-LANE QUALITY GATE

Use an AsM-style twelve-lane review rubric.

This is a review structure, not a claim that twelve autonomous agents were actually instantiated.

Grade:

1. Asset completeness
2. True 3D geometry
3. Semantic metadata
4. Coordinate + pivot integrity
5. Placement + rotation
6. Snap + mounting
7. PLAN / 3D / WALK projection consistency
8. Deduplication
9. Mobile + performance
10. Canonical truth boundary
11. Visual quality
12. Executable proof

Critical failures:

- incomplete asset inventory;
- fake 3D;
- broken pivot/scale;
- inability to place/move/rotate;
- disconnected projection identities;
- canonical truth corruption;
- no executable proof.

---

# 33. RELEASE PROOF LOOP

For meaningful revisions:

```text
IMPLEMENT
→ TEST
→ COMMIT
→ PUSH
→ DEPLOY
→ VERIFY PUBLIC BUILD
→ CAPTURE EVIDENCE
→ REVIEW
```

Do not mark Cloudflare/public verification PASS if the deployment endpoint cannot actually be reached.

Source-code success and public-runtime success are separate states.

---

# 34. DO NOT

Do not:

- rebuild every object directly inside React;
- treat PNG boards as final runtime assets;
- defer GLB support until a later architectural phase;
- duplicate an asset because it appears in multiple boards;
- use one generic box for all furniture;
- hardcode model offsets per room;
- mutate canonical truth from illustrative furniture placement;
- color non-wood assets tan;
- claim accessibility compliance from asset presence;
- claim engineering validation from visual appearance;
- create separate semantic truth objects for PLAN and WALK;
- rewrite the 3×3 canonical house to fit furniture.

---

# 35. SUCCESS CONDITION

The desired user experience is:

```text
OPEN ASSET LIBRARY
→ FILTER BY ROOM / CATEGORY / PHASE
→ SELECT ASSET
→ PLACE
→ MOVE
→ ROTATE
→ SNAP
→ WALK AROUND IT
→ SEE ITS PLAN FOOTPRINT
→ SAVE ILLUSTRATIVE PLACEMENT STATE
```

and the same workflow should eventually apply across the full Architect-2525 house asset ecosystem.

The architecture should be capable of consuming many hundreds of future assets without requiring a rewrite.

---

# 36. CORE PRINCIPLE

Build the smallest coherent asset architecture capable of consuming the largest reusable library.

**One registry.  
One semantic identity.  
Real 3D geometry.  
Many projections.  
Reusable placement.  
Human authority preserved.**

Humanity decides.  
Technology assists.  
Trust must be proven.
