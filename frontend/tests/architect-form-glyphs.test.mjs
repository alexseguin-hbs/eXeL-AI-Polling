#!/usr/bin/env node
/**
 * ARCHITECT-2525 · FORM GLYPHS — the three Simulate column-head icons' lines CONNECT (operator 2026-10-31, three zoomed
 * screenshots: "enhance iconology so lines connect better").
 *
 * The law (components/architect-2525/simulate-options.tsx · FormGlyph): every glyph is built from named vertices and every stroke
 * endpoint is one of them; one stroke width for both colours; round joins and caps; faces are closed polygons sharing corners.
 *   Cube       — oblique projection p(x,y,z) = (9 + 16x + 4z, 26 − 16y − 4z) of the unit cube; three closed visible faces; a 3×3
 *                grid on EACH face whose line ends lie on that face's edges (the 3×3×3 reading).
 *   Tiny Home  — the same projection, ox 3 · oy 25 · w 20 · h 12 · d 6; three closed faces; the door an open path inside the front
 *                face with both feet ON the base edge.
 *   Eco-Sphere — arc centre (16,24) r 12, its ends = the base line's ends; every lattice endpoint ON the arc (30° steps), ON the
 *                base (x 4·10·16·22·28) or the hub (16,18); no segment leaves the dome.
 * Source-level: the SVGs are parsed out of the TSX (M/L/A/Z path commands), so a drifted coordinate fails here, not on his phone.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = fs.readFileSync(path.join(ROOT, "components/architect-2525/simulate-options.tsx"), "utf8");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const near = (a, b, eps = 0.011) => Math.abs(a - b) <= eps;
const samePt = (p, q, eps = 0.011) => near(p[0], q[0], eps) && near(p[1], q[1], eps);

// ── parse the three <svg data-arch-glyph="…"> blocks ────────────────────────────────────────────────────────────────────────
function glyph(id) {
  const m = SRC.match(new RegExp(`<svg[^>]*data-arch-glyph="${id}"[^>]*>([\\s\\S]*?)</svg>`));
  ok(!!m, `glyph "${id}" is rendered as an <svg data-arch-glyph="${id}">`);
  const body = m ? m[1] : "";
  const paths = [...body.matchAll(/<path\s+d="([^"]+)"([^>]*)\/>/g)].map((x) => ({ d: x[1], attrs: x[2] }));
  return { body, paths };
}
/** Path d → { segments: [[p,q],…], closed: bool, points: [...] } — M/L/A/Z only (what the glyphs use). */
function parsePath(d) {
  const toks = d.replace(/([MLAZ])/g, " $1 ").trim().split(/[\s,]+/);
  const segs = []; let cur = null, start = null, closed = false, i = 0; const points = [];
  while (i < toks.length) {
    const t = toks[i++];
    if (t === "M") { cur = [+toks[i++], +toks[i++]]; start = cur; points.push(cur); }
    else if (t === "L") { const n = [+toks[i++], +toks[i++]]; segs.push([cur, n]); cur = n; points.push(n); }
    else if (t === "A") { i += 5; const n = [+toks[i++], +toks[i++]]; segs.push([cur, n, "arc"]); cur = n; points.push(n); }
    else if (t === "Z") { segs.push([cur, start]); closed = true; cur = start; }
    else throw new Error(`unsupported path token ${t} in "${d}"`);
  }
  return { segments: segs, closed, points };
}
const onSegment = (p, a, b, eps = 0.02) => {
  const cross = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (Math.abs(cross) / len > eps) return false;
  const dot = (p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]);
  return dot >= -eps * len && dot <= len * len + eps * len;
};
const onPolygonEdge = (p, poly) => poly.some((a, k) => onSegment(p, a, poly[(k + 1) % poly.length]));

// ── the law every glyph obeys: one stroke width, round joins/caps, non-scaling strokes ────────────────────────────────────────
ok(/const GLYPH_STROKE = 1\.25;/.test(SRC), "one stroke width constant (1.25) for every glyph");
ok(/strokeWidth: GLYPH_STROKE, strokeLinejoin: "round" as const, strokeLinecap: "round" as const/.test(SRC), "the shared svg props carry the one width + round joins + round caps");
for (const id of ["tiny", "eco-sphere", "cube"]) {
  const g = glyph(id);
  ok(!/strokeWidth=/.test(g.body), `${id}: no child overrides the stroke width (the violet lines are as heavy as the cyan)`);
  ok(g.paths.length > 0 && g.paths.every((p) => /vectorEffect="non-scaling-stroke"/.test(p.attrs)), `${id}: every path keeps non-scaling strokes`);
  ok(!/<rect|<line|<polyline|<polygon/.test(g.body), `${id}: drawn with paths only (so every endpoint is a named vertex the gate can read)`);
}

