#!/usr/bin/env node
/**
 * ARCHITECT-2525 · ASSET REBUILD (Rev A · 3D asset intake) — the REBUILD PATH, never the source. The served library
 * public/architect-2525/assets is the operator's complete 139-asset library VERBATIM (his rule: "DO NOT REMODEL unless
 * necessary — ingest, preserve ids"). This script compiles the authored compositions (lib/architect-2525/assets/
 * compositions/) through the pure in-repo GLB writer into HIS exact layout and contracts — models/<file>.glb ·
 * metadata/<file>.json (his key order) · plan/<file>.svg (his PLAN style) · a manifest row in his row shape — into an
 * OUTPUT DIRECTORY YOU NAME, so a rebuilt asset can replace his file under the same id when a rebuild is decided.
 * `--out` is REQUIRED and may never be the served library itself. Every GLB is parsed straight back through the reader
 * and checked (the round-trip gate, in the build). DETERMINISTIC: no clock, no random, stable key order — run twice →
 * byte-identical (gated by tests/architect-asset-glb-build.test.mjs).
 *
 *   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs scripts/architect-assets-build.mjs --out <dir> [--only <id>]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COMPOSITIONS, writeGlbFromComposition, compositionMetadata, compositionManifestEntry, compositionBounds, compositionTriCount } from "../lib/architect-2525/assets/compositions/index.ts";
import { readGlb } from "../lib/architect-2525/assets/gltf/glb-reader.ts";
import { normalizeManifestEntry } from "../lib/architect-2525/assets/model-cache.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SERVED_LIBRARY = path.resolve(HERE, "../public/architect-2525/assets");
const argv = process.argv.slice(2);
const arg = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : null);

/** The library's PLAN symbol, byte-for-byte his rule (verified against all 139 of his SVGs): a 240×160 card, the
 *  footprint fitted into 190×120 centred at (120, 70) — deeper-than-wide fits the height, otherwise the width with the
 *  height clamped to [36, 120] — rx 8, his fill/stroke, the violet label at y 153, no trailing newline. */
export function planSvg(label, widthM, depthM) {
  let w, h;
  if (depthM > widthM) { const k = 120 / depthM; w = widthM * k; h = 120; }
  else { const k = 190 / widthM; w = 190; h = Math.min(120, Math.max(36, depthM * k)); }
  const x = 120 - w / 2, y = 70 - h / 2;
  const f = (v) => v.toFixed(1);
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160">`,
    `<rect width="240" height="160" fill="none"/>`,
    `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="8" fill="#0a3942" stroke="#12e1e5" stroke-width="4"/>`,
    `<text x="120" y="153" text-anchor="middle" font-size="11" font-family="Arial" fill="#b55cff">${esc(label)}</text>`,
    `</svg>`,
  ].join("\n");
}

/** A fresh rebuild manifest's header (his library fields; the rows are his row shape). */
export const REBUILD_MANIFEST_HEADER = {
  library: "Architect-2525 asset rebuilds (compositions compiled through architect-2525/assets-build)",
  version: "0.1.0",
  coordinateSystem: "X=width,Y=depth,Z=up",
  units: "meters",
  pivotConvention: "FLOOR_CENTER",
};

const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
const writeJson = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 2));   // his style: 2-space, no trailing newline

