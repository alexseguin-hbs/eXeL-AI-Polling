/**
 * SECURITY-2525 · VOXEL GRID — coordinate-addressed cube stacks (Vision-2525 3D law)
 * ==================================================================================
 * Every ground cell holds a vertical STACK of wireframe cubes, one per altitude band
 * (lib/voxel RANGE_EDGES). The cube BASE is addressed simultaneously by **MGRS**,
 * **LLV-DMS** and **UCRS-2525**; the Z index is the altitude band — so a cube is a
 * countable, snappable 3D address, not a floating stem.
 *
 * Pure module (no DOM, deterministic) so phone / Raspberry-Pi / low-compute render
 * heads share the exact same math. 1 fetch → altitude: columns read the SAME DEM
 * sampler the 2D contours use (makeDemSampler) — no second data path.
 */
import { latLonToUtm, utmToLatLon, latLonToMgrs, latBand } from "@/components/security-2525/mgrs";
// (imports above are pure math — no DOM/React; this module stays render-head agnostic)
import { altitudeBandM, BAND_LABELS, RANGE_EDGES, mFromFt } from "@/lib/voxel";

export interface VoxelObject {
  id: number | string;
  lat: number;
  lon: number;
  altM: number;                    // magnitude in metres — frame given by altRef
  altRef: "AGL" | "MSL";           // altitude visual law: labels always carry it
  label: string;
  color?: string;
}

export interface VoxelCube {
  bandIdx: number;                 // 0 = SURFACE cube (terrain), 1..7 airspace bands
  label: string;                   // BAND_LABELS[bandIdx] (ft)
  floorM: number;                  // band floor, m MSL
  ceilM: number;                   // band ceiling, m MSL (Infinity on 10k+)
  occupants: (number | string)[];  // object ids inside this cube
}

export interface VoxelColumnObject { id: number | string; label: string; color?: string; altM: number; altRef: "AGL" | "MSL"; mslM: number; bandIdx: number }

export interface VoxelColumn {
  key: string;                     // stable cell key: `${zone}${latBand}:${cellE}:${cellN}:${cellM}`
  lat: number;                     // cell CENTER
  lon: number;
  cellM: number;                   // cell size (m) — matches the visible UTM grid step
  terrainM: number;                // DEM elevation at the cell centre (the SURFACE cube)
  mgrs: string;                    // cube-base address 1/3 — MGRS at cell centre
  llv: string;                     // cube-base address 2/3 — LLV-DMS at cell centre
  ucrs: string;                    // cube-base address 3/3 — UCRS-2525 voxel index (no Z)
  ucrsDms: string;                 // UCRS-2525 angular form — 3600-scale D·M·S (base-60 honor)
  corners: { lat: number; lon: number }[]; // cube-top corners NW,NE,SE,SW (P1: corner hotspots)
  cubes: VoxelCube[];              // contiguous stack SURFACE→highest occupied band
  topM: number;                    // m MSL of the highest occupant (stack top)
  objects: VoxelColumnObject[];
}

/** LLV-DMS of a lat/lon — `29°56'24"N 81°59'12"W` (deterministic, floor seconds). */
export function fmtLLV(lat: number, lon: number): string {
  const part = (v: number, pos: string, neg: string) => {
    const hemi = v < 0 ? neg : pos;
    const a = Math.abs(v);
    const d = Math.floor(a);
    const mFull = (a - d) * 60;
    const m = Math.floor(mFull);
    const s = Math.floor((mFull - m) * 60);
    return `${d}°${String(m).padStart(2, "0")}'${String(s).padStart(2, "0")}"${hemi}`;
  };
  return `${part(lat, "N", "S")} ${part(lon, "E", "W")}`;
}

