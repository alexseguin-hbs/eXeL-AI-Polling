#!/usr/bin/env node
/**
 * ARCHITECT-2525 · ASSET BUILD (Rev A · 3D asset intake) — compile the authored compositions (lib/architect-2525/assets/
 * compositions/) into the served library (public/architect-2525/assets): models/<file>.glb through the pure in-repo GLB
 * writer, metadata/<file>.json in the starter pack's schema, plan/<file>.svg in the starter pack's exact PLAN style, and
 * the manifest entry (upserted; new ids appended in sorted order; existing thumbnails kept). DETERMINISTIC: no clock,
 * no random, stable key order — run twice → byte-identical outputs (gated by tests/architect-asset-glb-build.test.mjs).
 * Every GLB is parsed straight back through the reader and its bounds/triangles checked against the composition
 * before it is written (the round-trip gate, in the build itself).
 *
 *   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs scripts/architect-assets-build.mjs [--out <dir>]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COMPOSITIONS, compositionGlbInput, compositionMetadata, compositionManifestEntry, compositionBounds } from "../lib/architect-2525/assets/compositions/index.ts";
import { writeGlb } from "../lib/architect-2525/assets/gltf/glb-writer.ts";
import { readGlb } from "../lib/architect-2525/assets/gltf/glb-reader.ts";
import { normalizeManifestEntry } from "../lib/architect-2525/assets/model-cache.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const outArg = argv.includes("--out") ? argv[argv.indexOf("--out") + 1] : null;
const OUT = path.resolve(outArg ?? path.resolve(HERE, "../public/architect-2525/assets"));

/** The library header when a fresh output dir has no manifest yet (the starter pack's own header, verbatim). */
const MANIFEST_HEADER = {
  library: "Architect-2525 3D Asset Starter Pack",
  version: "1.0.0",
  coordinateSystem: "right-handed; X width, Y depth, Z up",
  units: "meters",
  pivotConvention: "floor-center at (0,0,0)",
  authorityDefault: "ILLUSTRATIVE",
};

/** The starter pack's PLAN symbol, byte-for-byte its rule (verified against all 18 of its SVGs): a 240×160 card, the
 *  footprint fitted into 190×120 centred at (120, 70) — deeper-than-wide fits the height, otherwise the width with the
 *  height clamped to [40, 120] — rx 8, the pack's fill/stroke, a centre line, the label at y 152. */
export function planSvg(label, widthM, depthM) {
  let w, h;
  if (depthM > widthM) { const k = 120 / depthM; w = widthM * k; h = 120; }
  else { const k = 190 / widthM; w = 190; h = Math.min(120, Math.max(40, depthM * k)); }
  const x = 120 - w / 2, y = 70 - h / 2;
  const f = (v) => v.toFixed(1);
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" role="img" aria-label="${esc(label)}">`,
    `  <rect width="240" height="160" fill="none"/>`,
    `  <rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="8" fill="#123c43" stroke="#00dddd" stroke-width="4"/>`,
    `  <line x1="120" y1="${f(y)}" x2="120" y2="${f(y + h)}" stroke="#a050dc" stroke-width="2" opacity="0.55"/>`,
    `  <text x="120" y="152" text-anchor="middle" font-size="12" font-family="Arial" fill="#00dddd">${esc(label)}</text>`,
    `</svg>`,
  ].join("\n") + "\n";
}

const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

export function buildAssets(outDir = OUT) {
  for (const d of ["models", "metadata", "plan"]) fs.mkdirSync(path.join(outDir, d), { recursive: true });
  const manifestPath = path.join(outDir, "manifest.json");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { ...MANIFEST_HEADER, assets: [] };
  const built = [];
  for (const c of COMPOSITIONS) {
    const glb = writeGlb(compositionGlbInput(c));
    // ── round-trip gate: the bytes we are about to write parse back to the composition ──
    const mesh = readGlb(glb);
    const want = compositionBounds(c);
    const tris = c.parts.length * 12;
    if (mesh.triCount !== tris) throw new Error(`${c.id}: round-trip triCount ${mesh.triCount} ≠ ${tris}`);
    if (mesh.meshCount !== c.parts.length) throw new Error(`${c.id}: round-trip meshCount ${mesh.meshCount} ≠ ${c.parts.length}`);
    for (let i = 0; i < 3; i++) {
      if (!near(mesh.bounds.min[i], want.min[i]) || !near(mesh.bounds.max[i], want.max[i])) throw new Error(`${c.id}: round-trip bounds axis ${i} ${mesh.bounds.min[i]}..${mesh.bounds.max[i]} ≠ ${want.min[i]}..${want.max[i]}`);
    }
    const ext = { w: mesh.bounds.max[0] - mesh.bounds.min[0], d: mesh.bounds.max[1] - mesh.bounds.min[1], h: mesh.bounds.max[2] - mesh.bounds.min[2] };
    if (!near(ext.w, c.dimensionsM.width, 1e-4) || !near(ext.d, c.dimensionsM.depth, 1e-4) || !near(ext.h, c.dimensionsM.height, 1e-4)) throw new Error(`${c.id}: bounds ${JSON.stringify(ext)} ≠ dimensionsM ${JSON.stringify(c.dimensionsM)}`);
    fs.writeFileSync(path.join(outDir, "models", `${c.file}.glb`), glb);
    fs.writeFileSync(path.join(outDir, "metadata", `${c.file}.json`), JSON.stringify(compositionMetadata(c), null, 2) + "\n");
    fs.writeFileSync(path.join(outDir, "plan", `${c.file}.svg`), planSvg(c.label, c.dimensionsM.width, c.dimensionsM.depth));
    // ── manifest upsert: keep the pack's order for existing ids, append new ids sorted, keep an existing thumbnail ──
    const entry = compositionManifestEntry(c);
    const i = manifest.assets.findIndex((a) => a.id === c.id);
    if (i >= 0) manifest.assets[i] = normalizeManifestEntry({ ...entry, thumbnail: manifest.assets[i].thumbnail });
    else manifest.assets.push(normalizeManifestEntry(entry));
    built.push({ id: c.id, file: c.file, bytes: glb.byteLength, tris: mesh.triCount, bounds: mesh.bounds });
  }
  // the entries the build owns, when newly appended, sit after the pack's entries in sorted-id order
  const packIds = manifest.assets.filter((a) => !COMPOSITIONS.some((c) => c.id === a.id));
  const ours = manifest.assets.filter((a) => COMPOSITIONS.some((c) => c.id === a.id)).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const ordered = [];
  for (const a of manifest.assets) { if (!COMPOSITIONS.some((c) => c.id === a.id)) ordered.push(a); }
  for (const a of ours) if (!ordered.includes(a)) ordered.push(a);
  void packIds;
  const ids = new Set(); for (const a of ordered) { if (ids.has(a.id)) throw new Error(`duplicate manifest id ${a.id}`); ids.add(a.id); }
  manifest.assets = ordered.map(normalizeManifestEntry);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  return built;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const built = buildAssets(OUT);
  for (const b of built) console.log(`${b.id} → models/${b.file}.glb (${b.bytes} bytes · ${b.tris} tris · z ${b.bounds.min[2]}..${b.bounds.max[2]} m)`);
  console.log(`built ${built.length} asset(s) into ${OUT}`);
}
