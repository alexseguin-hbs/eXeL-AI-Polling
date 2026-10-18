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
  // two projects keep their record in another shape (SoI in the DRS living document, SensorFusion in hand-written
  // TypeScript), declared as ledgerAdapter in the registry — the same mapping gen-rcore-code.mjs uses, so the gate
  // and the generator cannot disagree about which file a record belongs to.
  const id = p.ledgerAdapter === "drs" ? "soi-2525"
    : p.ledgerAdapter === "sensor-fusion-ts" ? "sensorfusion-2525"
    : p.ledger.replace(/\.ledger\.json$/, "");
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
  // The same two adapters the generator uses (gen-rcore-code.mjs). The mapping is stated in BOTH places on
  // purpose: if they ever disagree the counts below go red, which is exactly what this gate is for.
  const led = p.ledgerAdapter === "drs"
    ? { entries: (JSON.parse(fs.readFileSync(path.join(ROOT, "docs/drs/drs.v00.00.json"), "utf8")).revisions || []).map((_, i) => ({ rev: i + 1 })) }
    : p.ledgerAdapter === "sensor-fusion-ts"
    ? { entries: [...fs.readFileSync(path.join(ROOT, "frontend/app/SensorFusion-2525/ledger.ts"), "utf8")
        .matchAll(/rev:\s*(\d+),\s*date:\s*"([^"]*)",\s*kind:\s*"([^"]*)",\s*text:\s*([\s\S]*?),\s*commit:\s*"([^"]*)",\s*\}/g)].map((m) => ({ rev: +m[1] })) }
    : JSON.parse(fs.readFileSync(path.join(TRACE, p.ledger), "utf8"));

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
ok(/height: codeStage === 0 \? CODE_CHIP_H : CODE_WORD_H/.test(panel) && !/height: \d+, width: "auto"/.test(panel),
  "each beat's height is its own shared constant, never a literal (the panel's one-size rule)");
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

// ── HIS ARTWORK IS HIS ARTWORK (DD-65 · DD-72 · D-26) ───────────────────────────────────────────────────────
// He sent the </> pair three times. The first time I resampled it to a 96x32 chip, which dropped his wordmark's
// ink to 10.5 px — a SIZING error, not a resampling one — and he sent the art again.
//
// D-26 (2026.10.17), his words when told the 2.3 MB pair renders as a blank rectangle for seconds on cellular:
// "Shrink pixels only, never proportions." So the served file is no longer byte-identical to his master; it is
// a UNIFORM downscale of it, and the proof changes shape accordingly — from one hash to a CHAIN:
//     his master (hashed in the ask sidecar, provably his)
//       -> DERIVED.sha256 (both hashes pinned, written by scripts/shrink-rcore-rasters.mjs)
//         -> the served file (same aspect to within integer rounding, strictly smaller, alpha intact)
// Byte-identity would be the easier assertion and it is the wrong one now: it would forbid the thing he asked
// for. The aspect tolerance is the whole safety margin — if it ever needs loosening, the scale rule is wrong,
// not the tolerance.
import { createHash } from "node:crypto";
const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const sidecar = fs.readFileSync(path.join(ROOT, "docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md.sha256"), "utf8");
const png = (b) => ({ w: b.readUInt32BE(16), h: b.readUInt32BE(20), depth: b[24], ctype: b[25] });
const derived = fs.readFileSync(path.join(ROOT, "frontend/public/r-core/DERIVED.sha256"), "utf8");
const PAIRS = [
  ["code-icon.png", "shot65"], ["code-wordmark.png", "shot66"],
  ["r-core-icon.png", "shot77_rcore-icon-master"], ["r-core-wordmark.png", "shot78_rcore-wordmark-master"],
];
ok(PAIRS.length === 4, "all four R-CORE rasters are in the chain — the badge pair had NO master and no pin before D-26");
for (const [served, shot] of PAIRS) {
  const abs = path.join(ROOT, "frontend/public/r-core", served);
  const src = path.join(ROOT, `docs/asks/img/2026.10.11_18.56..53_drone2525_${shot}.png`);
  ok(fs.existsSync(abs) && fs.existsSync(src), `${served} and its master ${shot} both exist`);
  if (!fs.existsSync(abs) || !fs.existsSync(src)) continue;
  const sb = fs.readFileSync(abs), mb = fs.readFileSync(src);
  const hs = sha256(sb), hm = sha256(mb);
  const S = png(sb), M = png(mb);

  // 1 · the master is provably HIS — the ask sidecar hashes it
  ok(sidecar.split("\n").some((l) => l.includes(`_${shot}.png`) && l.trim().split(/\s+/)[0] === hm),
    `${shot} is the master the ask sidecar hashes — the chain is anchored on his own file`);

  // 2 · the served file derives from THAT master, both ends pinned
  ok(derived.split("\n").some((l) => l.includes(hm) && l.includes(hs) && l.includes(served)),
    `${served} is pinned in DERIVED.sha256 as the derivative of ${shot} — a re-derive is a visible diff`);

  // 3 · pixels only: same aspect, strictly smaller, alpha and depth intact
  const drift = Math.abs((S.w / S.h) / (M.w / M.h) - 1);
  ok(drift <= 0.005, `${served} keeps his proportions — aspect drift ${(drift * 100).toFixed(3)}% of ${M.w}x${M.h} (<= 0.5%, integer rounding only)`);
  ok(Math.max(S.w, S.h) === 512, `${served} is scaled to the one rule: longest side 512 (got ${S.w}x${S.h})`);
  ok(S.w * S.h < M.w * M.h && sb.length < mb.length, `${served} is strictly smaller than its master (${sb.length} < ${mb.length} B)`);
  ok(S.ctype === 6 && S.depth === 8, `${served} keeps RGBA at 8 bits — his neon halo survives the scale`);
}
// ── HIS MINIMUM BAR IS A GATE, NOT A REPORT (operator 2026.10.17) ───────────────────────────────────────────
// "i asked for code section added for each revision (minimum have the latest code for the latest revision for
// each project". Measured when he said it: the NEWEST row of SIX of the nine projects had no code at all —
// Architect r4, Celestial r3, Security r4, SensorFusion r77, Light Codex r20 (empty `commit` in the ledger)
// and SoI r131 (commit was the literal string PENDING). The cause is structural: a record row is written IN
// the commit that carries it, so nobody can know the sha while writing it. The newest row is therefore the
// one most likely to be blank — and it is the one he opens first.
{
  const idOf = (p) => p.ledgerAdapter === "drs" ? "soi-2525"
    : p.ledgerAdapter === "sensor-fusion-ts" ? "sensorfusion-2525"
    : String(p.ledger || "").replace(/\.ledger\.json$/, "");
  const withCode = projects.filter((p) => typeof p.codeRecord === "string");
  ok(withCode.length >= 9, `the bar is checked against every project that HAS code (${withCode.length})`);
  const behind = [];
  for (const proj of withCode) {
    const id = idOf(proj);
    const rec = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/traceability", `${id}.code.json`), "utf8"));
    const last = rec.revisions[rec.revisions.length - 1];
    const payload = path.join(ROOT, "frontend/public/r-core/code", id, `${last.rev}.json`);
    const fresh = !!last && last.status === "recorded" && fs.existsSync(payload) && fs.statSync(payload).size > 200;
    ok(fresh, `${id}: its NEWEST revision r${last && last.rev} has code — status ${last && last.status}, payload ${fs.existsSync(payload) ? fs.statSync(payload).size + " B" : "MISSING"}`);
    if (!fresh) behind.push(`${id} r${last && last.rev}`);
  }
  ok(behind.length === 0, `every project's latest revision carries its code — his minimum bar${behind.length ? " — OWED: " + behind.join(", ") : ""}`);
}

// A commit the ledger could not carry is RECOVERED from the ledger's own history, never invented.
{
  const idOf2 = (p) => p.ledgerAdapter === "drs" ? "soi-2525"
    : p.ledgerAdapter === "sensor-fusion-ts" ? "sensorfusion-2525"
    : String(p.ledger || "").replace(/\.ledger\.json$/, "");
  let recovered = 0, rows = 0, empty = 0;
  for (const proj of projects.filter((p) => typeof p.codeRecord === "string")) {
    const rec = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/traceability", `${idOf2(proj)}.code.json`), "utf8"));
    for (const v of rec.revisions) {
      rows++;
      if (v.commitSource) { recovered++; ok(v.commitSource === "ledger-row", `a recovered commit says so (${v.commitSource})`); }
      if (v.status === "no-commit" || v.status === "unreachable") empty++;
    }
  }
  ok(empty === 0, `no revision is left without a commit — ${rows} rows, ${recovered} recovered from the ledger history, ${empty} still empty`);
  ok(/commitThatAddedRow/.test(fs.readFileSync(path.join(ROOT, "frontend/scripts/gen-rcore-code.mjs"), "utf8")),
    "the generator RECOVERS a missing commit rather than leaving the newest row blank — self-healing, so no one writes a sha they cannot yet know");
}

// ── THE PANEL SAYS WHICH BUILD IT IS (2026.10.17) ───────────────────────────────────────────────────────────
// He has now sent three screenshots of a panel that did not match the shipped code, and each time the first
// hour went on establishing WHICH BUILD he was looking at. A screenshot that cannot date itself costs that
// hour every time. The header now carries the served build's sha, so the next screenshot answers it on sight.
{
  ok(/import \{ GIT_SHA \} from "@\/lib\/2525-core\/version-stamp"/.test(panel),
    "the panel reads the build sha from the ONE shared stamp module, not a second source of truth");
  ok(/data-rcore-build/.test(panel) && /\{GIT_SHA\}/.test(panel),
    "the panel header prints the build sha — a screenshot of it dates itself");
  const hdr = panel.slice(panel.indexOf("data-rcore-header"), panel.indexOf("data-rcore-download"));
  ok(/data-rcore-build/.test(hdr), "the sha is in the HEADER, which is sticky and therefore always on screen");
}

// the derive script is itself on the record, as cut-stances.py is for the poses
ok(fs.existsSync(path.join(ROOT, "frontend/scripts/shrink-rcore-rasters.mjs")), "the derive script is in the repo, not a one-off command");
ok(!/shrink-rcore-rasters/.test(JSON.parse(fs.readFileSync(path.join(ROOT, "frontend/package.json"), "utf8")).scripts.prebuild),
  "the derive script is NEVER in prebuild — ImageMagick is not on Cloudflare's builder (the r.208 precedent)");
// Sized in CSS from constants, never baked into the raster and never a literal in the panel.
const rev = fs.readFileSync(path.join(ROOT, "frontend/lib/2525-core/revisions.ts"), "utf8");
ok(/export const CODE_CHIP_H = \d+;/.test(rev), "the resting chip's height is a shared constant");
// DD-73 — "smaller icon first and clicking opens larger code icon". Both halves asserted, because a single
// constant drifting would quietly undo the thing he had to say twice.
const chipH = +(/export const CODE_CHIP_H = (\d+);/.exec(rev) || [])[1];
const logoH = +(/export const RCORE_LOGO_H = (\d+);/.exec(rev) || [])[1];
ok(Number.isFinite(chipH) && Number.isFinite(logoH) && chipH < logoH,
  `the resting icon is SMALLER than the expanded wordmark (${chipH} < ${logoH})`);
ok(/export const CODE_WORD_H = RCORE_LOGO_H;/.test(rev),
  "the expanded wordmark is bound to RCORE_LOGO_H itself — the badge's own size, not a chosen number");

// ── THE THREE BEATS (DD-72) — "work it just like R-CORE (expands after pressed, then expands to code elements
// next)". The badge's grammar, one level down: icon → wordmark → the code elements.
ok(/const \[codeStage, setCodeStage\] = useState<0 \| 1>\(0\)/.test(panel), "the chip has a stage of its own, like the badge's");
ok(/codeStage === 0 \? CODE_ICON : CODE_WORDMARK/.test(panel), "beat 1 is his </> icon, beat 2 his </> Code wordmark");
ok(/if \(codeStage === 0\) \{ setCodeStage\(1\); return; \}/.test(panel) && /setDiffMode\("code"\);/.test(panel),
  "beat 2 expands, and only the NEXT press opens the code elements");
ok(/leaveCode\("unified"\)/.test(panel) && /leaveCode\("side"\)/.test(panel) && /setCodeStage\(0\)/.test(panel),
  "choosing a text mode collapses the chip, so the three beats always start from the same place");
ok(/flexWrap: "wrap"/.test(panel) && /flexShrink: 0/.test(panel),
  "the mode row wraps and the artwork never shrinks — his proportions are not squeezed at phone width");

// ── DD-81 · THE CHIP TAKES THE BADGE'S OWN PLACE ───────────────────────────────────────────────────────────
// Operator 2026-10-17, asked twice: "place code at bottom center of R-CORE JUST LIKE R-CORE IS AT BOTTOM center
// all screens". The badge's placement is already a written law with a gate behind it — rcore-badge.tsx:71 is
// `flex w-full justify-center`, a full-width centred row in NORMAL FLOW mounted LAST, pinned by
// rcore-revisions.test.mjs:120 under his 2026-09-25 words. These four legs hold the chip to that same law one
// level in. Red-first: each fails on the r.215 panel, where the chip is the third segment of the mode strip.
{
  ok(/<div\s+data-rcore-code-row[\s\S]{0,120}className="flex w-full justify-center"/.test(panel),
    "the chip stands in a FULL-WIDTH CENTRED ROW, in the badge's own class grammar (DD-81)");

  // it is OUT of the WHAT CHANGED mode strip — the strip holds only the two text modes
  const strip = /<span role="group"[\s\S]*?<\/span>/.exec(panel);
  ok(!!strip && !/cmpVC/.test(strip[0]) && /cmpVU/.test(strip[0]) && /cmpVS/.test(strip[0]),
    "the mode strip keeps Unified and Side-by-side ONLY — the chip is no longer a third segment beside two text labels");

  // it is the LAST thing in the panel body: after its row only the body / scroll / overlay closers remain
  const tail = panel.slice(panel.indexOf("data-rcore-code-row"));
  ok(/^data-rcore-code-row[\s\S]*?<\/button>\s*<\/div>\s*\)\}\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*\);\s*\}/.test(tail),
    "the chip is MOUNTED LAST in the panel body — nothing renders below it (the badge's own rule)");

  // the code pane stays ABOVE, inside WHAT CHANGED, so pressing the chip never moves the chip
  ok(panel.indexOf("<RCoreCodeView") > -1 && panel.indexOf("<RCoreCodeView") < panel.indexOf("data-rcore-code-row"),
    "the code elements open ABOVE the chip, so the chip does not move when it opens (as the badge does not move when its panel opens)");

  // STICKY, NOT MERELY LAST. Measured before this leg existed: last-in-flow put the chip 17,595 px down the
  // panel body at 375 px — below Financial's 166-row history, where he would never see it. His sentence is
  // about a chip he can SEE at the bottom, as the badge is seen at the bottom of a page. Sticky keeps it in
  // normal flow; `fixed` is the thing rcore-revisions.test.mjs:120 bans and must never appear here.
  {
    const row = /<div\s+data-rcore-code-row[\s\S]*?>/.exec(panel)[0];
    ok(/position: "sticky"/.test(row) && /bottom: 0/.test(row),
      "the bottom-centre row is STICKY to the bottom of the panel, so he sees it at every scroll position");
    ok(!/position: "fixed"/.test(row),
      "it is sticky and never FIXED — the badge's law (rcore-revisions.test.mjs:120) holds one level in");
    ok(/env\(safe-area-inset-bottom/.test(row),
      "the row clears the phone's home bar (the page contract's safe-area rule)");
  }
}

