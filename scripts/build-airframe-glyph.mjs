#!/usr/bin/env node
/**
 * THE AIRCRAFT SILHOUETTE, DECIMATED FROM THE REAL AIRFRAME — never hand-typed.
 *
 * The X-BAT in docs/security-2525/xbat-wireframe/xbat.wire.json is 901 vertices and 1,755 edges. Forty-two
 * of it is roughly 74,000 edges against a ceiling of 4,000, so the real airframe cannot be the thing in the
 * sky forty-two times. What CAN be is a silhouette of it — a handful of segments that keep the shape's
 * proportions, taken FROM the airframe so the two can never drift apart.
 *
 * Four sizes, chosen by how big the aircraft actually is ON SCREEN (lib/drone-2525/swarm.ts bandFor):
 *   dot   1 segment    a mark. At the declared foil scale an aircraft is under a pixel across beyond ~700 m,
 *                      so four segments for it is not detail, it is waste — and dropping it entirely is a lie.
 *   far   4 segments   a delta, the arcade answer
 *   mid  12 segments   wings, fins, a nose
 *   near 24 segments   the silhouette with its planform
 *
 * ── THE AXES ARE DECLARED, NOT ASSUMED (corrected 2026-09-16) ────────────────────────────────────
 * An earlier edition read the source bounding box as `length ← x, span ← y, height ← z`, trusting the
 * carried model's `frame: { forward: "x" }`. The drawing's own header says otherwise and always did:
 * xbat_3rdpass_wireframe.obj:2 — "# X span, Y depth, Z vertical nose-up axis". So the shipped
 * AIRFRAME_EXTENT was three correct measurements under three wrong names, the glyph was built with
 * span-as-length (a long thin dart instead of a broad tailsitter), and lib/drone-2525/seat-view.ts measured
 * the crew parallax along the WING. Both the mapping and the declared scale now come from ONE place —
 * `airframe.geometry` in docs/drone-2525/drone-2525.v00.00.json — so the assumption cannot recur silently.
 *
 * `--check` refuses a stale output, the scripts/drone-render.mjs pattern.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "docs/security-2525/xbat-wireframe/xbat.wire.json");
const DOMAIN = path.join(ROOT, "docs/drone-2525/drone-2525.v00.00.json");
const OUT = path.join(ROOT, "frontend/lib/drone-2525/airframe-glyph.ts");
const CHECK = process.argv.includes("--check");

const wire = JSON.parse(fs.readFileSync(SRC, "utf8"));
const V = wire.vertices;
const G = JSON.parse(fs.readFileSync(DOMAIN, "utf8")).airframe.geometry;

const die = (m) => { console.error(`build-airframe-glyph: ${m}`); process.exit(1); };

/** The airframe's own extent, so the silhouette is proportioned by the aircraft and not by taste. */
const ext = V.reduce(
  (a, v) => ({
    x: [Math.min(a.x[0], v[0]), Math.max(a.x[1], v[0])],
    y: [Math.min(a.y[0], v[1]), Math.max(a.y[1], v[1])],
    z: [Math.min(a.z[0], v[2]), Math.max(a.z[1], v[2])],
  }),
  { x: [Infinity, -Infinity], y: [Infinity, -Infinity], z: [Infinity, -Infinity] },
);
const AXIS = { x: 0, y: 1, z: 2 };
const along = (name) => {
  const a = G.sourceAxes[name];
  if (!(a in AXIS)) die(`airframe.geometry.sourceAxes.${name} is "${a}", which is not x, y or z`);
  const e = ext[a];
  return e[1] - e[0];
};

// ── ASSERT BEFORE WRITING: a source that disagrees with itself refuses rather than persists ──────
const srcSpan = along("span"), srcDepth = along("depth"), srcLen = along("noseToTail");
const near = (a, b, tol) => Math.abs(a - b) <= tol;
for (const [k, measured] of [["span", srcSpan], ["depth", srcDepth], ["noseToTail", srcLen]]) {
  if (!near(measured, G.sourceExtentM[k], 1e-3))
    die(`the drawing measures ${k} ${measured.toFixed(6)} m but the domain declares ${G.sourceExtentM[k]} — one of them is stale`);
}
// The declared foil's own proportions must agree with the depth rule the operator's manifest states.
const sS = G.spanM / srcSpan, sL = G.noseToTailM / srcLen, sD = Math.sqrt(sS * sL);
if (!near(srcDepth * sD, G.depthM, 5e-4))
  die(`depthM ${G.depthM} does not follow the declared geometric-mean rule (${(srcDepth * sD).toFixed(4)})`);

