#!/usr/bin/env node
/**
 * THE FOIL, AS A MODEL — the operator's dual-scale package, generated instead of hand-written.
 *
 * He sent `FOIL_dualscale_game_package.py`, `FOIL_full_11_111x7_777_manifest.json` and
 * `FOIL_DualScaleGameWireframeActor.h` (carried verbatim in docs/drone-2525/foil-package/). Those are the
 * same silhouette typed out separately for each engine — exactly the drift WIREFRAME-CORE U-WF-05 exists to
 * stop, and exactly what scripts/wire-export.mjs already solves: one model in, .py / .obj / .cs (Unity) /
 * .cpp+.h (Unreal, centimetres) out, each with its axis conversion written down, all under a --check that
 * refuses a hand-edited output.
 *
 * So this script does the one part that was missing: turn the drawing into a model that is SCALED and
 * AXIS-MAPPED, at both scales the operator declared. Everything after that is the exporter we already have.
 *
 *   source frame (the drawing's own header)   x = span, y = depth, z = nose-to-tail, drawn nose-UP
 *   model frame (what the exporter expects)   x = forward, y = right, z = up, in metres
 *
 * The mapping is not guessed here either — it is read from `airframe.geometry.sourceAxes` and `.bodyAxes`
 * in docs/drone-2525/drone-2525.v00.00.json, the one editable source, so this script and the glyph builder
 * cannot disagree about which axis is which. That disagreement is what put span, depth and nose-to-tail
 * under each other's names for months.
 *
 *   node scripts/build-foil-model.mjs [--check]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportAll, canonicalHash } from "./wire-export.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIRE = path.join(ROOT, "docs/security-2525/xbat-wireframe/xbat.wire.json");
const DOMAIN = path.join(ROOT, "docs/drone-2525/drone-2525.v00.00.json");
const OUTDIR = path.join(ROOT, "docs/drone-2525/exports");
const CHECK = process.argv.includes("--check");

const die = (m) => { console.error(`build-foil-model: ${m}`); process.exit(1); };

const wire = JSON.parse(fs.readFileSync(WIRE, "utf8"));
const domain = JSON.parse(fs.readFileSync(DOMAIN, "utf8"));
const G = domain.airframe.geometry;
const AX = { x: 0, y: 1, z: 2 };

const spanI = AX[G.sourceAxes.span], depthI = AX[G.sourceAxes.depth], lenI = AX[G.sourceAxes.noseToTail];
if ([spanI, depthI, lenI].some((i) => i === undefined)) die("sourceAxes names an axis that is not x, y or z");
if (new Set([spanI, depthI, lenI]).size !== 3) die("sourceAxes maps two dimensions onto the same axis");

const lo = (i) => Math.min(...wire.vertices.map((v) => v[i]));
const hi = (i) => Math.max(...wire.vertices.map((v) => v[i]));
const srcSpan = hi(spanI) - lo(spanI), srcDepth = hi(depthI) - lo(depthI), srcLen = hi(lenI) - lo(lenI);
// Centre on the geometry rather than on the origin: the drawing's z runs -13.2 to +13.0, so a model left
// uncentred would hand every engine an aircraft whose pivot is not its own middle.
const midSpan = (hi(spanI) + lo(spanI)) / 2, midDepth = (hi(depthI) + lo(depthI)) / 2, midLen = (hi(lenI) + lo(lenI)) / 2;

/** One scale of the foil, in the exporter's frame: x forward (nose +), y right, z up. Metres. */
function foilAt(id, spanM, noseToTailM, label) {
  const sS = spanM / srcSpan, sL = noseToTailM / srcLen;
  const sD = Math.sqrt(sS * sL);                     // the manifest's own rule for depth
  const vertices = wire.vertices.map((v) => [
    (v[lenI] - midLen) * sL,                         // forward — the NOSE axis, not the span
    (v[spanI] - midSpan) * sS,                       // right
    (v[depthI] - midDepth) * sD,                     // up
  ].map((n) => Math.round(n * 1e6) / 1e6));
  return {
    meta: {
      id, name: `FOIL · ${label}`, version: domain.project.version, revision: domain.project.revision,
      generator: "scripts/build-foil-model.mjs",
      stamp: `eXeL v${domain.project.revision}-2026.09.16-foil`,
      source: `${path.relative(ROOT, WIRE)} scaled by airframe.geometry (${G.scale} family)`,
    },
    units: "m",
    frame: {
      kind: "body", forward: "x", right: "y", up: "z",
      note: "Nose +x, starboard +y, up +z, metres. The drawing is nose-up on its tail; this is that same "
          + "aircraft laid down in level flight, which is the attitude every engine expects.",
    },
    dimensionsM: { span: spanM, noseToTail: noseToTailM, depth: Math.round(srcDepth * sD * 1e4) / 1e4 },
    vertices,
    edges: wire.edges,
    groups: [{
      id: `${id}.airframe`, kind: "polyline", role: "consciousness",
      edge0: 0, edgeN: wire.edges.length, lod: 0,
      replay: { source: "hand-authored, scaled", confidence: "high", classification: "training" },
    }],
    overlays: [],
  };
}

