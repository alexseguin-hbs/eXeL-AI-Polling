// THE LAWN'S ONE AIR TRACK IS THE FOIL (Drone-2525 r.223; operator 2026-10-21: "Draw the one lawn air track from
// docs/drone-2525/exports/foil-1.111.wire.json. It is real: 901 vertices, 1755 edges, span 1.111 m, nose to rear 0.7777 m. Do
// not hand-edit it. It is generated. Do not use foil-11.111. Do not use the .obj, .cpp, .cs, or .py. Do not fetch anything.
// The pictures in docs/drone-2525/foil-package/ are the check, not a second model. Stroke only. No fill.").
//
// The served deck (and the carried HEAD) embed the wire's vertices and edges, and the silhouette the one foil generator
// derives from the same model, VERBATIM — flattened, the export's own numbers — between /*FOIL_V*/…/*FOIL_V_END*/,
// /*FOIL_E*/…/*FOIL_E_END*/ and /*FOIL_S*/…/*FOIL_S_END*/. This gate holds the embedded numbers equal to the two export
// files number for number (so a hand-edited or substituted model refuses), the drawer to stroke only (no fill of any kind),
// the lawn's drone branch to foilDraw (every other drone keeps its box), and the full-scale foil-11.111 OUT of the deck.
// The exports themselves are held to the generator by test:foil-model (build-foil-model --check), which runs beside this.
//
// Node-only (no browser): what the foil looks like on the glass is the deck's own boot row THE_LAWN_TRACK_IS_THE_FOIL
// (silhouette at 1×, the wire at 30×, wider than tall head-on), measured at four viewports by scripts/drone-deck-qa.mjs.
// In BOTH test:ci and prebuild, so a red one fails the Cloudflare build too (the r.208 precedent).
import fs from 'node:fs';
import path from 'node:path';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const ROOT = process.env.DECK_ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const { DECK_REV } = await import(path.join(ROOT, 'frontend/tests/deck-head.mjs'));
const servedPath = process.env.DECK_FOIL_FILE || path.join(ROOT, 'frontend/public/drone-2525/play.html');
const served = fs.readFileSync(servedPath, 'utf8');
const carriedPath = path.join(ROOT, `docs/drone-2525/operator-deck/drone-2525_r.${DECK_REV}.html`);
const carried = process.env.DECK_FOIL_FILE ? served : (fs.existsSync(carriedPath) ? fs.readFileSync(carriedPath, 'utf8') : '');
const WIRE = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/drone-2525/exports/foil-1.111.wire.json'), 'utf8'));
const SIL = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/drone-2525/exports/foil-1.111.silhouette.json'), 'utf8'));
const manifest = fs.readFileSync(path.join(ROOT, 'frontend/tests/deck-qa-manifest.mjs'), 'utf8');

const block = (src, tag) => { const m = src.match(new RegExp(`/\\*${tag}\\*/(\\[[^\\]]*\\])/\\*${tag}_END\\*/`)); return m ? JSON.parse(m[1]) : null; };
const near = (a, b, t = 1e-3) => Math.abs(a - b) <= t;
const ext = (V, i) => { let lo = Infinity, hi = -Infinity; for (let k = i; k < V.length; k += 3) { if (V[k] < lo) lo = V[k]; if (V[k] > hi) hi = V[k]; } return hi - lo; };

// 1 · the exports are the demo foil the operator named, and they are what the generator says they are
ok(WIRE.meta && WIRE.meta.id === 'foil-1.111' && WIRE.units === 'm', 'the wire export is foil-1.111 in metres');
ok(WIRE.frame && WIRE.frame.forward === 'x' && WIRE.frame.right === 'y' && WIRE.frame.up === 'z', 'the wire frame is nose +x, starboard +y, up +z');
ok(WIRE.vertices.length === 901 && WIRE.edges.length === 1755, `the export carries 901 vertices and 1755 edges (has ${WIRE.vertices.length} / ${WIRE.edges.length})`);
ok(near(WIRE.dimensionsM.span, 1.111) && near(WIRE.dimensionsM.noseToTail, 0.7777), `the export is the 1.111 m × 0.7777 m demo foil (${JSON.stringify(WIRE.dimensionsM)})`);
ok(SIL.meta && SIL.meta.of === 'foil-1.111' && SIL.meta.generator === 'scripts/build-foil-model.mjs', 'the silhouette is the generator\'s, of foil-1.111');
ok(Array.isArray(SIL.segments) && SIL.segments.length >= 60 && SIL.segments.length <= 200 && SIL.segments.every((s) => s.length === 2 && s[0].length === 3 && s[1].length === 3), `the silhouette is a list of 3-D segments in the expected band (${SIL.segments.length})`);

