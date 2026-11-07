// architect-asset-inventory.mjs — generates docs/architecture-2525/ASSET_INVENTORY.md (the intake master §29 completeness
// ledger) from the ONE source lib/architect-2525/assets/inventory.ts. Deterministic: same source → byte-identical ledger
// (no timestamps, no git, no I/O but the write), sorted by origin (LIBRARY · §18 · BOARD · DUPLICATE) then id; the gate
// tests/architect-asset-inventory.test.mjs regenerates and compares byte for byte.
//   npm run assets:inventory   (= node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs scripts/architect-asset-inventory.mjs)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  ASSET_INVENTORY, inventorySummary, sortedRows, canonicalRows, missingByPack, PACK_LABELS, PACK_NUMBERS, ORIGINS, ROOM_IDS, FILE_STATUSES, VISUAL_QA,
  BOARDS, BOARD_ALIASES, SHARED_GEOMETRY, FLOOR_FLOATS, FLOOR_SUNK, FLOOR_EPS_M, STARTER_LINEAGE, PLACEMENTS, MANIFEST_COUNT,
  LIBRARY_ROOT, STARTER_ROOT, ROTATOR_CATALOG, BOARDS_ROOT, MANIFEST_SOURCE, MASTER_18_SOURCE, ID_PREFIX,
} from "../lib/architect-2525/assets/inventory.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");   // repo root
export const LEDGER_PATH = "docs/architecture-2525/ASSET_INVENTORY.md";
export const COLUMNS = ["REFERENCE NAME", "NORMALIZED ASSET ID", "SOURCE BOARD(S)", "PACK(S)", "ROOM(S)", "PHASE(S)", "GLB STATUS", "PLAN STATUS", "METADATA STATUS", "VISUAL QA", "NOTES"];

const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
const srcName = (s) => s === MANIFEST_SOURCE ? "manifest.json" : s === MASTER_18_SOURCE ? "§18" : s;
const ORIGIN_LABEL = { LIBRARY: "LIBRARY — his manifest (139)", MASTER_18: "§18 — intake master lines his library lacks", BOARD: "BOARD — wider-export labels his library lacks", DUPLICATE: "DUPLICATE_NORMALIZED — board labels resolved onto one row" };

