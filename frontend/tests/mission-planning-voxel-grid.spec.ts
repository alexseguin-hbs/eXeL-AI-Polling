import { test, expect } from "@playwright/test";
import { buildVoxelColumns, fmtLLV, fmtUcrsDms, ucrsCellId, objectMslM, type VoxelObject } from "../lib/voxel-grid";
import { latLonToMgrs } from "../components/security-2525/mgrs";
import { mFromFt } from "../lib/voxel";

// SECURITY-2525 · VOXEL GRID — coordinate-addressed cube stacks (pure math proof).
// Vision-2525 law: every cube BASE = MGRS + LLV-DMS + UCRS-2525; Z = altitude band.

const flat100 = () => 100; // flat terrain sampler, 100 m MSL
const CAP = { lat: 30.27467, lon: -97.74035 }; // Texas Capitol

const obj = (o: Partial<VoxelObject> & { id: number | string }): VoxelObject => ({
  lat: CAP.lat, lon: CAP.lon, altM: 500, altRef: "MSL", label: "X-BAT", ...o,
});

test("fmtLLV formats deterministic DMS with hemispheres", () => {
  expect(fmtLLV(30.5, -97.5)).toBe(`30°30'00"N 97°30'00"W`);
  expect(fmtLLV(-12.25, 45.75)).toBe(`12°15'00"S 45°45'00"E`);
});

test("ucrsCellId carries zone+band, padded E/N cell indices and optional Z band", () => {
  const base = ucrsCellId(CAP.lat, CAP.lon, 1000);
  expect(base).toMatch(/^UCRS 14R·E\d{4}·N\d{4}$/);
  expect(ucrsCellId(CAP.lat, CAP.lon, 1000, 3)).toBe(`${base}·Z3`);
  // deterministic — same input, same address
  expect(ucrsCellId(CAP.lat, CAP.lon, 1000)).toBe(base);
});

test("fmtUcrsDms: EVERY tier 3600-scale (base-60 honor) — degrees×10, minutes/3600, seconds/3600", () => {
  expect(fmtUcrsDms(30, -90)).toBe("0300·0000·0000N 0900·0000·0000W");
  // 30.05° → 300.5 UCRS-deg → d=300, m=0.5×3600=1800
  expect(fmtUcrsDms(30.05, 0)).toBe("0300·1800·0000N 0000·0000·0000E");
  // minute-fraction feeds a 3600-scale seconds tier: 30.001° → 300.01 → m=36, s=0
  expect(fmtUcrsDms(30.001, 0)).toBe("0300·0036·0000N 0000·0000·0000E");
  expect(fmtUcrsDms(-12.25, 45.75)).toBe("0122·1800·0000S 0457·1800·0000E");
});

test("objectMslM: AGL resolves through the terrain sampler, MSL passes through", () => {
  expect(objectMslM(obj({ id: 1, altM: 200, altRef: "AGL" }), flat100)).toBe(300);
  expect(objectMslM(obj({ id: 2, altM: 747, altRef: "MSL" }), flat100)).toBe(747);
});

test("same-cell objects group into ONE column; addresses match the cell centre", () => {
  const cols = buildVoxelColumns(
    // NB: Capitol northing sits 11 m from a 1 km cell edge — offset SOUTH to stay in-cell
    [obj({ id: 1, altM: 747, altRef: "MSL" }), obj({ id: 2, altM: 400, altRef: "AGL", lat: CAP.lat - 0.0005 })],
    flat100, 1000
  );
  expect(cols).toHaveLength(1);
  const c = cols[0];
  expect(c.objects).toHaveLength(2);
  expect(c.mgrs).toBe(latLonToMgrs(c.lat, c.lon, 4));
  expect(c.ucrs).toMatch(/^UCRS 14R·E\d{4}·N\d{4}$/);
  expect(c.llv).toMatch(/"N \d+°\d+'\d+"W$/);
});

test("distant objects land in separate columns, ordered SW→NE deterministically", () => {
  const cols = buildVoxelColumns(
    [obj({ id: "n", lat: CAP.lat + 0.1 }), obj({ id: "s", lat: CAP.lat - 0.1 })],
    flat100, 1000
  );
  expect(cols).toHaveLength(2);
  expect(cols[0].objects[0].id).toBe("s"); // south first
});

test("stack is CONTIGUOUS from SURFACE to the top occupied band (countable cubes)", () => {
  // 747 m MSL ≈ 2450 ft → band 3; expect cubes 0..3 with 1..2 empty (dashed) between
  const cols = buildVoxelColumns([obj({ id: 1, altM: 747, altRef: "MSL" })], flat100, 1000);
  const c = cols[0];
  expect(c.cubes.map((cb) => cb.bandIdx)).toEqual([0, 1, 2, 3]);
  expect(c.cubes[3].occupants).toEqual([1]);
  expect(c.cubes[1].occupants).toEqual([]);
  expect(c.objects[0].bandIdx).toBe(3);
  // band-3 cube floor/ceil = 1,000/2,500 ft in metres
  expect(c.cubes[3].floorM).toBeCloseTo(mFromFt(1000), 6);
  expect(c.cubes[3].ceilM).toBeCloseTo(mFromFt(2500), 6);
});

test("AGL object over terrain converts before banding (300m AGL over 100m = ~1312 ft → band 3)", () => {
  const cols = buildVoxelColumns([obj({ id: 1, altM: 300, altRef: "AGL" })], flat100, 1000);
  expect(cols[0].objects[0].mslM).toBe(400);
  expect(cols[0].objects[0].bandIdx).toBe(3);
});

test("non-finite altitude is EXCLUDED — never a silent cube (voxel law)", () => {
  const cols = buildVoxelColumns([obj({ id: 1, altM: NaN }), obj({ id: 2, altM: 747, altRef: "MSL" })], flat100, 1000);
  expect(cols).toHaveLength(1);
  expect(cols[0].objects.map((o) => o.id)).toEqual([2]);
});

test("terrainM at the column = sampler at cell centre; topM = highest occupant MSL", () => {
  const cols = buildVoxelColumns(
    [obj({ id: 1, altM: 747, altRef: "MSL" }), obj({ id: 2, altM: 1830, altRef: "MSL" })],
    flat100, 1000
  );
  expect(cols[0].terrainM).toBe(100);
  expect(cols[0].topM).toBe(1830);
});
