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

/** MSL metres of an object given its declared reference (AGL resolves via the sampler). */
export function objectMslM(o: VoxelObject, sampler: (lat: number, lon: number) => number): number {
  return o.altRef === "AGL" ? sampler(o.lat, o.lon) + o.altM : o.altM;
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