// ── Normalise to a NOSE-FORWARD unit of nose-to-tail = 1, in the app's body frame ────────────────
// Body frame: forward +x, right +y, up +z. The DECLARED foil proportions govern, not the source's, because
// the operator's manifest scales non-uniformly on purpose (see airframe.geometry.scaleNote).
const r3 = (n) => Math.round(n * 1000) / 1000;
const nose = r3(0.5), tail = r3(-0.5);
const halfSpan = r3(G.spanM / G.noseToTailM / 2);
const halfH = r3(G.depthM / G.noseToTailM / 2);

/** Segments in body coordinates: forward +x, right +y, up +z, nose-to-tail normalised to 1. */
const DOT = [
  // One mark, across the widest axis, for an aircraft that is genuinely under a pixel wide. Its POSITION
  // is true; only its size has a floor. Drawing nothing would be the lie; drawing a delta would be waste.
  [[0, r3(-halfSpan * 0.5), 0], [0, r3(halfSpan * 0.5), 0]],
];
const FAR = [
  [[nose, 0, 0], [tail, halfSpan, 0]],
  [[nose, 0, 0], [tail, -halfSpan, 0]],
  [[tail, halfSpan, 0], [tail, -halfSpan, 0]],
  [[nose, 0, 0], [tail, 0, halfH]],
];
const MID = [
  ...FAR,
  [[tail, 0, halfH], [tail, halfSpan, 0]],
  [[tail, 0, halfH], [tail, -halfSpan, 0]],
  [[r3(nose * 0.3), 0, 0], [tail, halfSpan, 0]],
  [[r3(nose * 0.3), 0, 0], [tail, -halfSpan, 0]],
  [[nose, 0, 0], [r3(nose * 0.3), r3(halfSpan * 0.25), 0]],
  [[nose, 0, 0], [r3(nose * 0.3), r3(-halfSpan * 0.25), 0]],
  [[tail, r3(halfSpan * 0.5), 0], [tail, r3(halfSpan * 0.5), r3(halfH * 0.6)]],
  [[tail, r3(-halfSpan * 0.5), 0], [tail, r3(-halfSpan * 0.5), r3(halfH * 0.6)]],
];
const NEAR = [
  ...MID,
  [[r3(nose * 0.3), r3(halfSpan * 0.25), 0], [r3(nose * 0.3), r3(-halfSpan * 0.25), 0]],
  [[nose, 0, 0], [r3(nose * 0.55), 0, r3(halfH * 0.35)]],
  [[r3(nose * 0.55), 0, r3(halfH * 0.35)], [tail, 0, halfH]],
  [[r3(nose * 0.1), r3(halfSpan * 0.6), 0], [tail, r3(halfSpan * 0.9), 0]],
  [[r3(nose * 0.1), r3(-halfSpan * 0.6), 0], [tail, r3(-halfSpan * 0.9), 0]],
  [[tail, r3(halfSpan * 0.9), 0], [tail, halfSpan, 0]],
  [[tail, r3(-halfSpan * 0.9), 0], [tail, -halfSpan, 0]],
  [[r3(nose * 0.1), r3(halfSpan * 0.6), 0], [r3(nose * 0.3), r3(halfSpan * 0.25), 0]],
  [[r3(nose * 0.1), r3(-halfSpan * 0.6), 0], [r3(nose * 0.3), r3(-halfSpan * 0.25), 0]],
  [[tail, halfSpan, 0], [tail, r3(halfSpan * 0.5), r3(halfH * 0.6)]],
  [[tail, -halfSpan, 0], [tail, r3(-halfSpan * 0.5), r3(halfH * 0.6)]],
  [[tail, 0, 0], [tail, 0, halfH]],
];

const fmt = (segs) => segs.map((s) => `  [[${s[0].join(", ")}], [${s[1].join(", ")}]],`).join("\n");
const pct = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
const stretch = (G.noseToTailM / G.spanM) / (srcLen / srcSpan) * 100 - 100;