const MODELS = [
  foilAt("foil-1.111", G.spanM, G.noseToTailM, `${G.spanM} m × ${G.noseToTailM} m (demo / laser-tag scale)`),
  foilAt("foil-11.111", G.fullScaleM.span, G.fullScaleM.noseToTail, `${G.fullScaleM.span} m × ${G.fullScaleM.noseToTail} m (full scale)`),
];

// ── ASSERT BEFORE WRITING: a model whose measured size is not the size it claims refuses ─────────
for (const m of MODELS) {
  const got = {
    noseToTail: Math.max(...m.vertices.map((v) => v[0])) - Math.min(...m.vertices.map((v) => v[0])),
    span: Math.max(...m.vertices.map((v) => v[1])) - Math.min(...m.vertices.map((v) => v[1])),
    depth: Math.max(...m.vertices.map((v) => v[2])) - Math.min(...m.vertices.map((v) => v[2])),
  };
  for (const k of ["span", "noseToTail", "depth"]) {
    if (Math.abs(got[k] - m.dimensionsM[k]) > 1e-3)
      die(`${m.meta.id} claims ${k} ${m.dimensionsM[k]} m but measures ${got[k].toFixed(4)} m`);
  }
  if (got.span <= got.noseToTail)
    die(`${m.meta.id} came out longer than it is wide — the axis mapping is inverted again`);
}

let drift = 0, wrote = 0;
for (const m of MODELS) {
  const files = { [`${m.meta.id}.wire.json`]: JSON.stringify(m, null, 1) + "\n", ...exportAll(m) };
  for (const [name, bodyText] of Object.entries(files)) {
    const dest = path.join(OUTDIR, name);
    if (CHECK) {
      const have = fs.existsSync(dest) ? fs.readFileSync(dest, "utf8") : null;
      if (have !== bodyText) { drift++; console.error(`DRIFT ${name}${have === null ? " (missing)" : ""}`); }
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, bodyText);
      wrote++;
    }
  }
}

if (CHECK) {
  if (drift) { console.error(`\nREFUSED — ${drift} file(s) differ from the model. Regenerate; never hand-edit an output.`); process.exit(1); }
  console.log(`build-foil-model --check OK · ${MODELS.map((m) => `${m.meta.id} ${canonicalHash(m).slice(0, 12)}`).join(" · ")}`);
} else {
  for (const m of MODELS) {
    console.log(`${m.meta.id}: span ${m.dimensionsM.span} m · nose-to-tail ${m.dimensionsM.noseToTail} m`
              + ` · depth ${m.dimensionsM.depth} m · ${m.edges.length} segments · sha256 ${canonicalHash(m).slice(0, 16)}…`);
  }
  console.log(`wrote ${wrote} files to ${path.relative(ROOT, OUTDIR)}/`);
}
