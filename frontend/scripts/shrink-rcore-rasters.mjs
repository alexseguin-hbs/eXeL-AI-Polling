#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════════════════════════════════
 * D-26 · THE R-CORE RASTERS SHRINK IN PIXELS ONLY, NEVER IN PROPORTIONS
 *
 * Operator 2026.10.17, asked which way to go when told the chip was a blank rectangle for seconds on
 * cellular: "Shrink pixels only, never proportions."
 *
 * WHAT WENT WRONG BEFORE, so it cannot be repeated by accident. An earlier attempt rendered his artwork
 * tiny inside a 16 px box; his wordmark's ink fills only 65% of its frame, so the word "Code" landed about
 * 5 px tall beside 11 px labels and he sent the picture again. That was a SIZING error, not a resampling
 * error. This script never crops, never pads, never changes the aspect: one uniform scale to a longest side
 * of 512 px, which leaves better than 4x headroom over the largest box any of them is drawn in
 * (CODE_WORD_H = RCORE_LOGO_H = 42 CSS px) at any device pixel ratio.
 *
 * THE MASTER IS THE RECORD, THE SERVED FILE IS DERIVED. Each master lives under docs/asks/img/ and is
 * hashed in that ask's sidecar, so it is provably his. This script writes the served copy and records BOTH
 * hashes in frontend/public/r-core/DERIVED.sha256, so a re-derive is a visible diff and a hand-edited
 * served file goes red. tests/rcore-code-record.test.mjs holds the chain.
 *
 * NEVER IN prebuild. It shells out to ImageMagick, which is not on Cloudflare's builder — a gate green in
 * CI and red on the builder is worse than no gate (the r.208 precedent). The derived PNGs are committed
 * artefacts; the build only ever verifies them.
 *
 *   node scripts/shrink-rcore-rasters.mjs            dry run — prints what it WOULD write
 *   node scripts/shrink-rcore-rasters.mjs --write    derives and rewrites DERIVED.sha256
 * ════════════════════════════════════════════════════════════════════════════════════════════════
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const FRONTEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(FRONTEND, "..");
const WRITE = process.argv.includes("--write");
const LONGEST = 512;                       // the one rule; no per-file numbers
const ASK = "docs/asks/img/2026.10.11_18.56..53_drone2525";

// served path  ←  his master
const PAIRS = [
  ["frontend/public/r-core/code-icon.png",       `${ASK}_shot65.png`],
  ["frontend/public/r-core/code-wordmark.png",   `${ASK}_shot66.png`],
  ["frontend/public/r-core/r-core-icon.png",     `${ASK}_shot77_rcore-icon-master.png`],
  ["frontend/public/r-core/r-core-wordmark.png", `${ASK}_shot78_rcore-wordmark-master.png`],
];

const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const dim = (p) => {
  const b = fs.readFileSync(p);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error(`${p} is not a PNG`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), depth: b[24], ctype: b[25] };
};

const lines = [];
let changed = 0;
for (const [servedRel, masterRel] of PAIRS) {
  const served = path.join(ROOT, servedRel);
  const master = path.join(ROOT, masterRel);
  if (!fs.existsSync(master)) throw new Error(`REFUSE: no master for ${servedRel} at ${masterRel} — persist it before shrinking, or the derive destroys the only copy`);
  const m = dim(master);
  const scale = LONGEST / Math.max(m.w, m.h);
  if (scale >= 1) { console.log(`skip  ${servedRel} — master is already ${m.w}x${m.h}`); continue; }
  const w = Math.round(m.w * scale), h = Math.round(m.h * scale);
  const err = Math.abs((w / h) / (m.w / m.h) - 1);
  if (err > 0.005) throw new Error(`REFUSE: ${servedRel} would distort by ${(err * 100).toFixed(3)}% — the rounding is not uniform`);

  if (WRITE) {
    execFileSync("convert", [master, "-filter", "Lanczos", "-resize", `${w}x${h}!`,
      "-strip", "-define", "png:color-type=6", "-define", "png:bit-depth=8",
      "-define", "png:compression-level=9", served]);
  }
  const d = WRITE ? dim(served) : { w, h, depth: 8, ctype: 6 };
  const before = fs.statSync(master).size, after = WRITE ? fs.statSync(served).size : 0;
  console.log(`${WRITE ? "wrote" : "would"} ${servedRel.padEnd(42)} ${m.w}x${m.h} -> ${d.w}x${d.h}  aspect drift ${(err * 100).toFixed(3)}%  ${before} -> ${after || "?"} B`);
  if (WRITE) lines.push(`${sha(master)}  ${masterRel}  ->  ${sha(served)}  ${servedRel}  ${d.w}x${d.h} from ${m.w}x${m.h}`);
  changed++;
}

if (WRITE && lines.length) {
  const head = [
    "# D-26 — the served R-CORE rasters are UNIFORM downscales of the operator's own masters.",
    "# Left: the master's sha256 and its path under docs/asks/img (hashed again in that ask's sidecar, so it is",
    "# provably his). Right: the served file's sha256 and the derived dimensions. Both are pinned, so a re-derive",
    "# is a visible diff and a hand-edited served file goes red.",
    "# Regenerate: node scripts/shrink-rcore-rasters.mjs --write   (NEVER in prebuild — needs ImageMagick)",
  ];
  fs.writeFileSync(path.join(FRONTEND, "public/r-core/DERIVED.sha256"), head.concat(lines).join("\n") + "\n");
  console.log(`\nDERIVED.sha256 — ${lines.length} pinned`);
}
console.log(WRITE ? `shrink-rcore-rasters: ${changed} derived` : `\nDRY RUN — nothing written. Re-run with --write.`);
