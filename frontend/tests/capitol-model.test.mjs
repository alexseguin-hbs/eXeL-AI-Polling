// THE CAPITOL IS ONE BUILDING, MEASURED (operator 2026-10-13: "enhance capital of texas using online images to make
// more realistic outline ... to mimic 3D structure of capital and capital lawn (including trees").
//
// The deck is a standalone static file and cannot import the arena record, so its numbers are literals. This gate is
// what keeps those literals honest: the building's extents are compared to the SOURCED dimensions, and the grounds —
// the tree rows and the streets — are compared to docs/drone-2525/drone-2525.v00.00.json itself, converted by the one
// transform between the two frames (deck z = -(record y)). A number that drifts in either carrier fails here.
//
// THE NUMBERS ARE NOT TYPED HERE. They live once, with their source, their quote and how they were obtained, in
// docs/drone-2525/CAPITOL_SOURCES.json, and this gate reads that file — so the deck and the sidecar are two carriers
// of one master and a drift in either fails. Said plainly, because the round was right to press on it: outbound HTTP
// is blocked in the build container, so those figures came through search synthesis of the cited pages rather than
// from opening them. This gate therefore catches LATER DRIFT; it cannot catch a wrong original.
import { readFileSync } from 'node:fs';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const html = readFileSync('public/drone-2525/play.html', 'utf8');
const rec = JSON.parse(readFileSync('../docs/drone-2525/drone-2525.v00.00.json', 'utf8'));
const law = readFileSync('lib/wire-core/vector-law.ts', 'utf8');
const SRC = JSON.parse(readFileSync('../docs/drone-2525/CAPITOL_SOURCES.json', 'utf8'));
const dim = (id) => { const d = SRC.dimensions.find((x) => x.id === id); if (!d) { fail++; console.log('FAIL: the sources file no longer carries', id); return NaN; } return d.metres; };