/**
 * UCRS-2525 — CANONICAL definition (Thought Master, 2026-07-09): UCRS-2525 IS the
 * LLV-DMS in base 3600, with N/S and E/W projections. Honors base-60 Sumerian:
 * the full circle is 3600 units and EVERY tier is 3600-scale — degrees ×10 →
 * UCRS-degrees, minutes = fraction × 3600 (vs 60), seconds = minute-fraction × 3600.
 * (The zone/cell voxel index below is labeled UCRS·CELL, distinct from this.)
 *
 * UNIVERSAL (P1.2, Christo + Thoth): the format is pure ANGLE — it carries no
 * Earth-specific datum, so any spherical body (Mars, Moon, exoplanet) adopts it
 * unchanged; only the reference meridian/equator is declared per body. Every tier
 * is 3600-scale, giving 60× finer subdivision than 60-unit DMS at each level.
 */
export function fmtUcrsDms(lat: number, lon: number): string {
  const part = (v: number, pos: string, neg: string) => {
    const hemi = v < 0 ? neg : pos;
    // decompose from rounded TOTAL UCRS-seconds — deterministic, no FP drift
    const tot = Math.round(Math.abs(v) * 10 * 3600 * 3600);
    const d = Math.floor(tot / (3600 * 3600));
    const m = Math.floor(tot / 3600) % 3600;
    const s = tot % 3600;
    return `${String(d).padStart(4, "0")}·${String(m).padStart(4, "0")}·${String(s).padStart(4, "0")}${hemi}`;
  };
  return `${part(lat, "N", "S")} ${part(lon, "E", "W")}`;
}

/**
 * UCRS-2525 voxel index of a cell base (+ optional Z band): zone/band + cell E/N
 * indices at `cellM` resolution — `UCRS 17R·E0521·N3345` / `…·Z3`. The native
 * 3D address of the cube lattice (drone-swarm ready: one drone ↔ one voxel).
 */
export function ucrsCellId(lat: number, lon: number, cellM: number, bandIdx?: number): string {
  const { zone, easting, northing } = latLonToUtm(lat, lon);
  const e = Math.floor(easting / cellM);
  const n = Math.floor(northing / cellM);
  const z = bandIdx != null ? `·Z${bandIdx}` : "";
  return `UCRS ${zone}${latBand(lat)}·E${String(e).padStart(4, "0")}·N${String(n).padStart(4, "0")}${z}`;
}

/**
 * UCRS·CELL v2 (P1.3 · F15, Thought Master): UNIVERSAL base-3600 cell address —
 * `UCRS 14R·0302.2674N·0977.1456W·r500m·Z3`
 * - zone·latband anchor the region (MGRS-familiar),
 * - lat/lon as UCRS-degrees (deg ×10 → 3600 full circle) with base-3600 MINUTES as
 *   the decimal tier: `3600.5` ≡ `3600·1800` — decimal ⇄ minute notation interchangeable,
 * - `r` = footprint RADIUS in metres (the asset/cell size — the only extent carried),
 * - optional `Z` altitude band. Body-agnostic (Mars/Moon) — VISION-2525 / LINK-2525.
 * One UCRS-minute ≈ 3 m of latitude → 1 m-class addressing with the radius qualifier.
 */
export function ucrsCell2(lat: number, lon: number, radiusM: number, bandIdx?: number): string {
  const part = (v: number, pos: string, neg: string) => {
    const hemi = v < 0 ? neg : pos;
    const tot = Math.round(Math.abs(v) * 10 * 3600); // total UCRS-minutes (deterministic)
    const d = Math.floor(tot / 3600), m = tot % 3600;
    return `${String(d).padStart(4, "0")}.${String(m).padStart(4, "0")}${hemi}`;
  };
  const { zone } = latLonToUtm(lat, lon);
  const z = bandIdx != null ? `·Z${bandIdx}` : "";
  return `UCRS ${zone}${latBand(lat)}·${part(lat, "N", "S")}·${part(lon, "E", "W")}·r${Math.round(radiusM)}m${z}`;
}

/** MSL metres of an object given its declared reference (AGL resolves via the sampler). */
export function objectMslM(o: VoxelObject, sampler: (lat: number, lon: number) => number): number {
  return o.altRef === "AGL" ? sampler(o.lat, o.lon) + o.altM : o.altM;
}

/** A stable 3D VOXEL address: grid cell (UTM square) + altitude band. */
export interface VoxelAddr { key: string; zone: number; cellE: number; cellN: number; bandIdx: number; centerLat: number; centerLon: number; cellM: number }

