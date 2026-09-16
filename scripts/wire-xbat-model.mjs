#!/usr/bin/env node
// wire-xbat-model — carry the HAND-WRITTEN X-BAT wireframe into the canonical model, so the exporter can be
// proven against something real rather than against itself.
//
// docs/security-2525/xbat-wireframe/ is WIREFRAME-CORE's named reference pattern (U-WF-05) and today it is
// four hand-maintained copies of one silhouette. This reads the OBJ — the copy a human actually checked —
// and writes it as a WireModel. tests/wire-export.test.mjs then round-trips it: model → .obj → parsed again,
// and every segment and the sha256 must survive. If the exporter ever lies, that test goes red on a shape
// nobody in this process invented.
//
// THE CARRY IS 1:1 NUMERICALLY, AND THE LABELS NOW SAY WHAT THE DRAWING SAYS. An earlier edition of this
// script wrote `frame: { up: "z", forward: "x" }` while quoting, two lines above, the OBJ header that
// contradicts it: "X span, Y depth, Z vertical nose-up axis". The numbers were never wrong; the names were.
// scripts/build-airframe-glyph.mjs believed the names, so the shipped AIRFRAME_EXTENT carried span, depth
// and nose-to-tail under each other's labels, and every consumer inherited the permutation — including the
// seat parallax, which was measured along the wing. Corrected 2026-09-16; the axes are now DECLARED as a
// map rather than implied by a forward/up pair, because this aircraft is drawn nose-UP, standing on its
// tail, and a single "forward" field cannot honestly describe that. See
// docs/asks/2026-09-16_foil_1m_five_levels_world.md.
//
//   node scripts/wire-xbat-model.mjs [--out <file>]
import fs from "node:fs";
import path from "node:path";

const SRC = "docs/security-2525/xbat-wireframe/xbat_3rdpass_wireframe.obj";

/** Parse a line-only OBJ (v + l) into deduplicated vertices and index-pair edges. */
export function parseLineObj(text) {
  const raw = [];
  const edges = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("v ")) {
      const p = line.slice(2).trim().split(/\s+/).map(Number);
      if (p.length < 3 || !p.every(Number.isFinite)) throw new Error(`bad vertex: ${line}`);
      raw.push([p[0], p[1], p[2]]);
    } else if (line.startsWith("l ")) {
      const idx = line.slice(2).trim().split(/\s+/).map((n) => parseInt(n, 10));
      for (let i = 1; i < idx.length; i++) edges.push([idx[i - 1] - 1, idx[i] - 1]);   // OBJ is 1-based
    }
  }
  // Deduplicate at 1 µm — the same grid canonicalSegments hashes on, so dedup cannot change the geometry.
  const vertices = [], map = new Map(), remap = new Array(raw.length);
  const key = (p) => `${Math.round(p[0] * 1e6)},${Math.round(p[1] * 1e6)},${Math.round(p[2] * 1e6)}`;
  raw.forEach((p, i) => {
    const k = key(p), hit = map.get(k);
    if (hit !== undefined) { remap[i] = hit; return; }
    vertices.push(p); map.set(k, vertices.length - 1); remap[i] = vertices.length - 1;
  });
  const out = [];
  for (const [a, b] of edges) {
    if (remap[a] === undefined || remap[b] === undefined) throw new Error(`edge references a missing vertex`);
    if (remap[a] !== remap[b]) out.push([remap[a], remap[b]]);                          // drop zero-length
  }
  return { vertices, edges: out, rawVertices: raw.length, rawEdges: edges.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const out = args.includes("--out") ? args[args.indexOf("--out") + 1] : "docs/security-2525/xbat-wireframe/xbat.wire.json";
  const parsed = parseLineObj(fs.readFileSync(SRC, "utf8"));
  const model = {
    meta: {
      id: "xbat", name: "X-BAT · 3rd-pass wireframe", version: "00.00", revision: "0.002",
      generator: "scripts/wire-xbat-model.mjs",
      stamp: "eXeL v0.002-2026.09.16-carried",
      source: `${SRC} (hand-written; carried, not regenerated)`,
    },
    units: "m",
    frame: {
      kind: "drawing",
      attitude: "nose-up (tailsitter, as drawn)",
      // The drawing's own header, verbatim: xbat_3rdpass_wireframe.obj:2 and .py:13-15.
      axes: { span: "x", depth: "y", noseToTail: "z" },
      // As drawn, standing on its tail, the vertical axis IS the fuselage. Both are z, and saying so is
      // more honest than picking one. A consumer wanting the app's body frame reads airframe.geometry
      // .bodyAxes in docs/drone-2525/drone-2525.v00.00.json, which declares the mapping explicitly.
      up: "z", forward: "z",
      supersedes: "revision 0.001 declared forward:'x', which the drawing's header contradicts",
    },
    vertices: parsed.vertices,
    edges: parsed.edges,
    groups: [{ id: "xbat.airframe", kind: "polyline", role: "consciousness", edge0: 0, edgeN: parsed.edges.length, lod: 0,
               replay: { source: "hand-authored", confidence: "high", classification: "training" } }],
    overlays: [],
  };
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(model, null, 1) + "\n");
  console.log(`xbat → ${out}: ${parsed.rawVertices} obj verts deduped to ${parsed.vertices.length} · ${parsed.edges.length} segments (obj had ${parsed.rawEdges})`);
}