const lift = (re, what) => { const m = html.match(re); if (!m) { fail++; console.log('FAIL: the deck no longer declares', what); return null; } return m[0]; };
const srcCAP = lift(/const CAP=\{[^}]+\};/, 'CAP'); const srcFP = lift(/const CAP_FP=\[.*?\];/, 'CAP_FP');
const srcTR = lift(/const CAP_TREES=\[.*?\];/, 'CAP_TREES'); const srcRD = lift(/const CAP_ROADS=\[.*?\];/, 'CAP_ROADS');
const srcW = lift(/const WEIGHT=\{[^}]+\};/, 'WEIGHT'); const srcDOME = lift(/const CAP_DOME=\[.*?\];/, 'CAP_DOME');
if (srcCAP && srcFP && srcTR && srcRD && srcW && srcDOME) {
  const { CAP, CAP_FP, CAP_TREES, CAP_ROADS, WEIGHT, CAP_DOME } =
    new Function(`${srcW}${srcCAP}${srcFP}${srcDOME}${srcTR}${srcRD}return {CAP,CAP_FP,CAP_TREES,CAP_ROADS,WEIGHT,CAP_DOME};`)();

  /* the sourced building */
  const near = (a, b, t = 0.02) => Math.abs(a - b) <= t;
  ok(near(CAP.EW * 2, dim('ewLengthM'), 0.02), `E-W greatest length ${dim('ewLengthM')} m by the sources file; the deck draws ${(CAP.EW * 2).toFixed(2)}`);
  ok(near(CAP.NS * 2, dim('nsBlockM'), 0.02), `the central block ${dim('nsBlockM')} m north-south by the sources file; the deck draws ${(CAP.NS * 2).toFixed(2)}`);
  ok(near(CAP.STAR, dim('starTipM'), 0.01), `the star's tip ${dim('starTipM')} m above the south grade by the sources file; the deck draws ${CAP.STAR}`);
  ok(near(CAP.GOD, dim('goddessM'), 0.01), `the Goddess of Liberty ${dim('goddessM')} m by the sources file; the deck draws ${CAP.GOD}`);
  ok(near(CAP.ROT * 2, dim('rotundaM'), 0.02), `the rotunda ${dim('rotundaM')} m across by the sources file; the deck draws ${(CAP.ROT * 2).toFixed(2)}`);
  ok(CAP.COREY > CAP.WINGY && CAP.WINGY > 0, `the central block stands above the wings (${CAP.COREY} m over ${CAP.WINGY} m)`);

  /* the footprint is the record's own cruciform, carried in shape and corrected in size */
  const recFP = rec.buildings.find((b) => b.id === 'capitol').footprint;
  ok(CAP_FP.length === 12 && recFP.length === 12, `a twelve-vertex Greek cross in both carriers (deck ${CAP_FP.length}, record ${recFP.length})`);
  const sign = (p) => p.map(([x, y]) => `${Math.sign(x)},${Math.sign(y)}`).join(' ');
  ok(sign(CAP_FP) === sign(recFP.map(([x, y]) => [x, -y])), 'the deck carries the record’s own cruciform, vertex for vertex, under the one transform z = -(record y) — not re-authored');
  const recNS = Math.max(...recFP.map(([, y]) => Math.abs(y)));
  if (Math.abs(recNS - CAP.NS) > 0.5) console.log(`OWED: the arena record still carries the Capitol ±${recNS} m north-south, ${((recNS / CAP.NS - 1) * 100).toFixed(1)}% deeper than the sourced 289 ft; the record and components/security-2525/mission-planning.tsx (where it is carried from) are corrected together, as their own change.`);

  /* the dome's profile is a profile: it only narrows, and it ends under the Goddess */
  ok(CAP_DOME.every((p, i) => i === 0 || (p[0] >= CAP_DOME[i - 1][0] && p[1] <= CAP_DOME[i - 1][1])), 'the dome profile rises and never widens');
  ok(near(CAP_DOME[0][0], CAP.COREY, 0.01) && CAP_DOME[CAP_DOME.length - 1][0] < CAP.STAR - CAP.GOD + 0.01, 'the dome starts on the central block and stops under the Goddess’s feet');

  /* the grounds are the record's */
  const rows = rec.treeRows;
  ok(CAP_TREES.length === rows.length, `every tree row of the record is in the deck (${CAP_TREES.length} of ${rows.length})`);
  const trOK = CAP_TREES.every((t, i) => {
    const r = rows[i]; return r && t[0] === r.from[0] && t[1] === r.from[1] && t[2] === r.to[0] && t[3] === r.to[1] && t[4] === r.count && t[5] === r.trunkH && t[6] === r.canopyR && t[7] === r.canopyH;
  });
  ok(trOK, 'each tree row carries the record’s own ends, count, trunk, canopy radius and canopy height — his "capital lawn (including trees)"');
  const recRoads = rec.roads.filter((r) => r.id !== 'greatwalk').map((r) => JSON.stringify(r.p));
  ok(CAP_ROADS.length === recRoads.length && CAP_ROADS.every((p, i) => JSON.stringify(p) === recRoads[i]), `the bounding streets are the record’s, in its order (${CAP_ROADS.length} of ${recRoads.length})`);

  /* the weight ladder is the repo's one ladder, and the deck uses all of it */
  const m = law.match(/stroke:\s*\{\s*hairline:\s*([\d.]+),\s*normal:\s*([\d.]+),\s*bold:\s*([\d.]+)/);
  ok(!!m, 'lib/wire-core/vector-law.ts still declares the stroke ladder the deck borrows');
  if (m) ok(WEIGHT.hair === +m[1] && WEIGHT.norm === +m[2] && WEIGHT.bold === +m[3], `the deck’s three weights ARE the vector law’s (${m[1]} / ${m[2]} / ${m[3]}); the deck has ${WEIGHT.hair} / ${WEIGHT.norm} / ${WEIGHT.bold}`);
}

/* the subject is drawn outside the budget, and the law that says so is in the served bytes */
ok(/if\(!g\.own\|\|S\.maj<g\.lod\) return; segsOwn\(g\.s,g\.c,g\.w\);/.test(html), 'DD-38: the scene’s subject is painted by segsOwn — counted, never dropped');
ok(/if\(g\.own\|\|S\.maj<g\.lod\) return; segs\(g\.s,g\.c,g\.w\);/.test(html), 'DD-39: everything that is not the subject stays inside the world budget and drops first');
ok(/function add\(n,c,s,o\)\{if\(!OK\.has\(c\)\)throw 0;o=o\|\|\{\};WIRE\.g\.push\(\{n,c,s,w:o\.w\|\|1,own:!!o\.own,lod:o\.lod\|\|1\}\);\}/.test(html), 'a group carries its weight, its subject flag and the fidelity it needs — and the thirteen-colour throw is still the first thing add() does');
ok(/const fine=!S\|\|S\.maj>1;/.test(html) && /function bullseye\(x,y,z,segs,fine\)/.test(html), 'at the VECTOR band a door wears a cross, not two rings — the 328 segments that starved the Capitol');
ok(/\(chNum\(\)!==0\?2400:155\)\/z/.test(html), 'the overhead view rises to frame the Capital’s grounds, and the range keeps its own height exactly');

ok(SRC.dimensions.every((d) => d.source && d.quote && d.how), 'every sourced dimension carries where it came from, the sentence it came from, and how it was obtained');
ok(SRC.declared.every((d) => d.why), 'every DECLARED number says why it is declared rather than sourced');
/* the Great Walk, drawn from the same master */
{ const w = (html.match(/const w=([\d.]+), z0=CAP\.NS\+13/) || [])[1]; ok(w && Math.abs(+w * 2 - dim('greatWalkWidthM')) < 0.02, `the Great Walk is ${dim('greatWalkWidthM')} m wide by the sources file; the deck draws ${w ? (+w * 2).toFixed(2) : 'it differently'}`); }

console.log(`\ncapitol-model: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
