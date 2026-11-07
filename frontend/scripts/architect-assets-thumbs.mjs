#!/usr/bin/env node
/**
 * ARCHITECT-2525 · ASSET THUMBNAILS (Rev A · 3D asset intake) — intake master §16: "derived from the same asset identity …
 * neutral/dark Architect-2525 background; three-quarter isometric view; stable camera; consistent scale padding;
 * cyan/teal Architect visual treatment; only actual wood rendered tan."
 * =================================================================================================
 * Each manifest entry's GLB is read through the SAME pure reader the runtime uses, bridged into the SAME solidFaces()
 * painter the walk uses (lib/solid-shade.ts — the three-quarter view is just another Projector), shaded with the SAME
 * FACE_SHADE, and emitted as an SVG on the #070b12 ground with cyan edges; Playwright's Chromium rasterises it to a
 * 256×256 PNG at public/architect-2525/assets/thumbs/<file>.png and the manifest entry gains `thumbnail`. The picture is
 * therefore the runtime's own rendering of the asset — never a drawing, never a concept-board crop.
 *
 *   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs scripts/architect-assets-thumbs.mjs [--out <dir>] [--only <id>] [--svg]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readGlb } from "../lib/architect-2525/assets/gltf/glb-reader.ts";
import { meshToFaces } from "../lib/architect-2525/assets/gltf/to-quads.ts";
import { normalizeManifestEntry } from "../lib/architect-2525/assets/model-cache.ts";
import { solidFaces, shade, FACE_SHADE } from "../lib/solid-shade.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : null);
const OUT = path.resolve(arg("--out") ?? path.resolve(HERE, "../public/architect-2525/assets"));
const ONLY = arg("--only");
const KEEP_SVG = argv.includes("--svg");

export const THUMB_SIZE = 256, THUMB_PAD = 22;
export const THUMB_GROUND = "#070b12", THUMB_EDGE = "#4ff2ff", THUMB_FLOOR = "#19c8cf";
const AZ = (-45 * Math.PI) / 180, EL = (30 * Math.PI) / 180;   // yaw −45° → the camera sits in the +x/−y/+z octant: front · right side · top

/** Three-quarter isometric: world (x east, y north, z up) → unscaled screen (sx right, su up) + depth (farther = larger). */
export function isoProject(p) {
  const c = Math.cos(AZ), s = Math.sin(AZ);
  const xr = p[0] * c - p[1] * s, yr = p[0] * s + p[1] * c;
  return { sx: xr, su: yr * Math.sin(EL) + p[2] * Math.cos(EL), depth: yr * Math.cos(EL) - p[2] * Math.sin(EL) };
}

/** The SVG for one mesh (metres or feet — the fit is scale-free). Pure. */
export function thumbSvg(mesh) {
  const faces = meshToFaces(mesh);
  const b = mesh.bounds;
  // the floor footprint (bounds xy at z = 0) joins the fit so the asset always sits on a visible ground diamond
  const foot = [[b.min[0], b.min[1], 0], [b.max[0], b.min[1], 0], [b.max[0], b.max[1], 0], [b.min[0], b.max[1], 0]];
  const pts = [...faces.flatMap((f) => f.pts), ...foot].map(isoProject);
  const minX = Math.min(...pts.map((p) => p.sx)), maxX = Math.max(...pts.map((p) => p.sx));
  const minU = Math.min(...pts.map((p) => p.su)), maxU = Math.max(...pts.map((p) => p.su));
  const span = Math.max(maxX - minX, maxU - minU) || 1;
  const k = (THUMB_SIZE - 2 * THUMB_PAD) / span;
  const cx = (minX + maxX) / 2, cu = (minU + maxU) / 2;
  const project = (p) => { const q = isoProject(p); return { x: THUMB_SIZE / 2 + (q.sx - cx) * k, y: THUMB_SIZE / 2 - (q.su - cu) * k, depth: q.depth }; };
  const painted = solidFaces(faces, project);   // the ONE painter — FAR→NEAR
  // opacity is a MATERIAL property in glTF (the glass's baseColorFactor alpha), so every face of a colour shares it
  const opacityByColor = new Map(faces.map((f) => [f.color, f.opacity]));
  const footD = foot.map(project).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const polys = painted.map((fc) =>
    `<polygon points="${fc.d}" fill="${shade(fc.color ?? THUMB_FLOOR, FACE_SHADE[fc.kind])}" fill-opacity="${opacityByColor.get(fc.color) ?? 1}" stroke="${THUMB_EDGE}" stroke-width="0.5" stroke-opacity="0.75" stroke-linejoin="round"/>`);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${THUMB_SIZE}" height="${THUMB_SIZE}" viewBox="0 0 ${THUMB_SIZE} ${THUMB_SIZE}">`,
    `<rect width="${THUMB_SIZE}" height="${THUMB_SIZE}" fill="${THUMB_GROUND}"/>`,
    `<polygon points="${footD}" fill="${THUMB_FLOOR}" fill-opacity="0.08" stroke="${THUMB_FLOOR}" stroke-width="0.6" stroke-opacity="0.45" stroke-dasharray="3 2"/>`,
    ...polys,
    `</svg>`,
  ].join("\n");
}

async function launch() {
  const { chromium } = await import("playwright");
  try { return await chromium.launch(); } catch (e) {
    const cands = [process.env.CHROMIUM_PATH, "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome", "/usr/bin/chromium"].filter(Boolean);
    for (const x of cands) { if (fs.existsSync(x)) { try { return await chromium.launch({ executablePath: x }); } catch { /* next */ } } }
    throw e;
  }
}

export async function buildThumbs(outDir = OUT, only = ONLY) {
  const manifestPath = path.join(outDir, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  fs.mkdirSync(path.join(outDir, "thumbs"), { recursive: true });
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: THUMB_SIZE, height: THUMB_SIZE }, deviceScaleFactor: 1 });
  const done = [];
  try {
    for (const entry of manifest.assets) {
      if (only && entry.id !== only) continue;
      const file = path.basename(entry.model, ".glb");
      const mesh = readGlb(fs.readFileSync(path.join(outDir, entry.model)));
      const svg = thumbSvg(mesh);
      if (KEEP_SVG) fs.writeFileSync(path.join(outDir, "thumbs", `${file}.svg`), svg + "\n");
      await page.setContent(`<!doctype html><html><body style="margin:0;background:${THUMB_GROUND}">${svg}</body></html>`);
      const png = path.join(outDir, "thumbs", `${file}.png`);
      await page.screenshot({ path: png, clip: { x: 0, y: 0, width: THUMB_SIZE, height: THUMB_SIZE } });
      entry.thumbnail = `thumbs/${file}.png`;
      done.push({ id: entry.id, png, tris: mesh.triCount });
    }
  } finally {
    await browser.close();
  }
  manifest.assets = manifest.assets.map(normalizeManifestEntry);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  return done;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const done = await buildThumbs(OUT, ONLY);
  for (const d of done) console.log(`${d.id} → ${path.relative(OUT, d.png)} (${d.tris} tris)`);
  console.log(`rendered ${done.length} thumbnail(s) into ${path.join(OUT, "thumbs")}`);
}