// 2 · the served deck embeds the export's numbers, verbatim
const V = block(served, 'FOIL_V'), E = block(served, 'FOIL_E'), S = block(served, 'FOIL_S');
ok(V && E && S, 'the served deck carries the three foil blocks (FOIL_V, FOIL_E, FOIL_S)');
if (V && E && S) {
  const wv = WIRE.vertices.flat(), we = WIRE.edges.flat(), ss = SIL.segments.flat(2);
  ok(V.length === 901 * 3 && V.length === wv.length && V.every((n, i) => n === wv[i]), 'the embedded vertices equal the export, number for number (901 × 3)');
  ok(E.length === 1755 * 2 && E.length === we.length && E.every((n, i) => n === we[i]), 'the embedded edges equal the export, index for index (1755 × 2)');
  ok(E.every((i) => Number.isInteger(i) && i >= 0 && i < 901), 'every embedded edge index names an embedded vertex');
  ok(S.length === SIL.segments.length * 6 && S.length === ss.length && S.every((n, i) => n === ss[i]), `the embedded silhouette equals the generator's, number for number (${SIL.segments.length} × 6)`);
  ok(near(ext(V, 1), 1.111) && near(ext(V, 0), 0.7777) && near(ext(V, 2), WIRE.dimensionsM.depth), `the embedded wire measures span ${ext(V, 1).toFixed(4)} · nose-to-tail ${ext(V, 0).toFixed(4)} · depth ${ext(V, 2).toFixed(4)} m`);
  ok(V.every(Number.isFinite) && S.every(Number.isFinite), 'no NaN or infinity in the embedded numbers');
}
ok(served.split('/*FOIL_V*/')[1] && !/foil-11\.111/.test(served.split('/*FOIL_V*/')[1].split('</script>')[0]), 'the full-scale foil-11.111 is not embedded');

// 3 · the drawer strokes and never fills; the lawn's one track takes it, every other drone keeps the box
const fd = served.match(/function foilDraw\(d,c,v,cam,W,H,fw\)\{[\s\S]*?\n\}/);
ok(!!fd, 'foilDraw(d,c,v,cam,W,H,fw) is defined once');
if (fd) {
  ok(/v\.stroke\(\)/.test(fd[0]) && !/\.fill\(|fillRect|fillText|fillStyle/.test(fd[0]), 'foilDraw strokes only — no fill of any kind');
  ok(/foilWire\(\)/.test(fd[0]) && /foilSil\(\)/.test(fd[0]) && /foilFullPx\(\)/.test(fd[0]), 'foilDraw reads the wire, the silhouette and the one threshold');
  ok(/foilAtt\(d\)/.test(fd[0]) && /foilToDeck\(d,px,py,pz,A\)/.test(fd[0]), 'foilDraw turns every point by the track\'s attitude (the foil rotates — operator: "top point is front")');
  ok(/state\.foilSegs\+\+/.test(fd[0]) && !/state\.segs\+\+|state\.ownSegs/.test(fd[0]), 'the foil is counted on its own counter, never the world budget or the Capitol\'s own band');
}
ok((served.match(/function foilDraw\(/g) || []).length === 1 && (served.match(/function foilWire\(/g) || []).length === 1 && (served.match(/function foilSil\(/g) || []).length === 1, 'foilDraw, foilWire and foilSil are each defined exactly once');
const fa = served.match(/function foilAtt\(d\)\{[\s\S]*?\n\}/), ft = served.match(/function foilToDeck\(d,px,py,pz,A\)\{[\s\S]*?\n\}/);
ok(!!fa && !!ft && (served.match(/function foilAtt\(/g) || []).length === 1 && (served.match(/function foilToDeck\(/g) || []).length === 1, 'foilAtt and foilToDeck are each defined exactly once');
if (fa && ft) {
  ok(/d\.att/.test(fa[0]) && /d\.vx/.test(fa[0]) && /d\.yaw/.test(fa[0]) && /Math\.PI\/2/.test(fa[0]), 'the attitude has its four sources: an explicit d.att, the velocity, a numeric d.yaw, else the nose-up hover');
  ok(/A\.roll/.test(ft[0]) && /A\.pitch/.test(ft[0]) && /A\.yaw/.test(ft[0]) && /return \[d\.x\+X,d\.y\+Y,d\.z\+Z\]/.test(ft[0]), 'foilToDeck applies roll, pitch and yaw and lands at the track\'s own place');
}
ok(/function foilFullPx\(\)\{ return 120; \}/.test(served), 'the wire-or-silhouette threshold is declared: 120 px of projected span');
ok((served.match(/state\.foilSegs=0;state\.foilCulled=0;/g) || []).length === 1, 'the foil counter is reset once per frame with the others');
const branch = "if(capIntro()&&d===capIntroTrack()){ foilDraw(d,c,v,cam,W,H,fw); return; }";
ok(served.split(branch).length === 2, 'the drone painter sends the lawn\'s one air track, and only it, to foilDraw');
ok(served.indexOf(branch) > 0 && served.indexOf('segs(box(d.x,d.y,d.z,1.8,.5,1.8),c);', served.indexOf(branch)) > 0, 'every other drone still draws the box and the cross after the branch');

// 4 · the boot row exists in the deck and in the exact-set manifest; the carried HEAD carries the same foil
ok((served.match(/'THE_LAWN_TRACK_IS_THE_FOIL'/g) || []).length === 4, 'the boot row THE_LAWN_TRACK_IS_THE_FOIL is in the deck (guard, push, catch-guard, catch-push)');
ok(/"THE_LAWN_TRACK_IS_THE_FOIL"/.test(manifest), 'THE_LAWN_TRACK_IS_THE_FOIL is in tests/deck-qa-manifest.mjs');
ok(carried.length > 0, `the carried deck drone-2525_r.${DECK_REV}.html exists`);
if (carried.length && !process.env.DECK_FOIL_FILE) {
  const cv = block(carried, 'FOIL_V'), ce = block(carried, 'FOIL_E'), cs = block(carried, 'FOIL_S');
  ok(cv && ce && cs && JSON.stringify(cv) === JSON.stringify(V) && JSON.stringify(ce) === JSON.stringify(E) && JSON.stringify(cs) === JSON.stringify(S), 'the carried HEAD embeds the same foil as the served deck');
}

console.log(`deck-foil: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