export function buildAssets(outDir, only = null) {
  if (!outDir) throw new Error("--out <dir> is required (the rebuild path never writes into the served library by default)");
  const out = path.resolve(outDir);
  if (out === SERVED_LIBRARY || out.startsWith(SERVED_LIBRARY + path.sep)) throw new Error(`refused: ${out} is the served library (the operator's, verbatim) — rebuild into another directory and copy a file over deliberately`);
  for (const d of ["models", "metadata", "plan"]) fs.mkdirSync(path.join(out, d), { recursive: true });
  const manifestPath = path.join(out, "manifest.json");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { ...REBUILD_MANIFEST_HEADER, assets: [] };
  if (!Array.isArray(manifest.assets)) throw new Error("manifest.json has no assets[]");
  const built = [];
  for (const c of COMPOSITIONS) {
    if (only && c.id !== only) continue;
    const glb = writeGlbFromComposition(c);
    // ── round-trip gate: the bytes we are about to write parse back to the composition ──
    const mesh = readGlb(glb);
    const want = compositionBounds(c), tris = compositionTriCount(c);
    if (mesh.triCount !== tris) throw new Error(`${c.id}: round-trip triCount ${mesh.triCount} ≠ ${tris}`);
    if (mesh.meshCount !== c.parts.length) throw new Error(`${c.id}: round-trip meshCount ${mesh.meshCount} ≠ ${c.parts.length}`);
    for (let i = 0; i < 3; i++) if (!near(mesh.bounds.min[i], want.min[i]) || !near(mesh.bounds.max[i], want.max[i])) throw new Error(`${c.id}: round-trip bounds axis ${i} ${mesh.bounds.min[i]}..${mesh.bounds.max[i]} ≠ ${want.min[i]}..${want.max[i]}`);
    const ext = { w: mesh.bounds.max[0] - mesh.bounds.min[0], d: mesh.bounds.max[1] - mesh.bounds.min[1], h: mesh.bounds.max[2] - mesh.bounds.min[2] };
    if (!near(ext.w, c.dimensionsM.width, 1e-4) || !near(ext.d, c.dimensionsM.depth, 1e-4) || !near(ext.h, c.dimensionsM.height, 1e-4)) throw new Error(`${c.id}: bounds ${JSON.stringify(ext)} ≠ dimensionsM ${JSON.stringify(c.dimensionsM)}`);
    if (mesh.bounds.min[2] < -1e-6) throw new Error(`${c.id}: geometry below the floor (z ${mesh.bounds.min[2]}) — the pivot is floor-centre`);
    fs.writeFileSync(path.join(out, "models", `${c.file}.glb`), glb);
    writeJson(path.join(out, "metadata", `${c.file}.json`), compositionMetadata(c));
    fs.writeFileSync(path.join(out, "plan", `${c.file}.svg`), planSvg(c.label, c.dimensionsM.width, c.dimensionsM.depth));
    // ── manifest upsert: an existing row is replaced in place (its thumbnail kept); new rows are appended sorted ──
    const entry = compositionManifestEntry(c);
    const i = manifest.assets.findIndex((a) => a.id === c.id);
    if (i >= 0) manifest.assets[i] = normalizeManifestEntry({ ...entry, thumbnail: manifest.assets[i].thumbnail });
    else manifest.assets.push(normalizeManifestEntry(entry));
    built.push({ id: c.id, file: c.file, bytes: glb.byteLength, tris: mesh.triCount, bounds: mesh.bounds });
  }
  const ours = new Set(COMPOSITIONS.map((c) => c.id));
  const kept = manifest.assets.filter((a) => !ours.has(a.id));
  const mine = manifest.assets.filter((a) => ours.has(a.id)).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const ids = new Set();
  manifest.assets = [...kept, ...mine];
  for (const a of manifest.assets) { if (ids.has(a.id)) throw new Error(`duplicate manifest id ${a.id}`); ids.add(a.id); }
  writeJson(manifestPath, manifest);
  return built;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outArg = arg("--out");
  if (!outArg) { console.error("usage: architect-assets-build.mjs --out <dir> [--only <id>]  (the served library is the operator's, verbatim — a rebuild goes to a directory you name)"); process.exit(2); }
  try {
    const built = buildAssets(outArg, arg("--only"));
    for (const b of built) console.log(`${b.id.padEnd(44)} → models/${b.file}.glb (${b.bytes} B · ${b.tris} tris · z ${b.bounds.min[2].toFixed(3)}..${b.bounds.max[2].toFixed(3)} m)`);
    console.log(`built ${built.length} asset(s) into ${path.resolve(outArg)}`);
  } catch (e) { console.error(`architect-assets-build: ${e.message}`); process.exit(1); }
}