function rowLine(r) {
  const names = r.referenceNames.map((n, i) => (i === 0 ? `**${n}**` : n)).join(" · ");
  return `| ${[names, `\`${r.id}\``, r.sources.map(srcName).join(" · "), r.packs.length ? r.packs.join(", ") : "—", r.rooms.join(", "), r.phases.join(", "), r.glb, r.plan, r.metadata, r.visualQa, r.notes].map(cell).join(" | ")} |`;
}

export function renderInventoryMarkdown(rows = ASSET_INVENTORY) {
  const s = inventorySummary(rows);
  const sorted = sortedRows(rows);
  const out = [];
  const p = (...l) => out.push(...l);
  p("# ARCHITECT-2525 · ASSET INVENTORY — completeness ledger (intake master §29)", "",
    "GENERATED — do not edit. One source: `frontend/lib/architect-2525/assets/inventory.ts`; generator `frontend/scripts/architect-asset-inventory.mjs` (`npm run assets:inventory`); gate `frontend/tests/architect-asset-inventory.test.mjs` (byte-identical regeneration · every count below · his manifest/placements/validation/metadata/GLBs · the rotator catalog · the starter manifest · the intake master §18).", "",
    `Ids are the operator's — \`${LIBRARY_ROOT}/manifest.json\` (his COMPLETE 3D Asset Library, 2026-11-07: ${MANIFEST_COUNT} semantic assets = 137 exact-name board assets + 2 dining extras, each GLB + metadata + PLAN SVG). A §18 line or a wider-board label his library does not carry is its own MISSING row in his id style (\`${ID_PREFIX}<words>.v1\`). Statuses are derived from his files, never typed by hand; this ledger determines completeness — never a screenshot.`, "");
  p("## 0. TOTALS", "");
  const libQa = rows.filter((r) => r.origin === "LIBRARY" && r.visualQa === "PENDING").length;
  p(`- **Manifest assets (his library): ${s.byOrigin.LIBRARY}** — GLB READY ${s.byGlb.READY} · PLAN READY ${s.byPlan.READY} · METADATA READY ${s.byMetadata.READY} · VISUAL QA PENDING ${libQa} (§31 captures not taken yet; ${s.byVisualQa.PENDING} rows pending in all)`);
  p(`- **§18 lines his library lacks: ${s.byOrigin.MASTER_18}** — MISSING (${s.onlyIn18} of them have no board silhouette at all)`);
  p(`- **Wider-export labels his library lacks: ${s.byOrigin.BOARD}** — MISSING (printed on the overview / living-room / house / room / standalone boards, on no §18 list)`);
  p(`- DUPLICATE_NORMALIZED rows: ${s.byOrigin.DUPLICATE} (distinct-looking board labels resolved onto one row — shown, not counted as assets)`);
  p(`- Distinct assets: ${s.distinct} · rows: ${s.total} · GLB MISSING: ${s.byGlb.MISSING} · GLB PLACEHOLDER: ${s.byGlb.PLACEHOLDER} · GLB NEEDS_REBUILD: ${s.byGlb.NEEDS_REBUILD}`);
  p(`- **Board placements (his \`inventory/placements.json\`): ${PLACEMENTS.total}** → ${PLACEMENTS.uniqueIds} ids; by pack ${PACK_NUMBERS.map((n) => `${n}:${PLACEMENTS.byPack[n]}`).join(" · ")}`);
  p(`- Geometry facts (recomputed by the gate from his GLBs): ${s.sharedGeometryGroups} byte-identical groups over ${s.sharedGeometryIds} ids · ${s.floorFloats} floor/built-in models float (min z > ${FLOOR_EPS_M} m) · ${s.floorSunk} sink below the floor · ${s.starterSuperseded} starter ids superseded (the 2026-11-06 pack)`);
  p(`- Rows on no pack list: ${s.noPack} (all BOARD rows — pack left open rather than guessed)`, "");
  p("### By pack", "", "| Pack | Name | Placements (his) | Manifest assets | Ledger rows | READY | MISSING |", "|---|---|---:|---:|---:|---:|---:|");
  for (const n of PACK_NUMBERS) { const b = s.byPack[n]; p(`| ${n} | ${PACK_LABELS[n]} | ${PLACEMENTS.byPack[n]} | ${b.manifest} | ${b.rows} | ${b.ready} | ${b.missing} |`); }
  p("", "Ledger rows per pack = his manifest packs ∪ the §18 packs that name the asset (a row in two packs counts in both); the two dining extras carry packs [] in his manifest and Pack 2 from §18.", "");
  p("### By room (distinct rows; a row in several rooms counts in each)", "", "| Room | Rows |", "|---|---:|");
  for (const r of ROOM_IDS) p(`| ${r} | ${s.byRoom[r]} |`);
  p("", "### By status (distinct rows)", "", "| Status | GLB | PLAN | METADATA |", "|---|---:|---:|---:|");
  for (const st of FILE_STATUSES) p(`| ${st} | ${s.byGlb[st]} | ${s.byPlan[st]} | ${s.byMetadata[st]} |`);
  p("", `Visual QA: ${VISUAL_QA.map((v) => `${v} ${s.byVisualQa[v]}`).join(" · ")}`, "");
  p("## 1. LEDGER", "", "Sorted by origin, then id. REFERENCE NAME = his label (bold) followed by every other name printed for it on a board or in §18.", "");
  let current = null;
  for (const r of sorted) {
    if (r.origin !== current) { current = r.origin; p(`### ${ORIGIN_LABEL[current]}`, "", `| ${COLUMNS.join(" | ")} |`, `|${COLUMNS.map(() => "---").join("|")}|`); }
    p(rowLine(r));
    if (sorted[sorted.indexOf(r) + 1]?.origin !== current) p("");
  }
  p("## 2. MISSING — what must still be modelled", "", "Distinct rows whose GLB is MISSING, by pack (a row in two packs is listed under both; — = on no pack list).", "");
  const missing = missingByPack(rows);
  for (const k of [...PACK_NUMBERS.map(String), "—"]) {
    const list = missing[k] ?? [];
    p(`### Pack ${k}${k === "—" ? " (no pack)" : ` — ${PACK_LABELS[Number(k)]}`} — ${list.length} missing`, "");
    for (const r of list) p(`- \`${r.id}\` — ${r.label} (${r.origin === "MASTER_18" ? "§18" : "board"})`);
    p("");
  }
  p("## 3. SHARED GEOMETRY (byte-identical GLBs under different ids)", "", "Distinct ids kept per the operator's rule — never merged; each group is one rebuild target for higher-fidelity models.", "");
  SHARED_GEOMETRY.forEach((g, i) => p(`${i + 1}. ${g.map((sl) => `\`${ID_PREFIX}${sl.replace(/-/g, ".")}.v1\``).join(" ≡ ")}`));
  p("", `### Floor / built-in models that float (min z > ${FLOOR_EPS_M} m)`, "");
  for (const [sl, z] of Object.entries(FLOOR_FLOATS).sort()) p(`- \`${ID_PREFIX}${sl.replace(/-/g, ".")}.v1\` — min z ${z.toFixed(3)} m`);
  p("", "### Models sunk below the floor (min z < -0.02 m)", "");
  for (const [sl, z] of Object.entries(FLOOR_SUNK).sort()) p(`- \`${ID_PREFIX}${sl.replace(/-/g, ".")}.v1\` — min z ${z.toFixed(3)} m`);
  p("", "### Starter lineage (2026-11-06 pack → his complete library)", "");
  for (const [sl, st] of Object.entries(STARTER_LINEAGE).sort()) p(`- \`${st}\` → \`${ID_PREFIX}${sl.replace(/-/g, ".")}.v1\``);
  p("", "## 4. SOURCES", "", `- His complete library: \`${LIBRARY_ROOT}\` (manifest.json · inventory/placements.json · docs/VALIDATION.json · models/ · metadata/ · plan/)`,
    `- His 10-pack rotator catalog: \`${ROTATOR_CATALOG}\` (137 labels, all covered by the ledger)`, `- The 2026-11-06 starter pack: \`${STARTER_ROOT}\` (18 ids, all superseded)`,
    `- The intake master §18 complete pack coverage target: \`${MASTER_18_SOURCE}\``, `- His library export, 35 boards under \`${BOARDS_ROOT}\`:`, "");
  for (const b of BOARDS) p(`  - ${b}`);
  p("", "- The 18 chat boards + 2 first-send JPGs under `docs/asks/img/` duplicate the export by content (3 byte-identical, the rest re-encodes/crops) — each counted once as the board it shows:", "");
  for (const [a, b] of Object.entries(BOARD_ALIASES)) p(`  - ${a} → ${b}`);
  p("");
  return out.join("\n");
}

export function writeLedger() {
  const md = renderInventoryMarkdown();
  const file = path.join(ROOT, LEDGER_PATH);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, md);
  return file;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = writeLedger();
  const s = inventorySummary();
  console.log(`wrote ${path.relative(ROOT, file)} — rows ${s.total} (manifest ${s.byOrigin.LIBRARY} · §18-only ${s.byOrigin.MASTER_18} · board-only ${s.byOrigin.BOARD} · duplicates ${s.byOrigin.DUPLICATE}) · GLB READY ${s.byGlb.READY} · MISSING ${s.byGlb.MISSING} · placements ${PLACEMENTS.total}`);
  for (const n of PACK_NUMBERS) { const b = s.byPack[n]; console.log(`  pack ${String(n).padStart(2)} ${PACK_LABELS[n].padEnd(38)} placements ${String(PLACEMENTS.byPack[n]).padStart(2)} · manifest ${String(b.manifest).padStart(2)} · rows ${String(b.rows).padStart(2)} · ready ${String(b.ready).padStart(2)} · missing ${String(b.missing).padStart(2)}`); }
}
