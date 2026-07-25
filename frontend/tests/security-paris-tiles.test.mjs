// SECURITY-2525 Paris tile-alignment guard (Council action #2).
// Locks the invariant whose absence caused a 404-refetch-loop risk: for each Paris AO, the DEM
// key must have a present, schema-valid dem-<key>.json whose bbox FULLY covers the AO's zoomed-out
// view, and the osm key must have a present, schema-valid osm-<key>.json with every way inside the
// AOR bbox. Also checks the Place des Victoires 3D landmark. Pure fs + regex — no network. Run:
//   node tests/security-paris-tiles.test.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUB = join(ROOT, "public", "security-2525");
const MP = readFileSync(join(ROOT, "components", "security-2525", "mission-planning.tsx"), "utf8");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const readJson = (p) => JSON.parse(readFileSync(join(PUB, p), "utf8"));

for (const key of ["paris", "paris100"]) {
  // AO center/halfKm/osm
  const ao = MP.match(new RegExp(`key:\\s*"${key}",\\s*name:[^]*?center:\\s*\\[([-\\d.]+),\\s*([-\\d.]+)\\][^]*?halfKm:\\s*([\\d.]+)[^]*?osm:\\s*"([^"]+)"`));
  ok(!!ao, `${key}: AO present with center/halfKm/osm`);
  if (!ao) continue;
  const clat = +ao[1], clon = +ao[2], halfKm = +ao[3], osmKey = ao[4];

  // DEM_INDEX bbox [W,S,E,N]
  const dem = MP.match(new RegExp(`key:\\s*"${key}",\\s*bbox:\\s*\\[([-\\d.]+),\\s*([-\\d.]+),\\s*([-\\d.]+),\\s*([-\\d.]+)\\]`));
  ok(!!dem, `${key}: registered in DEM_INDEX`);
  if (!dem) continue;
  const [W, S, E, N] = dem.slice(1, 5).map(Number);

  // Coverage: zoomed-out view (halfKm*0.75) must sit inside the DEM bbox → no 404 refetch loop
  const h = halfKm * 0.75;
  const dLat = h / 110.574, dLon = h / (111.32 * Math.cos((clat * Math.PI) / 180));
  ok(W <= clon - dLon && E >= clon + dLon && S <= clat - dLat && N >= clat + dLat,
    `${key}: DEM bbox fully covers the ${halfKm}km view (no 404 loop)`);

  // dem tile present + schema + bbox match
  const d = readJson(`dem-${key}.json`);
  ok(Array.isArray(d.elev) && d.elev.length === d.nx * d.ny, `${key}: dem elev length === nx*ny`);
  ok(d.elev.every((v) => Number.isFinite(v)), `${key}: dem elevations all finite`);
  ok(d.bbox[0] === W && d.bbox[1] === S && d.bbox[2] === E && d.bbox[3] === N, `${key}: dem bbox === DEM_INDEX bbox`);

  // osm tile present + schema + all points inside AOR bbox
  const o = readJson(`osm-${osmKey}.json`);
  ok(Array.isArray(o.roads) && o.roads.length > 0, `${key}: osm has roads`);
  ok(o.roads.every((r) => [2, 3, 4].includes(r.t) && Array.isArray(r.p) && r.p.length >= 2), `${key}: every road has valid tier + polyline`);
  ok(o.roads.every((r) => r.p.every(([x, y]) => x >= W && x <= E && y >= S && y <= N)), `${key}: all road points inside DEM/AOR bbox`);
  ok(Array.isArray(o.water) && o.water.length > 0, `${key}: waterway present`);
}

// The 3D landmark (Place des Victoires) is wired into the 10km paris AO
ok(/buildings:\s*\[PLACE_DES_VICTOIRES\]/.test(MP), "Place des Victoires 3D landmark attached to paris AO");
ok(/const PLACE_DES_VICTOIRES: Building = \{[^]*?dome:/.test(MP), "PLACE_DES_VICTOIRES building defined with a dome");

console.log(`\nSECURITY-PARIS-TILES ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