// ── THE CUBE READS AS A CUBE ────────────────────────────────────────────────────────────────────────────────
// He sent the render back because the 3x3x3 had stopped looking like a cube: with one piece of sixteen selected,
// an unselected mini-cube drew at 0x2e x 0.42 — about 7% on its top face and 3% on the far ones — so there was
// nothing left to read. That faint value is the SIM's own choice ("others more see-through") and is UNCHANGED
// there; the code view asks for its own. Asserted so it cannot quietly fall back to invisible.
const cube = fs.readFileSync(path.join(ROOT, "frontend/components/2525-core/cube-voxel-3d.tsx"), "utf8");
const view = fs.readFileSync(path.join(ROOT, "frontend/components/2525-core/rcore-code-view.tsx"), "utf8");
ok(/export const REST_SEE_THROUGH: \[string, string, string, number\] = \["2e", "1e", "14", 0\.42\];/.test(cube),
  "the SIM's see-through rest is unchanged and is still the default");
ok(/rest = REST_SEE_THROUGH/.test(cube), "a caller that passes nothing gets exactly what the SIM has always had");
ok(/rest=\{REST_SOLID_ENOUGH\}/.test(view), "the code view asks for a rest the eye can actually see");
{
  const m = /export const REST_SOLID_ENOUGH: \[string, string, string, number\] = \["([0-9a-f]{2})", "([0-9a-f]{2})", "([0-9a-f]{2})", ([\d.]+)\];/.exec(cube);
  ok(!!m, "REST_SOLID_ENOUGH is declared");
  if (m) {
    const top = parseInt(m[1], 16) / 255 * (+m[4]);
    ok(top > 0.25, `an unselected mini-cube's top face is visible on a dark ground (${(top * 100).toFixed(0)}% vs the SIM's 7%)`);
    ok(top < 0.75, `and still clearly below the selected block, so the selection reads (${(top * 100).toFixed(0)}%)`);
  }
}

console.log(`\nrcore-code-record: ${pass} passed, ${fail} failed · ${withCode.length} projects carry a per-revision code record`);
if (fail) process.exit(1);