// ── CUBE: the projected corners, three closed faces, a 3×3 grid on each face ──────────────────────────────────────────────────
{
  const P = (x, y, z) => [9 + 16 * x + 4 * z, 26 - 16 * y - 4 * z];
  const corners = []; for (const x of [0, 1]) for (const y of [0, 1]) for (const z of [0, 1]) corners.push(P(x, y, z));
  const g = glyph("cube");
  const parsed = g.paths.map((p) => ({ ...parsePath(p.d), violet: /C\.violet/.test(p.attrs) }));
  const faces = parsed.filter((p) => p.closed);
  ok(faces.length === 3, `cube: three closed faces (found ${faces.length})`);
  for (const f of faces) {
    ok(f.points.length === 4 && f.points.every((pt) => corners.some((c) => samePt(pt, c))), `cube face [${f.points.map((p) => p.join(",")).join(" ")}]: four corners of the projected cube`);
  }
  const front = [P(0, 0, 0), P(1, 0, 0), P(1, 1, 0), P(0, 1, 0)], top = [P(0, 1, 0), P(0, 1, 1), P(1, 1, 1), P(1, 1, 0)], right = [P(1, 0, 0), P(1, 1, 0), P(1, 1, 1), P(1, 0, 1)];
  const grids = parsed.filter((p) => !p.closed);
  const gridSegs = grids.flatMap((p) => p.segments);
  ok(gridSegs.length === 12, `cube: twelve grid lines, four per face (found ${gridSegs.length})`);
  const onFace = (s, poly) => onPolygonEdge(s[0], poly) && onPolygonEdge(s[1], poly) && s.every((pt) => corners.every((c) => !samePt(pt, c)));
  const perFace = [front, top, right].map((poly) => gridSegs.filter((s) => onFace(s, poly)).length);
  ok(perFace.every((n) => n === 4), `cube: each face carries exactly four grid lines ending on its own edges (front/top/right = ${perFace.join("/")}) — the 3×3×3 reading`);
  // thirds: every grid endpoint sits at a third of an edge
  const thirds = (a, b) => [1 / 3, 2 / 3].map((t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  const thirdPts = [front, top, right].flatMap((poly) => poly.flatMap((a, k) => thirds(a, poly[(k + 1) % 4])));
  ok(gridSegs.every((s) => s.every((pt) => thirdPts.some((t) => samePt(pt, t)))), "cube: every grid line ends at a third of an edge");
  ok(parsed.filter((p) => p.closed && !p.violet).length === 1 && parsed.filter((p) => p.closed && p.violet).length === 2, "cube: the front face is cyan, the top and right faces violet");
}

// ── TINY HOME: three closed faces of a 20×12×6 box, the door's feet on the base edge ──────────────────────────────────────────
{
  const P = (x, y, z) => [3 + 20 * x + 6 * z, 25 - 12 * y - 6 * z];
  const corners = []; for (const x of [0, 1]) for (const y of [0, 1]) for (const z of [0, 1]) corners.push(P(x, y, z));
  const g = glyph("tiny");
  const parsed = g.paths.map((p) => ({ ...parsePath(p.d), violet: /C\.violet/.test(p.attrs) }));
  const faces = parsed.filter((p) => p.closed);
  ok(faces.length === 3, `tiny: three closed faces — a top edge always has a face to land on (found ${faces.length})`);
  for (const f of faces) ok(f.points.length === 4 && f.points.every((pt) => corners.some((c) => samePt(pt, c))), `tiny face [${f.points.map((p) => p.join(",")).join(" ")}]: four corners of the projected box`);
  const shared = (a, b) => a.points.filter((p) => b.points.some((q) => samePt(p, q))).length;
  ok(faces.every((f, i) => faces.some((h, j) => i !== j && shared(f, h) === 2)), "tiny: every face shares an edge (two corners) with another face");
  const door = parsed.filter((p) => !p.closed && p.violet);
  ok(door.length === 1 && door[0].segments.length === 3, "tiny: the door is one open three-segment path (no rectangle over the base line)");
  if (door.length === 1) {
    const pts = door[0].points;
    const feet = [pts[0], pts[pts.length - 1]];
    ok(feet.every((f) => near(f[1], 25) && f[0] > 3 && f[0] < 23), "tiny: both door feet stand ON the base edge y 25, inside the front face");
    ok(pts.every((p) => p[0] >= 3 && p[0] <= 23 && p[1] >= 13 && p[1] <= 25), "tiny: the whole door lies within the front face");
  }
}

// ── ECO-SPHERE: nodes on the arc / the base / the hub, nothing leaves the dome ────────────────────────────────────────────────
{
  const C0 = [16, 24], R = 12, HUB = [16, 18];
  const g = glyph("eco-sphere");
  const parsed = g.paths.map((p) => ({ ...parsePath(p.d), violet: /C\.violet/.test(p.attrs), d: p.d }));
  const arc = parsed.find((p) => p.segments.some((s) => s[2] === "arc"));
  ok(!!arc && /A12 12 0 0 1 28 24/.test(arc.d) && /^M4 24 /.test(arc.d), "eco-sphere: the dome is the arc centre (16,24) r 12 from (4,24) to (28,24)");
  const base = parsed.find((p) => /^M4 24 L28 24$/.test(p.d.trim()));
  ok(!!base, "eco-sphere: the base line runs exactly between the arc's two ends");
  const lattice = parsed.filter((p) => p.violet);
  ok(lattice.length >= 1, "eco-sphere: a violet lattice exists");
  const segs = lattice.flatMap((p) => p.segments);
  const onArc = (p) => near(Math.hypot(p[0] - C0[0], p[1] - C0[1]), R, 0.05) && p[1] <= 24.01;
  const onBase = (p) => near(p[1], 24) && p[0] >= 3.99 && p[0] <= 28.01;
  const isHub = (p) => samePt(p, HUB);
  const endpoints = segs.flatMap((s) => [s[0], s[1]]);
  const stray = endpoints.filter((p) => !(onArc(p) || onBase(p) || isHub(p)));
  ok(stray.length === 0, `eco-sphere: every lattice endpoint is ON the arc, ON the base or the hub (stray: ${stray.map((p) => p.join(",")).join(" ") || "none"})`);
  ok(segs.every((s) => { const m = [(s[0][0] + s[1][0]) / 2, (s[0][1] + s[1][1]) / 2]; return Math.hypot(m[0] - C0[0], m[1] - C0[1]) <= R + 0.05 && m[1] <= 24.01; }), "eco-sphere: no strut leaves the dome");
  const arcNodes = [30, 60, 90, 120, 150].map((deg) => [16 + 12 * Math.cos((deg * Math.PI) / 180), 24 - 12 * Math.sin((deg * Math.PI) / 180)]);
  ok(arcNodes.every((n) => endpoints.some((p) => samePt(p, n, 0.02))), "eco-sphere: the five 30°-step arc nodes are all used");
  ok(arcNodes.every((n) => segs.some((s) => (isHub(s[0]) && samePt(s[1], n, 0.02)) || (isHub(s[1]) && samePt(s[0], n, 0.02)))), "eco-sphere: a spoke runs from the hub to every arc node");
  const ring = lattice.find((p) => p.segments.length === 6 && samePt(p.points[0], [4, 24]) && samePt(p.points[6], [28, 24]));
  ok(!!ring, "eco-sphere: the geodesic ring is one polyline of six chords from (4,24) to (28,24) through the arc nodes");
}

// ── the component contract the matrix heads rely on ──────────────────────────────────────────────────────────────────────────
ok(/function FormGlyph\(\{ id, size = 26 \}/.test(SRC), "FormGlyph keeps its signature (id, size = 26)");
ok(/id === "tiny"/.test(SRC) && /id === "eco-sphere"/.test(SRC) && /data-arch-glyph="cube"/.test(SRC), "the three ids (tiny · eco-sphere · the cube default) are unchanged");

console.log(`\nARCHITECT-FORM-GLYPHS ${pass}/${pass + fail} passed — every line of the three Simulate glyphs connects`);
if (fail > 0) process.exit(1);
