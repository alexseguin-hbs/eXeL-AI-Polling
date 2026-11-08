#!/usr/bin/env node
/**
 * ARCHITECT-2525 · ASSET LAB CATALOG — one catalog.json the 3D Asset Lab fetches at runtime.
 * Built from the 139 library metadata files (the operator's own GLB library), grouped pack → section → asset,
 * exactly the structure of his ALL_ASSETS rotator (DATA.packs[].sections[].assets[]) so the Lab reads like his files.
 * Pure/deterministic: manifest order within each (pack, section). The Lab loads each GLB from its served model path
 * with three.js and lights it in his cyan/violet scheme — no base64 embed; the real 139 GLBs already live in public/.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(HERE, "..", "public", "architect-2525", "assets");
const manifest = JSON.parse(readFileSync(path.join(ASSETS, "manifest.json"), "utf8"));

// Friendly pack names (operator's board set). Falls back to "Pack N" if a number appears that isn't mapped.
const PACK_TITLES = {
  1: "Shell & Structure", 2: "Interiors & Fixtures + MEP", 3: "Finishes, Lighting & Site",
  4: "Appliances, Utilities & Life Systems", 5: "Smart Home", 6: "Site & Landscape",
  7: "Accessibility", 8: "Sustainability", 9: "Lifestyle", 10: "Operations & Maintenance",
};

const metaFor = (a) => {
  // manifest metadata path is like "metadata/x.json"
  try { return JSON.parse(readFileSync(path.join(ASSETS, a.metadata), "utf8")); } catch { return {}; }
};

// Group each asset once, under its PRIMARY pack (packs[0]) and its first section, so the catalog holds all 139 distinctly.
const packs = new Map(); // n -> { n, title, sections: Map<title, assets[]> }
let count = 0;
for (const a of manifest.assets) {
  const m = metaFor(a);
  const pn = (a.packs && a.packs[0]) || (m.packs && m.packs[0]) || 0;
  const section = (m.sections && m.sections[0]) || "General";
  if (!packs.has(pn)) packs.set(pn, { n: pn, title: PACK_TITLES[pn] || `Pack ${pn}`, sections: new Map() });
  const p = packs.get(pn);
  if (!p.sections.has(section)) p.sections.set(section, []);
  const d = m.dimensionsM || {};
  p.sections.get(section).push({
    id: a.id,
    label: a.label,
    model: `/architect-2525/assets/${a.model.replace(/^\.?\/?/, "")}`,
    thumb: a.thumbnail ? `/architect-2525/assets/${a.thumbnail.replace(/^\.?\/?/, "")}` : null,
    w: d.width ?? null, d: d.depth ?? null, h: d.height ?? null,
  });
  count++;
}

const out = {
  version: manifest.version || "1.0",
  date: manifest.date || "",
  count,
  packs: [...packs.values()].sort((x, y) => x.n - y.n).map((p) => ({
    n: p.n, title: p.title,
    sections: [...p.sections.entries()].map(([title, assets]) => ({ title, assets })),
  })),
};

const dest = path.join(ASSETS, "catalog.json");
writeFileSync(dest, JSON.stringify(out));
const totalInCatalog = out.packs.reduce((s, p) => s + p.sections.reduce((t, sec) => t + sec.assets.length, 0), 0);
console.log(`catalog.json: ${out.packs.length} packs · ${totalInCatalog}/${manifest.assets.length} assets · ${(JSON.stringify(out).length/1024).toFixed(1)} KB`);
if (totalInCatalog !== manifest.assets.length) { console.error(`MISMATCH: ${totalInCatalog} != ${manifest.assets.length}`); process.exit(1); }
