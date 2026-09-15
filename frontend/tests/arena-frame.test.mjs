// THE ARENA FRAME — the geodesy the whole domain stands on, and until now the only source file in it with
// no gate at all. Two of its exports, the lat/lon conversions, had no caller and no test: the frame every
// building, door and aircraft position is expressed in was resting on arithmetic nobody had ever checked.
import {
  M_PER_DEG_LAT, M_PER_DEG_LON, enuToLatLon, latLonToEnu, makeGroundSampler, isoContours,
} from '../lib/drone-2525/arena-frame.ts';
import { DRONE_DOMAIN } from '../lib/drone-2525/domain.gen.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const O = DRONE_DOMAIN.arena.origin;

// ── THE CONSTANTS ARE THE REAL ONES ─────────────────────────────────────────────────────────────
ok(Math.abs(M_PER_DEG_LAT - 110574) < 50, `a degree of latitude is about 110.6 km (${M_PER_DEG_LAT})`);
ok(Math.abs(M_PER_DEG_LON(0) - 111320) < 50, `and a degree of longitude at the equator about 111.3 km (${M_PER_DEG_LON(0).toFixed(0)})`);
ok(M_PER_DEG_LON(60) < M_PER_DEG_LON(0) * 0.55, 'longitude degrees shrink toward the poles');
ok(Math.abs(M_PER_DEG_LON(89.999)) < 100, 'and all but vanish at the pole');
ok(M_PER_DEG_LON(30) > M_PER_DEG_LON(45), 'monotonically');

// ── THE TWO CONVERSIONS ARE EACH OTHER'S INVERSE ────────────────────────────────────────────────
for (const [e, n] of [[0, 0], [100, 0], [0, 100], [-450, 450], [380, -260], [12.5, -7.25]]) {
  const ll = enuToLatLon(O, e, n);
  const back = latLonToEnu(O, ll);
  ok(Math.abs(back.east - e) < 0.01 && Math.abs(back.north - n) < 0.01,
     `(${e}, ${n}) survives the round trip through latitude and longitude (off by ${Math.abs(back.east - e).toFixed(4)} m)`);
}
ok(enuToLatLon(O, 0, 0).lat === O.lat && enuToLatLon(O, 0, 0).lon === O.lon, 'the origin is the origin');

// ── AND THEY POINT THE RIGHT WAY ────────────────────────────────────────────────────────────────
ok(enuToLatLon(O, 0, 100).lat > O.lat, 'north increases latitude');
ok(enuToLatLon(O, 0, -100).lat < O.lat, 'and south decreases it');
ok(enuToLatLon(O, 100, 0).lon > O.lon, 'east increases longitude');
ok(enuToLatLon(O, -100, 0).lon < O.lon, 'and west decreases it');
{
  // A real distance: the Capitol lawn is about 450 m to its edge, and that must come back as 450 m.
  const edge = enuToLatLon(O, 0, 450);
  const dLat = (edge.lat - O.lat) * M_PER_DEG_LAT;
  ok(Math.abs(dLat - 450) < 1, `450 m north really is 450 m of latitude (${dLat.toFixed(1)} m)`);
}

// ── THE GROUND SAMPLER ──────────────────────────────────────────────────────────────────────────
{
  const g = makeGroundSampler(DRONE_DOMAIN.arena.elevation);
  ok(Number.isFinite(g(0, 0)), 'the middle of the lawn has a height');
  ok(g(0, 0) > 100 && g(0, 0) < 300, `and it is plausible for Austin (${g(0, 0).toFixed(1)} m)`);
  ok(Number.isFinite(g(99999, 99999)), 'a point far outside the arena still returns a number, not a hole');
  ok(g(99999, 0) === g(9e9, 0), 'held at the edge rather than extrapolated into fiction');
  const a = g(12.5, -7.25);
  ok(g(12.5, -7.25) === a, 'and the same point gives the same height every time');
  let varies = false;
  for (let e = -400; e <= 400; e += 100) if (Math.abs(g(e, 0) - g(0, 0)) > 0.01) varies = true;
  ok(varies, 'the lawn is not flat — the sampler is reading the field, not returning a constant');
}

// ── THE CONTOURS ────────────────────────────────────────────────────────────────────────────────
{
  const field = DRONE_DOMAIN.arena.elevation;
  const flat = field.grid.flat();
  const lo = Math.ceil(Math.min(...flat)), hi = Math.floor(Math.max(...flat));
  const levels = []; for (let L = lo; L <= hi; L += 2) levels.push(L);
  const c = isoContours(field, levels);
  ok(c.length > 0 && c.length <= levels.length, `an entry for each level that the ground actually crosses (${c.length} of ${levels.length} asked)`);
  ok(c.some((x) => x.segs.length > 0), 'and the terrain really does produce contour lines');
  for (const x of c) {
    ok(levels.includes(x.level), `level ${x.level} is one that was asked for`);
    ok(x.segs.every((sg) => sg.length === 2 && sg[0].length === 2 && sg[1].length === 2), `level ${x.level}: each line is a segment between two points on the ground`);
    ok(x.segs.every((sg) => [...sg[0], ...sg[1]].every(Number.isFinite)), `level ${x.level}: with no holes in it`);
  }
  ok(isoContours(field, []).length === 0, 'asking for no levels draws nothing, rather than guessing some');
  const twice = isoContours(field, levels);
  ok(JSON.stringify(twice) === JSON.stringify(c), 'and the same field gives the same lines, twice');
  // A level the ground never reaches yields no entry at all rather than an empty one — the function
  // reports lines that exist, not levels that were asked about.
  const above = isoContours(field, [hi + 500]);
  ok(above.length === 0 || above[0].segs.length === 0, 'a level the ground never reaches produces no line');
}

console.log(`\narena-frame: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
