# Architect-2525 asset packs

Packs organise **implementation**; rooms and categories organise **use** (brief §17). A pack is a list of stable asset
ids over the ONE registry (`../registry.ts`) — never a second definition of an asset. Concept boards by eXeL AI.

| Pack | Name | Lands in revision (brief §22) | File |
|---|---|---|---|
| 1 | Shell & Structure — slab, footing, stem wall, wall frame, rough openings, sheathing, trusses, roof framing/sheathing, doors, windows, skylight, siding | I (general doors / windows) + J (systems + build-phase assets) | `shell-structure.ts` (pending) |
| 2 | Interiors & Fixtures — Living · Dining · Kitchen · Bedroom · Master Closet · Master Bath · Office · Storage/Laundry | B (Living + Dining) · C (Kitchen) · D (Bedroom + Closet) · E (Bath) · F (Office) · G (Laundry) · H (Entry) | `interiors-fixtures.ts` (Rev A: today's kinds) |
| 3 | Finishes, Lighting & Exterior | I (lighting / doors / windows) + K | `finishes-lighting.ts` (pending) |
| 4 | Appliances, Utilities & Life Systems | C + G (appliances) · J (utilities, systems) | `appliances-utilities.ts` (pending) |
| 5 | Smart Home & Automation | K | `smart-home.ts` (pending) |
| 6 | Site & Landscape | K | `site-landscape.ts` (pending) |
| 7 | Accessibility & Inclusion (design-support only — never implies compliance) | K | `accessibility.ts` (pending) |
| 8 | Sustainability & Resilience (no performance claims without an engine source) | K | `sustainability.ts` (pending) |
| 9 | Lifestyle & Personalization (illustrative, noncanonical) | K | `lifestyle.ts` (pending) |
| 10 | Operations & Maintenance | K | `operations.ts` (pending) |

Revision A (this slice) = registry + materials + reusable primitive helpers (`partRects`, `setSize`, LOD-keyed parts,
`assetExport`). No new kinds are added before Revision B.
