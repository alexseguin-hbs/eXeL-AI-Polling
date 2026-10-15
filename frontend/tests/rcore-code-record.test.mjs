// THE CODE RECORD IS TRUE, OR IT IS NOT SHIPPED (DD-53, DD-61..DD-68).
//
// Operator 2026-10-14: a code mode "that saves version of code for traceability, so future versions of AI and HI
// can see exactly what happened". A record that cannot be checked against the commits it cites would be the
// exact opposite of that, so every claim here is proven against git rather than trusted.
//
// Not in prebuild: the blob and ancestry assertions shell out to git and Cloudflare's builder clone depth is not
// ours to set — a gate green in CI and red on the builder is worse than no gate (the r.208 precedent, and the
// same reason tests/sensor-fusion-ledger.test.mjs stays out). In test:ci only.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const TRACE = path.join(ROOT, "docs/traceability");
const reg = JSON.parse(fs.readFileSync(path.join(TRACE, "projects.registry.json"), "utf8"));
const STATES = new Set(["recorded", "no-code-change", "no-commit", "unreachable", "truncated"]);

const projects = reg.routes.filter((r) => r.kind === "project");
ok(projects.length >= 6, `the registry names projects (${projects.length}) — a walk that finds nothing must fail, not pass 0 of 0`);

// ── every project DECLARES whether it has code, and a "no" carries his reason ──────────────────────────────
// EVERY project row DECLARES whether it has code. The first version of this line was
// `ok("codeRecord" in p || true, ...)` — a tautology that read as if it policed the declaration and policed
// nothing, over exactly the gap it was meant to watch. Projects still owed a record are counted and NAMED, so
// the number is on the record rather than implied by silence.
const owed = projects.filter((p) => !("codeRecord" in p)).map((p) => p.route);
console.log(`  code records: ${projects.filter((p) => typeof p.codeRecord === "string").length} carried · ` +
  `${projects.filter((p) => p.codeRecord === false).length} excused · ${owed.length} owed${owed.length ? " (" + owed.join(", ") + ")" : ""}`);
for (const p of projects) {
  if (p.codeRecord === false)
    ok(typeof p.codeWhy === "string" && p.codeWhy.length > 40,
      `${p.route}: codeRecord false carries the reason in one line (DD-62, "Vision-2525 is a white paper so does not have code")`);
}
const withCode = projects.filter((p) => typeof p.codeRecord === "string");
ok(withCode.length >= 2, `projects carrying a code record (${withCode.length})`);

