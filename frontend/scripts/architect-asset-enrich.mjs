#!/usr/bin/env node
/**
 * ARCHITECT-2525 · ASSET ENRICH (operator 2026-11-08: "really make 3D as close as you can to 2D drawings; note theres
 * more dimensionality in these i know you can figure out"). The REBUILD PATH for assets whose delivered GLB reads flat —
 * typically a SOLID carcass box that occludes its own interior (e.g. Storage Shelving rendered as a plain box although it
 * has 4 shelves inside). Each entry below re-authors the asset as an OPEN composition (box parts, metres, Z-up, floor
 * centre) through the pure in-repo GLB writer, and writes ONLY models/<file>.glb into the served library — his metadata,
 * plan.svg, manifest row and id are untouched (dims preserved). Every rebuilt id is recorded as an operator-approved
 * rebuild in tests/architect-asset-glb.test.mjs (the "his bytes" gate), and this script prints the new sha256 to paste.
 *
 *   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs scripts/architect-asset-enrich.mjs [--only <file>]
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { writeGlb, partMesh, rawMeshBounds } from "../lib/architect-2525/assets/gltf/glb-writer.ts";
import { materialForRole } from "../lib/architect-2525/assets/compositions/index.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODELS = path.resolve(HERE, "../public/architect-2525/assets/models");
const r4 = (v) => Math.round(v * 1e4) / 1e4;

// box part helper (size [w,d,h] metres, centre [x,y,z] metres, material role)
const box = (name, size, center, material) => ({ kind: "box", name, size: size.map(r4), center: center.map(r4), material });

/** An open-frame shelving/rack unit: back + 2 sides + bottom + top (front OPEN), with `shelfCount` interior shelves. */
function openShelf({ w, d, h, t = 0.04, shelfCount = 3, frame = "ARCH_TEAL", shelf = "EDGE" }) {
  // The OPEN front faces -Y (toward the Asset Lab's default camera: package -Y maps to +Z after the Z-up→Y-up intake),
  // so the shelves read on first view; the back panel sits at +Y (against-the-wall side). In the walk/house it rotates.
  const parts = [
    box("back",   [w, t, h],         [0,  (d / 2 - t / 2), h / 2], frame),
    box("left",   [t, d, h],         [-(w / 2 - t / 2), 0, h / 2], frame),
    box("right",  [t, d, h],         [ (w / 2 - t / 2), 0, h / 2], frame),
    box("bottom", [w, d, t],         [0, 0, t / 2], frame),
    box("top",    [w, d, t],         [0, 0, h - t / 2], frame),
  ];
  // interior shelves spaced evenly between the bottom and top panels (attached toward the back, open at the front)
  for (let i = 1; i <= shelfCount; i++) {
    const z = r4((h * i) / (shelfCount + 1));
    parts.push(box(`shelf${i}`, [w - 2 * t, d - t, t], [0, t / 2, z], shelf));
  }
  return parts;
}

// ── enriched assets (dims MATCH the delivered metadata so his contract holds) ──
const ENRICH = {
  // Storage Shelving — delivered as a solid 1.15×0.4×1.55 carcass hiding 4 shelves; now an open rack (shelves visible).
  "storage-shelving": { parts: openShelf({ w: 1.15, d: 0.4, h: 1.55, shelfCount: 4 }) },
  // Utility Shelving — same class (an open utility rack).
  "utility-shelving": { parts: openShelf({ w: 1.0, d: 0.45, h: 1.8, shelfCount: 4 }) },
};

const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const roleList = (parts) => { const r = []; for (const p of parts) if (!r.includes(p.material)) r.push(p.material); return r; };

for (const [file, def] of Object.entries(ENRICH)) {
  if (only && file !== only) continue;
  const roles = roleList(def.parts);
  const input = {
    parts: def.parts.map((p) => ({ name: p.name, material: p.material, mesh: partMesh(p) })),
    materials: roles.map(materialForRole),
    generator: "architect-2525/assets-enrich",
    rootName: "world",
  };
  const bytes = Buffer.from(writeGlb(input));
  const dest = path.join(MODELS, `${file}.glb`);
  fs.writeFileSync(dest, bytes);
  // report bounds + sha for the approved-rebuild record
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const p of def.parts) { const b = rawMeshBounds(partMesh(p)); for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], b.min[i]); max[i] = Math.max(max[i], b.max[i]); } }
  const sha = crypto.createHash("sha256").update(bytes).digest("hex");
  console.log(`${file}.glb  sha256 ${sha}  bytes ${bytes.length}  bounds [${min.map((v)=>v.toFixed(2))}]..[${max.map((v)=>v.toFixed(2))}]  tris ${def.parts.reduce((s,p)=>s+partMesh(p).indices.length/3,0)}`);
}