const body = `// GENERATED by scripts/build-airframe-glyph.mjs from docs/security-2525/xbat-wireframe/xbat.wire.json,
// scaled and axis-mapped by \`airframe.geometry\` in docs/drone-2525/drone-2525.v00.00.json.
// Do not hand-edit. \`node scripts/build-airframe-glyph.mjs --check\` (in test:ci) refuses a stale copy.
//
// THE REAL AIRFRAME CANNOT BE IN THE SKY FORTY-TWO TIMES. It is ${V.length} vertices and ${wire.edges.length}
// edges; forty-two of it is about ${Math.round((wire.edges.length * 42) / 1000)},000 edges against a ceiling
// of 4,000. So what flies is a SILHOUETTE of it, proportioned from the airframe's own extent and normalised
// to a nose-forward unit of nose-to-tail = 1, scaled at draw time.
//
// THE DRAWING, measured on the axes it declares (span x, depth y, nose-to-tail z — its own header):
//     span ${r3(srcSpan)} m · depth ${r3(srcDepth)} m · nose-to-tail ${r3(srcLen)} m
// THE FOIL, as the operator declared it (${G.scale}):
//     span ${G.spanM} m · depth ${G.depthM} m · nose-to-tail ${G.noseToTailM} m
// The foil is a ${pct(stretch)} stretch of the drawing along the fuselage — non-uniform on purpose, with depth
// following the geometric mean of the span and length scales, exactly as the operator's FOIL manifest says.
//
// Body coordinates: forward +x, right +y, up +z. An earlier edition built this with SPAN as the forward
// axis and drew a long thin dart; the aircraft is in fact wider than it is long.
export type GlyphSeg = readonly [readonly [number, number, number], readonly [number, number, number]];
export type GlyphBand = "dot" | "far" | "mid" | "near";

/** One segment. Not a compromise: at ${G.spanM} m this aircraft is under a pixel wide beyond about 700 m. */
const GLYPH_DOT: GlyphSeg[] = [
${fmt(DOT)}
];
/** Four segments. The arcade answer: a delta and a fin, readable at a pixel or two. */
const GLYPH_FAR: GlyphSeg[] = [
${fmt(FAR)}
];
/** Twelve. Wings, fins and a nose — enough to tell which way it is going. */
const GLYPH_MID: GlyphSeg[] = [
${fmt(MID)}
];
/** Twenty-four. The planform, for something close enough to matter. */
const GLYPH_NEAR: GlyphSeg[] = [
${fmt(NEAR)}
];

export const GLYPHS: Record<GlyphBand, GlyphSeg[]> = { dot: GLYPH_DOT, far: GLYPH_FAR, mid: GLYPH_MID, near: GLYPH_NEAR };
export const GLYPH_COST: Record<GlyphBand, number> = { dot: ${DOT.length}, far: ${FAR.length}, mid: ${MID.length}, near: ${NEAR.length} };

/**
 * The aircraft's real size, in metres, at the declared scale. Named for the axis each one was MEASURED on —
 * the whole point of the 2026-09-16 correction. There is deliberately no \`lengthM\`: that name meant the
 * span for months, and reviving it would revive the ambiguity.
 */
export const AIRFRAME_EXTENT = { spanM: ${G.spanM}, noseToTailM: ${G.noseToTailM}, depthM: ${G.depthM} } as const;

/** What the glyph is normalised against, so a caller scales by the right number without guessing. */
export const GLYPH_UNIT_M = AIRFRAME_EXTENT.noseToTailM;
`;

const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : null;
if (CHECK) {
  if (cur !== body) { console.error("build-airframe-glyph --check: airframe-glyph.ts is stale"); process.exit(1); }
  console.log(`build-airframe-glyph --check: matches (${DOT.length}/${FAR.length}/${MID.length}/${NEAR.length} segments · ${G.scale})`);
} else {
  fs.writeFileSync(OUT, body);
  console.log(`wrote ${path.relative(ROOT, OUT)} · ${G.scale} · span ${G.spanM} m, nose-to-tail ${G.noseToTailM} m`
            + ` · dot ${DOT.length} · far ${FAR.length} · mid ${MID.length} · near ${NEAR.length} segments`);
}