/**
 * PURE primitive — map a track position (lat/lon + MSL metres) to its stable 3D VOXEL
 * address (cell + altitude band). This is the ARCHITECTURE HOOK for the future voxel
 * PATH-TRAIL of a moving track ([[project_voxel_path_trail_vision]]): as an aircraft moves,
 * push voxelAddr(...).key into a Set and render each lit cell cheaply (Pi-class) — no
 * per-frame rebuild, no extra fetch, deterministic + dedupable by key. Altitude is a
 * first-class axis here so flying tracks trail through the air, ground tracks along terrain.
 * Same cell maths as buildVoxelColumns so trail cells line up exactly with the drawn grid.
 */
export function voxelAddr(lat: number, lon: number, mslM: number, cellM = 1000): VoxelAddr {
  const { zone, easting, northing } = latLonToUtm(lat, lon);
  const cellE = Math.floor(easting / cellM);
  const cellN = Math.floor(northing / cellM);
  let bandIdx = -1; // non-finite altitude → UNKNOWN band (voxel law: never a silent band)
  if (Number.isFinite(mslM)) bandIdx = altitudeBandM(mslM).index;
  const key = `${zone}${latBand(lat)}:${cellE}:${cellN}:${cellM}:Z${bandIdx}`;
  const { lat: centerLat, lon: centerLon } = utmToLatLon(zone, (cellE + 0.5) * cellM, (cellN + 0.5) * cellM, lat < 0);
  return { key, zone, cellE, cellN, bandIdx, centerLat, centerLon, cellM };
}

/**
 * Group objects into coordinate-addressed voxel columns.
 * - cell = UTM square of `cellM` metres (pass the visible grid step so cubes snap
 *   to the drawn 1km/100m grid); addresses computed at the cell CENTRE.
 * - stack is CONTIGUOUS from the SURFACE cube up to the highest occupied band —
 *   stackable cubes you can count, per the Divinity-lattice visual law.
 * - non-finite altitudes are EXCLUDED (voxel law: never a silent band).
 */
export function buildVoxelColumns(
  objects: VoxelObject[],
  sampler: (lat: number, lon: number) => number,
  cellM = 1000
): VoxelColumn[] {
  const byCell = new Map<string, { zone: number; south: boolean; cellE: number; cellN: number; objs: { o: VoxelObject; mslM: number; bandIdx: number }[] }>();
  for (const o of objects) {
    if (!Number.isFinite(o.altM) || !Number.isFinite(o.lat) || !Number.isFinite(o.lon)) continue;
    const mslM = objectMslM(o, sampler);
    const band = altitudeBandM(mslM);
    if (band.index < 0) continue; // SUBSURFACE/UNKNOWN — not an airspace cube
    const { zone, easting, northing } = latLonToUtm(o.lat, o.lon);
    const cellE = Math.floor(easting / cellM);
    const cellN = Math.floor(northing / cellM);
    const key = `${zone}${latBand(o.lat)}:${cellE}:${cellN}:${cellM}`;
    if (!byCell.has(key)) byCell.set(key, { zone, south: o.lat < 0, cellE, cellN, objs: [] });
    byCell.get(key)!.objs.push({ o, mslM, bandIdx: band.index });
  }

  const columns: VoxelColumn[] = [];
  for (const [key, c] of Array.from(byCell.entries())) {
    const { lat, lon } = utmToLatLon(c.zone, (c.cellE + 0.5) * cellM, (c.cellN + 0.5) * cellM, c.south);
    const terrainM = sampler(lat, lon);
    const top = Math.max(...c.objs.map((x: { bandIdx: number }) => x.bandIdx));
    const cubes: VoxelCube[] = [];
    for (let b = 0; b <= top; b++) {
      cubes.push({
        bandIdx: b,
        label: BAND_LABELS[b],
        floorM: b === 0 ? terrainM : mFromFt(RANGE_EDGES[b - 1]),
        ceilM: b === 0 ? terrainM : mFromFt(RANGE_EDGES[b]),
        occupants: c.objs.filter((x) => x.bandIdx === b).map((x) => x.o.id),
      });
    }
    columns.push({
      key, lat, lon, cellM, terrainM,
      mgrs: latLonToMgrs(lat, lon, 4),
      llv: fmtLLV(lat, lon),
      ucrs: ucrsCellId(lat, lon, cellM),
      ucrsDms: fmtUcrsDms(lat, lon),
      corners: ([
        [c.cellE * cellM, (c.cellN + 1) * cellM],       // NW
        [(c.cellE + 1) * cellM, (c.cellN + 1) * cellM], // NE
        [(c.cellE + 1) * cellM, c.cellN * cellM],       // SE
        [c.cellE * cellM, c.cellN * cellM],             // SW
      ] as [number, number][]).map(([e, n]) => utmToLatLon(c.zone, e, n, c.south)),
      cubes,
      topM: Math.max(...c.objs.map((x) => x.mslM)),
      objects: c.objs
        .map(({ o, mslM, bandIdx }) => ({ id: o.id, label: o.label, color: o.color, altM: o.altM, altRef: o.altRef, mslM, bandIdx }))
        .sort((a, b) => a.mslM - b.mslM),
    });
  }
  // deterministic order: south-west → north-east
  return columns.sort((a, b) => (a.lat - b.lat) || (a.lon - b.lon));
}

