# SECURITY-2525 · Mission-Support Object Ontology (GROK Consolidation 3)

> **Source:** GROK "Final Consolidated Canonical Object Ontology for SECURITY-2525
> MGRS Wireframe Mission-Support Layers" (2026-07-06). Reviewed by ChatGPT eXeL AI
> and Claude — governance wrapper in `ONTOLOGY_GOVERNANCE_VISION2525.md`.
>
> **Scope guard (LOCKED):** Mission-support **evidence objects only**. The system
> visualizes, classifies, validates, replays, and assesses readiness. It does
> **NOT** generate real-world assault, targeting, evasion, or route-execution
> instructions. SOF + service-equivalent markers are **high-level presence /
> deconfliction signals** only — they never expose operational detail.

The catalog is **stable**. No new tactical assets, troop details, or maneuver
icons are to be added. Consolidation 3 normalized duplicates to one preferred
term (aliases preserved); Consolidation 4 (the governance wrapper) is the only
open extension.

## Where this lives in the product

- **UI:** `PLANNING` tab → left palette → **SUPPORT** tab. Objects are grouped by
  legend group and placed on the AO map (drag or tap-then-tap). Every placement
  snaps to MGRS and carries a `reality_mode` + `rcore_state` governance stub.
- **Code:** `frontend/components/security-2525/mission-support.ts` (starter
  catalog — a representative slice of every legend group) and the placement /
  render logic in `mission-planning.tsx`.
- The starter catalog is intentionally a **subset**; the full alphabetical list
  below is the canonical target the code grows toward.

## Legend groups & visual color law

Green=land · Blue=water surface · Cyan(dashed)=bathymetry/subsurface · Red=restricted
boundary / hostile / critical · Orange=caution · Gold=selected/active · Dim white=MGRS/UTM
grid · Gray=built environment/infrastructure · Purple (or cyan dashed elevated)=aerial route ·
Blue route=friendly/support (training/sim) · Red dashed route=opposing-force sim only ·
Yellow=unknown/unverified · **SOF = distinct frame (presence without detail).**

## Canonical objects (alphabetical, preferred term → parent category · geometry)

Aerial corridor · Aerial delivery point · Aerial resupply route · Aid station ·
Air assault support point · Alternate resupply route · Ambulance exchange point ·
Ammunition transfer point (Class V) · Assembly area · Bathymetry layer ·
Battle-damage assessment point · Beach node · Boat ramp · Bridge dependency ·
Building footprint layer · Cache / prepositioned stock · Canopy confidence layer ·
Casualty collection point · Causeway · Caution area · Channel · Checkpoint ·
Civilian-sensitive zone · Class I food/water point · Class III fuel point ·
Class V ammunition point · Class VIII medical supply point · Clearing · Coastline ·
Communications limitation area · Communications repair point · Container staging area ·
Convoy route · Convoy support center · Culvert dependency · Decontamination support point ·
Depot · Desert environment layer · Distribution company node · Dock/pier · Drop zone ·
Dry wash / wadi · Dust/sand visibility zone · Emergency resupply route ·
Enemy / opposing-force unit · Engineer support point · Equipment staging area ·
Field maintenance point · Forward arming & refueling point · Forward logistics node ·
Forward resupply point · Fuel point · Fuel/water platoon support area ·
Ground resupply corridor · Harbor · Helicopter landing zone · High-density civilian area ·
Hospital/clinic · Industrial zone · Issue/turn-in point · Landing support point ·
Landing zone · Line of troops · Littoral logistics node · Littoral resupply corridor ·
Load transfer point · Logistics node · Main supply route · Maintenance collection point ·
Mangrove · Marsh/wetland · Material handling area · Medical collection point ·
MEDEVAC pickup point · Medical route · Medical supply point · Medical treatment facility ·
Mission boundary · Neutral entity · No-go zone · Observation point · Obstacle warning area ·
Open field · Park · Patient holding area · Pickup zone · Pier · Port · Power generation
support point · Power substation · Preventive medicine support area · Primary resupply route ·
Rail network · Recovery point · Refuel point · Repair team location · Residential block ·
Restricted area · Restricted route · Retention pond · Risk envelope · Road dependency ·
Route checkpoint · Route profile · Route recovery segment · Salt flat · School ·
Sensor point · Ship-to-shore node · Shopping center · Shore node · SOF support node ·
Staging area · Suburban environment layer · Supply depot · Supply handoff point ·
Supply point · Surf/shoreline zone · Surface elevation layer · Sustainment node ·
Temporary aviation staging area · Temporary storage area · Terrain layer ·
Threat/risk-envelope layer · Tidal flat · Traffic control post · Transit corridor ·
Tunnel dependency · UAS launch/recovery point · Unknown contact · Urban building footprint ·
Urban environment layer · Utilities corridor · Vehicle holding area · Wadi/dry wash ·
Water crossing · Water distribution point · Water system · Waterborne resupply corridor ·
Waypoint · Wetland.

Each entry carries: aliases · parent category · environment relevance · geometry
type · required metadata · visual symbol rule · SSSES gate · replay bundle field ·
public export behavior · internal/restricted behavior. (Per-item detail preserved
in the GROK source; the code catalog encodes the fields it currently renders.)

## SSSES gate (every object) — testable sub-gates in the governance doc

- **Security:** classification known · export policy known · sensitive mode enforced ·
  public mode strips/generalizes sensitive detail.
- **Stability:** coordinate transform valid · datum known · geometry valid · no-data reported.
- **Scalability:** low/medium/high fidelity · tileable/simplifiable · label suppression.
- **Efficiency:** lightweight geometry · point/line/polygon/mesh without heavy textures.
- **Succinctness:** one preferred label · aliases hidden unless selected · color law not overloaded.

## Consolidation 3 paste-ready task (for record)

> Normalize the merged catalog into a canonical object ontology. No new assets,
> troop details, maneuver icons, or tactical recommendations. For every
> duplicate/near-duplicate, select one preferred term and keep the rest as
> aliases. For each canonical term return: preferred term, aliases, parent
> category, environment relevance, geometry type, required metadata, visual
> symbol rule, SSSES gate, replay bundle field, public export behavior, internal/
> restricted behavior. Mission-support evidence objects only.