for (const p of withCode) {
  const id = p.ledger.replace(/\.ledger\.json$/, "");
  // ── the AREAS are a fixed map of the project's own parts (DD-66) ─────────────────────────────────────────
  ok(Array.isArray(p.areas) && p.areas.length >= 2, `${p.route}: declares its areas (${p.areas?.length ?? 0})`);
  ok(p.areas.every((a) => a.key && a.name), `${p.route}: every area has a key and a name`);
  ok(new Set(p.areas.map((a) => a.key)).size === p.areas.length, `${p.route}: area keys are unique`);
  ok(p.areas.every((a) => (a.paths || []).length || (a.ids || []).length), `${p.route}: every area declares how it is matched (paths or ids)`);
  ok(Array.isArray(p.paths) && p.paths.length > 0, `${p.route}: declares the paths it owns`);

  const recPath = path.join(TRACE, `${id}.code.json`);
  ok(fs.existsSync(recPath), `${p.route}: its code record exists (${id}.code.json)`);
  if (!fs.existsSync(recPath)) continue;
  const rec = JSON.parse(fs.readFileSync(recPath, "utf8"));
  const led = JSON.parse(fs.readFileSync(path.join(TRACE, p.ledger), "utf8"));

  // ── one row per ledger revision — never fewer, so a revision cannot quietly vanish ───────────────────────
  ok(rec.revisions.length === led.entries.length,
    `${p.route}: the code record covers EVERY ledger revision (${rec.revisions.length} vs ${led.entries.length})`);
  ok(rec.revisions.every((r, i) => r.rev === led.entries[i].rev), `${p.route}: the records are in ledger order`);
  ok(rec.revisions.every((r) => STATES.has(r.status)), `${p.route}: every revision carries one of the five declared states`);
  ok(rec.revisions.every((r) => (r.areas || []).every((a) => STATES.has(a.status))), `${p.route}: every area carries a declared state`);
  ok(rec.cap && rec.cap.bytes > 0 && rec.cap.lines > 0, `${p.route}: the cap is RECORDED, so truncation is never silent`);

  // ── the 27 cells are fully partitioned among the areas, none shared ──────────────────────────────────────
  const cells = rec.areas.flatMap((a) => a.c ?? a.cells ?? []);
  ok(cells.length === 27 && new Set(cells).size === 27,
    `${p.route}: the 27 cube cells are partitioned across the areas exactly once (${cells.length} cells, ${new Set(cells).size} distinct)`);

  // ── ANCESTRY, not existence. `git cat-file -e` passes for a commit on an abandoned branch. ───────────────
  // ── And every recorded blob really is what that commit holds at that path. ───────────────────────────────
  let checkedBlobs = 0, badBlob = 0, badAnc = 0;
  for (const r of rec.revisions) {
    if (!r.commit) { ok(r.status === "no-commit", `${p.route} rev ${r.rev}: a row with no commit says so`); continue; }
    let anc = true;
    try { execSync(`git -C ${ROOT} merge-base --is-ancestor ${r.commit} HEAD`, { stdio: "ignore" }); } catch { anc = false; }
    if (!anc && r.status !== "unreachable") badAnc++;
    if (!anc) continue;
    for (const a of r.areas || []) for (const f of a.files || []) {
      if (!f.blob) continue;
      if (checkedBlobs >= 40) continue;           // a sample, named as one — 40 exact proofs per project
      checkedBlobs++;
      let real = null;
      try { real = execSync(`git -C ${ROOT} rev-parse ${r.commit}:${f.path}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { /* deleted here */ }
      if (real && real !== f.blob) badBlob++;
    }
  }
  ok(badAnc === 0, `${p.route}: every cited commit is an ANCESTOR of HEAD, or the row is written "unreachable" (${badAnc} wrong)`);
  ok(badBlob === 0, `${p.route}: every recorded blob sha equals git rev-parse <commit>:<path> (${checkedBlobs} checked, ${badBlob} wrong)`);
  ok(checkedBlobs > 0, `${p.route}: the blob proof actually ran (${checkedBlobs} blobs) — it may not pass by checking nothing`);

  // ── THE FILES THE UI ACTUALLY FETCHES EXIST, AND CARRY THE AREAS THE RECORD CLAIMS ──────────────────────
  // The payloads under public/r-core/code/ are written only on a real run (never under --check), so until this
  // loop existed both new gates stayed green with that directory deleted — and every area would then render the
  // "could not be loaded" line. The record is only as true as the thing it points at.
  let payloads = 0, missingPayload = 0, missingArea = 0;
  for (const r of rec.revisions) {
    const want = (r.areas || []).filter((a) => a.bytes > 0);
    if (!want.length) continue;
    const abs = path.join(ROOT, "frontend/public/r-core/code", id, `${r.rev}.json`);
    if (!fs.existsSync(abs)) { missingPayload++; continue; }
    payloads++;
    let j = null; try { j = JSON.parse(fs.readFileSync(abs, "utf8")); } catch { missingPayload++; continue; }
    for (const a of want) if (typeof j?.areas?.[a.key] !== "string") missingArea++;
  }
  ok(missingPayload === 0, `${p.route}: every revision with a change has its fetchable payload under public/r-core/code/${id}/ (${missingPayload} missing or unparseable)`);
  ok(missingArea === 0, `${p.route}: every recorded area is present in that payload (${missingArea} absent)`);
  ok(payloads > 0, `${p.route}: the payload proof actually ran (${payloads} files) — it may not pass by checking nothing`);

  // ── the client projection exists and agrees with the record ──────────────────────────────────────────────
  const genPath = path.join(ROOT, "frontend/lib/2525-core", `${id}-code.gen.ts`);
  ok(fs.existsSync(genPath), `${p.route}: the client projection exists (${id}-code.gen.ts)`);
  if (fs.existsSync(genPath)) {
    const g = fs.readFileSync(genPath, "utf8");
    ok(/GENERATED by frontend\/scripts\/gen-rcore-code\.mjs/.test(g), `${p.route}: the projection says it is generated`);
    const m = /export const ([A-Z0-9_]+_CODE) =/.exec(g);
    ok(!!m, `${p.route}: the projection exports its record constant`);
    ok(!/"blob":/.test(g), `${p.route}: the projection carries NO blob shas — those are for the gate, not the bundle`);
    const revs = (g.match(/"r":\d+,"s":/g) || []).length;
    ok(revs === rec.revisions.length, `${p.route}: the projection carries every revision (${revs} vs ${rec.revisions.length})`);
  }
}

// ── the panel: his chip, and the branch order that makes Code reachable ──────────────────────────────────────
const panel = fs.readFileSync(path.join(ROOT, "frontend/components/2525-core/rcore-revision-panel.tsx"), "utf8");
ok(/data-rcore-mode="cmpVC"/.test(panel), "the panel carries the </> Code mode beside Unified and Side-by-side");
ok(/\/r-core\/code-icon\.png/.test(panel) && /\/r-core\/code-wordmark\.png/.test(panel),
  "the chip is HIS raster pair (DD-65) — the icon at rest, the wordmark when active — not a drawn glyph");
ok(/height: CODE_CHIP_H/.test(panel) && !/height: \d+, width: "auto"/.test(panel),
  "the chip's height is the shared constant, never a literal (the panel's one-size rule)");
// The code branch MUST precede the prose diff's token-cap return, or Code is unreachable on exactly the large
// revisions a reader most wants it for.
// Anchor on the RENDER CALL, not on `diffMode === "code"` — that string also appears in the chip's own
// aria-pressed and background, which sit above the body and made the first version of this assertion
// unfalsifiable. Caught by sabotage: moving the branch below the cap did not turn it red.
const iCode = panel.indexOf("<RCoreCodeView"), iTooLarge = panel.indexOf("cmp.ops === null ?");
ok(iCode > 0 && iTooLarge > 0 && iCode < iTooLarge,
  `the code branch is HOISTED above the "too large" return (code at ${iCode}, too-large at ${iTooLarge}) — after it, Code would be dead on big revisions`);
ok(/code\?: RCoreCodeRecord/.test(panel) && /hasCode/.test(panel),
  "the chip appears only when the project HAS a code record (DD-62: /vision-2525 passes none)");

// his rasters actually shipped, and are chip-sized rather than poster-sized
for (const f of ["code-icon.png", "code-wordmark.png"]) {
  const abs = path.join(ROOT, "frontend/public/r-core", f);
  ok(fs.existsSync(abs), `his raster ${f} is served`);
  if (fs.existsSync(abs)) ok(fs.statSync(abs).size < 40_000, `${f} is resampled for a chip (${fs.statSync(abs).size} B < 40 KB)`);
}

console.log(`\nrcore-code-record: ${pass} passed, ${fail} failed · ${withCode.length} projects carry a per-revision code record`);
if (fail) process.exit(1);