/**
 * Standalone VOXEL LATTICE — an n×n block of FULL-height stacked columns centred on a
 * coordinate, independent of any placed asset (HI: "see a whole stacked column outside
 * asset selection"). Each column carries every altitude band (SURFACE→10k+) as an empty
 * (unoccupied) wireframe cube, so you always get a tall countable stack whose TOP face is
 * clickable. Snapped to the same UTM `cellM` grid as buildVoxelColumns → cubes align.
 */
export function buildLatticeColumns(
  centerLat: number,
  centerLon: number,
  sampler: (lat: number, lon: number) => number,
  cellM = 1000,
  n = 3
): VoxelColumn[] {
  const { zone, easting, northing } = latLonToUtm(centerLat, centerLon);
  const south = centerLat < 0;
  const cellE0 = Math.floor(easting / cellM);
  const cellN0 = Math.floor(northing / cellM);
  const half = Math.floor(n / 2);
  const columns: VoxelColumn[] = [];
  for (let dj = half; dj >= -half; dj--) {          // north → south rows
    for (let di = -half; di <= half; di++) {        // west → east cols
      const cellE = cellE0 + di;
      const cellN = cellN0 + dj;
      const { lat, lon } = utmToLatLon(zone, (cellE + 0.5) * cellM, (cellN + 0.5) * cellM, south);
      const terrainM = sampler(lat, lon);
      const cubes: VoxelCube[] = [];
      for (let b = 0; b < RANGE_EDGES.length; b++) {  // full stack, all bands empty
        cubes.push({
          bandIdx: b,
          label: BAND_LABELS[b],
          floorM: b === 0 ? terrainM : mFromFt(RANGE_EDGES[b - 1]),
          ceilM: b === 0 ? terrainM : mFromFt(RANGE_EDGES[b]),
          occupants: [],
        });
      }
      columns.push({
        key: `LAT:${zone}${latBand(lat)}:${cellE}:${cellN}:${cellM}`,
        lat, lon, cellM, terrainM,
        mgrs: latLonToMgrs(lat, lon, 4),
        llv: fmtLLV(lat, lon),
        ucrs: ucrsCellId(lat, lon, cellM),
        ucrsDms: fmtUcrsDms(lat, lon),
        corners: ([
          [cellE * cellM, (cellN + 1) * cellM],       // NW
          [(cellE + 1) * cellM, (cellN + 1) * cellM], // NE
          [(cellE + 1) * cellM, cellN * cellM],       // SE
          [cellE * cellM, cellN * cellM],             // SW
        ] as [number, number][]).map(([e, nn]) => utmToLatLon(zone, e, nn, south)),
        cubes,
        topM: terrainM,
        objects: [],
      });
    }
  }
  return columns;
}
