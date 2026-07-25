// SECURITY-2525 Paris tile-alignment guard (Council action #2).
// Locks the invariant that broke elsewhere as a 404-refetch loop: an AO's DEM key must have a
// present, schema-valid dem-<key>.json whose bbox FULLY covers the AO's zoomed-out view, and any
// osm key must have a present, schema-valid osm-<key>.json. Also checks the hand-authored Paris
// tiles are well-formed. Pure fs + regex — no network, no TS. Run:
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

// ── Extract the paris AO (center, halfKm, osm) from mission-planning.tsx ──────────────────
const ao = MP.match(/key:\s*"paris",\s*name:[^]*?center:\s*\[([-\d.]+),\s*([-\d.]+)\][^]*?halfKm:\s*([\d.]+)[^]*?osm:\s*"([^"]+)"/);
ok(!!ao, "paris AO present in AOS with center/halfKm/osm");
const [clat, clon, halfKm, osmKey] = ao ? [parseFloat(ao[1]), parseFloat(ao[2]), parseFloat(ao[3]), ao[4]] : [0, 0, 0, ""];

// ── Extract the paris DEM_INDEX bbox [W,S,E,N] ───────────────────────────────────────────
const dem = MP.match(/key:\s*"paris",\s*bbox:\s*\[([-\d.]+),\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)\]/);
ok(!!dem, "paris registered in DEM_INDEX");
const [W, S, E, N] = dem ? dem.slice(1, 5).map(Number) : [0, 0, 0, 0];

// ── Coverage: the zoomed-out AO view must sit INSIDE the DEM bbox (else pickDemKey 404-loops) ──
// pickDemKey uses halfKm*0.75 as the half-span it must cover.
const h = halfKm * 0.75;
const dLat = h / 110.574, dLon = h / (111.32 * Math.cos((clat * Math.PI) / 180));
ok(W <= clon - dLon && E >= clon + dLon && S <= clat - dLat && N >= clat + dLat,
  `DEM bbox fully covers the ${halfKm}km AO view (no 404 refetch loop)`);

// ── dem-<key>.json present + schema-valid + bbox matches the index ───────────────────────
const d = readJson(`dem-paris.json`);
ok(Array.isArray(d.elev) && d.elev.length === d.nx * d.ny, "dem-paris: elev length === nx*ny");
ok(d.elev.every((v) => Number.isFinite(v)), "dem-paris: all elevations finite");
ok(d.bbox[0] === W && d.bbox[1] === S && d.bbox[2] === E && d.bbox[3] === N, "dem-paris bbox === DEM_INDEX bbox");

// ── osm-<key>.json present + schema-valid ────────────────────────────────────────────────
ok(osmKey === "paris", "paris AO osm key === 'paris'");
const o = readJson(`osm-${osmKey}.json`);
ok(Array.isArray(o.roads) && o.roads.length > 0, "osm-paris: has roads");
ok(o.roads.every((r) => [2, 3, 4].includes(r.t) && Array.isArray(r.p) && r.p.length >= 2), "osm-paris: every road has a valid tier + polyline");
ok(o.roads.every((r) => r.p.every(([x, y]) => x >= W && x <= E && y >= S && y <= N)), "osm-paris: all road points inside the AOR bbox");
ok(Array.isArray(o.water) && o.water.length > 0, "osm-paris: Seine waterway present");

// ── The 3D landmark (Place des Victoires) is wired into the paris AO ──────────────────────
ok(/buildings:\s*\[PLACE_DES_VICTOIRES\]/.test(MP), "Place des Victoires 3D landmark attached to paris AO");
ok(/const PLACE_DES_VICTOIRES: Building = \{[^]*?dome:/.test(MP), "PLACE_DES_VICTOIRES building defined with a dome (Louis XIV monument)");

console.log(`\nSECURITY-PARIS-TILES ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
