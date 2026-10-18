// R-CORE CODE RECORD (DD-53, DD-61..DD-68) — "so future versions of AI and HI can see exactly what happened".
//
// For every project the registry marks `codeRecord: "git-scoped"`, this writes docs/traceability/<id>.code.json:
// per ledger revision, per DECLARED AREA, what that revision changed there. Operator 2026-10-15: a piece of the
// cube is "a fixed map of the project's own areas", the deep dive shows "the change that revision made", and the
// Drone deck must "follow same SIM and visualization methods as all other projects" — so there is exactly ONE
// mechanism here and no special case for the deck.
//
// TWO TIERS, forced by measurement, not taste. Light Codex: index 938 B, full patch 84 KB. Drone-2525: index
// 18,997 B, full patch 33,122,965 B with a single revision at 1,768,506 B. So the INDEX ships (inlined, small
// enough for any project) and the PATCH TEXT does not — it is written per revision under
// frontend/public/r-core/code/<id>/ and fetched only when a reader opens Code mode.
//
// FIVE HONEST STATES, taken from the data and never inferred: recorded · no-code-change · no-commit ·
// unreachable · truncated (cap recorded and shown, never silent).
//
// ANCESTRY, NOT EXISTENCE. `git cat-file -e` passes for a commit on an abandoned branch; this uses
// `git merge-base --is-ancestor`, the pattern tests/sensor-fusion-ledger.test.mjs already proves with.
//
// IT REFUSES A SHALLOW CLONE, because otherwise the record silently shrinks depending on who built it — the
// worst outcome available to a feature whose whole purpose is letting a future reader see what happened.
//
// NEVER IN prebuild, AND `--check` IS NOT GIT-FREE. Said plainly because the first draft of this comment claimed
// it was, which would invite someone to move it into prebuild and hand Cloudflare a red build. `--check` skips
// only the WRITES: it still runs merge-base, show --numstat, rev-parse and show per ledger entry, and its result
// is HEAD-dependent (a head missing a cited commit reports drift). So both this and the gate live in test:ci,
// where deploy.yml checks out at fetch-depth 0, and the committed artefacts are what prebuild and the app read.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, "../..");
const TRACE = path.join(ROOT, "docs/traceability");
const PUBDIR = path.join(ROOT, "frontend/public/r-core/code");
const CHECK = process.argv.includes("--check");

// Per-area patch caps. NOT lib/version-diff.ts's DIFF_CAP — that is 3,000 TOKENS on a prose diff and a code
// patch blows straight through it. Code mode renders git's own pre-computed patch and never re-diffs client-side.
const CAP_BYTES = 120_000, CAP_LINES = 2_000;

const git = (cmd, big = false) =>
  execSync(`git -C ${ROOT} ${cmd}`, { encoding: "utf8", maxBuffer: big ? 1 << 29 : 1 << 24 });

// Ask GIT, not the filesystem. The first version tested for `.git/shallow`, which in a git WORKTREE can never
// exist because `.git` is a FILE there ("gitdir: …") — so the guard was inert in exactly the tree this was
// built in. That matters: the SensorFusion ledger already carries a correction about a commit wrongly recorded
// unreachable as an artefact of a shallow clone.
let shallow = true;
try { shallow = execSync(`git -C "${ROOT}" rev-parse --is-shallow-repository`, { encoding: "utf8" }).trim() !== "false"; } catch {}
if (shallow) {
  console.error("gen-rcore-code: REFUSE — shallow (or unreadable) clone, so the record would silently shrink. Run `git fetch --unshallow` first.");
  process.exit(1);
}

// ── RECOVERING A COMMIT THE LEDGER COULD NOT CARRY ──────────────────────────────────────────────────────────
// A record row is written IN the commit that carries it, so at the moment of writing nobody can know the sha.
// The deck solves this with a two-commit chain and a records commit that fills `shipped` afterwards; the nine
// React ledgers have no such step, so the NEWEST row of a project stays permanently blank — and that is the
// row the operator opens first. Measured 2026.10.17: 30 of 505 rows had no usable commit, and the newest row
// of SIX of the nine projects was one of them, which is why "the latest revision has its code" was failing.
//
// The commit is not lost, only unrecorded: it is the commit that INTRODUCED the row into its ledger file, and
// `git log -S` finds it. All 30 resolved this way, none stayed empty, and every one carried a real scoped
// delta.
//
// Deliberately SELF-HEALING rather than a one-off backfill: nobody is ever asked to write a sha they cannot
// yet know, and a row appended today gets its code on the next generate. The row records `commitSource` so
// the record never silently claims a sha the ledger itself did not carry.
function commitThatAddedRow(rev, ledgerFile) {
  const needle = ledgerFile.endsWith(".json") ? `"rev": ${rev}` : `rev: ${rev},`;
  for (const args of [
    `log --format=%H -1 -S'${needle}' -- '${ledgerFile}'`,
    `log --format=%H -1 -- '${ledgerFile}'`,          // last resort: whatever last touched the ledger
  ]) {
    try {
      const out = execSync(`git -C ${ROOT} ${args}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      if (out) return out;
    } catch { /* try the next */ }
  }
  return "";
}

const isAncestor = (sha) => {
  try { execSync(`git -C ${ROOT} merge-base --is-ancestor ${sha} HEAD`, { stdio: "ignore" }); return true; }
  catch { return false; }
};

// THE LEGO RULE, not index slabs. Operator 2026-10-15: "27 is max; of code is two sections; split visual of
// 3x3x3 in 2 pieces" · "use adjacent mini cubes grouped like lego; method exists already in SIM behind easter
// egg". The first cut split by contiguous INDEX, which sections.py warns against at `segment_cells`
// ("index-contiguous is NOT face-connected in 3D"); the second wrote a PORT of it, which was a forked copy of
// lib/sim-sections.ts — the file whose own header says it is "the ONE frontend source ... no forked copy, no
// drift". This calls that file. Its parity with the Python is already locked by tests/sim-partition-parity.
import { orderedPartition } from "../lib/sim-sections.ts";
const cellsForAreas = (n, seed) => orderedPartition(seed, n);

// Which area owns a hunk: a file path prefix wins first (it is the stronger claim), otherwise the area whose
// declared identifiers appear most often in the hunk's own text. No match → null, and the caller files it under
// the project's catch-all so nothing is quietly dropped.
function areaOfHunk(areas, file, text) {
  for (let i = 0; i < areas.length; i++)
    for (const p of areas[i].paths || []) if (file === p || file.startsWith(p)) return i;
  let best = -1, bestScore = 0;
  for (let i = 0; i < areas.length; i++) {
    let score = 0;
    for (const id of areas[i].ids || []) { let k = 0, at = 0; while ((at = text.indexOf(id, at)) !== -1) { k++; at += id.length; } score += k; }
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best >= 0 ? best : null;
}

// Split `git show` output into per-file, per-hunk pieces.
// THE EMBEDDED RECORD IS DATA, NOT CODE — and this is the THIRD time that has had to be said. r.210 put the
// ledger inside play.html; drone-playable.test.mjs learned to strip it before its code assertions, the r.211
// patcher learned the same after refusing on a URL quoted in a historical entry's PROSE, and here it was landing
// a 217,469-byte single line into the "fire" area because an entry's text contains the word fireN. Stripped
// before an area is chosen and before a byte is counted.
const stripData = (t) => t.replace(/\/\*RCORE_LEDGER_BEGIN\*\/[\s\S]*?\/\*RCORE_LEDGER_END\*\//g, "/*RCORE_LEDGER - stripped: data, not code*/");

function splitHunks(patch) {
  const out = [];
  let file = null, buf = null;
  for (const line of patch.split("\n")) {
    const m = /^diff --git a\/(.+?) b\/(.+)$/.exec(line);
    if (m) { if (buf) out.push(buf); file = m[2]; buf = null; continue; }
    if (line.startsWith("@@")) { if (buf) out.push(buf); buf = { file, text: line + "\n" }; continue; }
    if (buf) buf.text += line + "\n";
  }
  if (buf) out.push(buf);
  return out;
}

const registry = JSON.parse(fs.readFileSync(path.join(TRACE, "projects.registry.json"), "utf8"));
const projects = registry.routes.filter((r) => r.kind === "project" && typeof r.codeRecord === "string");
if (projects.length < 9) throw new Error(`REFUSE: only ${projects.length} projects declare a code record — he asked for all of them`);
const written = [];
let drift = 0;

for (const proj of projects) {
  // TWO PROJECTS KEEP THEIR RECORD IN ANOTHER SHAPE, and both already have a proven reader elsewhere — so this
  // reuses them rather than inventing a third parse (operator 2026-10-17: "All R-CORE need code button unlocks";
  // without these two, nine projects would be eight). SoI's revisions live in the DRS living document, owned by
  // another workflow, and are read exactly as gen-rcore-revisions.mjs:55-62 reads them. SensorFusion's ledger is
  // hand-written TypeScript outside docs/traceability, and is read with the SAME regex its gate has been using
  // against 77 rows since it was written (tests/sensor-fusion-ledger.test.mjs:28).
  const adapter = proj.ledgerAdapter || null;
  const id = adapter === "drs" ? "soi-2525"
    : adapter === "sensor-fusion-ts" ? "sensorfusion-2525"
    : proj.ledger.replace(/\.ledger\.json$/, "");
  const areas = proj.areas || [];
  const cells = cellsForAreas(areas.length, id);   // seeded by the project id, so each project has its own shape
  // The FILE the rows live in — needed to recover a row's commit when the row itself does not carry one.
  const ledgerFile = adapter === "drs" ? "docs/drs/drs.v00.00.json"
    : adapter === "sensor-fusion-ts" ? "frontend/app/SensorFusion-2525/ledger.ts"
    : `docs/traceability/${proj.ledger}`;
  let ledger;
  if (adapter === "drs") {
    const drs = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/drs/drs.v00.00.json"), "utf8"));
    ledger = { section: proj.route.replace(/^\//, ""), route: proj.route,
      entries: (Array.isArray(drs.revisions) ? drs.revisions : []).map((r, i) => ({
        rev: i + 1, date: String(r.date ?? ""), kind: String(r.kind ?? "release"),
        text: `Revision ${String(r.revision ?? "")}. ${String(r.why ?? "")}`.trim(), commit: String(r.commit ?? "") })) };
  } else if (adapter === "sensor-fusion-ts") {
    const src = fs.readFileSync(path.join(ROOT, "frontend/app/SensorFusion-2525/ledger.ts"), "utf8");
    ledger = { section: "SensorFusion-2525", route: proj.route,
      entries: [...src.matchAll(/rev:\s*(\d+),\s*date:\s*"([^"]*)",\s*kind:\s*"([^"]*)",\s*text:\s*([\s\S]*?),\s*commit:\s*"([^"]*)",\s*\}/g)]
        .map((m) => ({ rev: +m[1], date: m[2], kind: m[3], text: m[4].replace(/^["`]|["`]$/g, ""), commit: m[5] })) };
  } else {
    ledger = JSON.parse(fs.readFileSync(path.join(TRACE, proj.ledger), "utf8"));
  }
  if (!ledger.entries || !ledger.entries.length) throw new Error(`REFUSE: ${proj.route} produced an EMPTY ledger — a record of nothing is worse than none`);
  // Excluded paths are DUPLICATES or generated output — counting them would measure one change twice.
  const ex = proj.excludePaths || [];
  const scope = (proj.paths || []).map((p) => `'${p}'`).join(" ");
  const dropped = (f) => ex.some((e) => f.startsWith(e));
  const revisions = [];
  const blobs = {};

  for (const e of ledger.entries) {
    let sha = String(e.commit || "").trim();
    let commitSource = "ledger";
    if (/^pending$/i.test(sha)) sha = "";   // a placeholder the record sometimes carries, not a sha
    if (!sha || !isAncestor(sha)) {
      const found = commitThatAddedRow(e.rev, ledgerFile);
      if (found && isAncestor(found)) { sha = found; commitSource = "ledger-row"; }
    }
    if (!sha) { revisions.push({ rev: e.rev, status: "no-commit", areas: [] }); continue; }
    if (!isAncestor(sha)) { revisions.push({ rev: e.rev, commit: sha, status: "unreachable", areas: [] }); continue; }

    const numstat = git(`show --numstat --format= ${sha} -- ${scope}`, true).trim();
    if (!numstat) { revisions.push({ rev: e.rev, commit: sha, ...(commitSource === "ledger" ? {} : { commitSource }), status: "no-code-change", areas: [] }); continue; }

    const files0 = numstat.split("\n").filter(Boolean).map((l) => {
      const [add, del, ...rest] = l.split("\t");
      // git writes a RENAME as `dir/{old.tsx => new.tsx}` or `{a => b}/f.tsx` in --numstat. Resolve it to the
      // path as it stands AFTER the commit, which is the one `rev-parse <sha>:<path>` can actually read.
      let p = rest.join("\t");
      p = p.replace(/\{([^{}]*) => ([^{}]*)\}/g, "$2").replace(/\/\//g, "/");
      return { path: p, add: add === "-" ? null : +add, del: del === "-" ? null : +del };
    });
    const files = files0.filter((f) => !dropped(f.path));
    if (!files.length) { revisions.push({ rev: e.rev, commit: sha, status: "no-code-change", areas: [] }); continue; }
    for (const f of files) {
      // A file DELETED by this commit has no blob at this sha; that is a fact about the change, not an error,
      // so the failure is swallowed quietly (stdio piped) and `blob` stays null.
      // QUOTED. An unquoted path is handed to /bin/sh, and git's own rename notation contains `=>` — the `>`
      // acted as a REDIRECT and created a junk file named `round.tsx}` in the repo root on the first run here.
      // The rename is parsed out above; the quoting is the belt to that braces.
      try { blobs[`${sha}:${f.path}`] = execSync(`git -C ${ROOT} rev-parse '${sha}:${f.path}'`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
      catch { /* deleted in this commit */ }
    }

    const patch = git(`show --format= --unified=3 ${sha} -- ${scope}`, true);
    // PER-AREA counts come from the HUNKS, not from the file's --numstat row. Counting the file total once per
    // area made every piece of a single-file project report the same number: on drone rev 23, seven pieces all
    // read +193/-65, which is play.html's total repeated. His deep dive is the change that revision made TO THAT
    // PIECE, so the piece's own added/removed lines are what it must say.
    const buckets = areas.map(() => ({ files: new Set(), text: "", add: 0, del: 0 }));
    const spill = { files: new Set(), text: "", add: 0, del: 0 };
    const countHunk = (b, text) => {
      for (const ln of text.split("\n")) {
        if (ln.startsWith("+++") || ln.startsWith("---")) continue;
        if (ln[0] === "+") b.add++; else if (ln[0] === "-") b.del++;
      }
    };
    for (const h of splitHunks(patch)) {
      if (dropped(h.file)) continue;
      const text = stripData(h.text);
      const i = areaOfHunk(areas, h.file, text);
      const b = i === null ? spill : buckets[i];
      b.files.add(h.file); b.text += `# ${h.file}\n${text}`; countHunk(b, text);
    }

    const outAreas = [];
    buckets.forEach((b, i) => {
      if (!b.text) return;
      const lines = b.text.split("\n").length;
      // Truncated means text was ACTUALLY cut. The payload slices on bytes only (below), so a line-count alone
      // must not label an area capped while its full text is carried.
      const over = b.text.length > CAP_BYTES;
      outAreas.push({
        key: areas[i].key, name: areas[i].name, cells: cells[i],
        files: [...b.files].map((p) => ({ path: p, blob: blobs[`${sha}:${p}`] || null })),
        add: b.add, del: b.del,
        bytes: b.text.length, lines, status: over ? "truncated" : "recorded",
      });
    });
    if (spill.text) outAreas.push({
      key: "_other", name: "Elsewhere in the project", cells: [],
      files: [...spill.files].map((p) => ({ path: p, blob: blobs[`${sha}:${p}`] || null })),
      add: spill.add, del: spill.del,
      bytes: spill.text.length, lines: spill.text.split("\n").length, status: "recorded",
    });

    revisions.push({ rev: e.rev, commit: sha, ...(commitSource === "ledger" ? {} : { commitSource }),
      status: outAreas.length ? "recorded" : "no-code-change", areas: outAreas });

    if (!CHECK) {
      const dir = path.join(PUBDIR, id); fs.mkdirSync(dir, { recursive: true });
      const payload = { rev: e.rev, commit: sha, cap: { bytes: CAP_BYTES, lines: CAP_LINES }, areas: {} };
      buckets.forEach((b, i) => { if (b.text) payload.areas[areas[i].key] = b.text.length > CAP_BYTES ? b.text.slice(0, CAP_BYTES) : b.text; });
      if (spill.text) payload.areas._other = spill.text.slice(0, CAP_BYTES);
      fs.writeFileSync(path.join(dir, `${e.rev}.json`), JSON.stringify(payload));
    }
  }

  const body = JSON.stringify({
    section: ledger.section, route: proj.route, model: proj.codeRecord,
    cap: { bytes: CAP_BYTES, lines: CAP_LINES },
    areas: areas.map((a, i) => ({ key: a.key, name: a.name, cells: cells[i] })),
    revisions,
  }, null, 1) + "\n";

  // THE CLIENT PROJECTION. The full record (above) carries per-file paths and blob shas so the gate can prove it
  // against git; the bundle does not need those. The panel needs only which areas a revision touched, how big the
  // change was there, and the cells to light. Measured: the drone record is 144,278 B, its projection a fraction
  // of that. The patch TEXT is never inlined — it is fetched from /r-core/code/<id>/<rev>.json on demand.
  const gen = {
    section: ledger.section, route: proj.route,
    areas: areas.map((a, i) => ({ k: a.key, n: a.name, c: cells[i] })),
    revs: revisions.map((r) => ({
      r: r.rev, s: r.status,
      a: (r.areas || []).map((a) => ({ k: a.key, n: a.name, c: a.cells, f: a.files.length,
        add: a.add, del: a.del, b: a.bytes, s: a.status })),
    })),
  };
  const constName = id.toUpperCase().replace(/[^A-Z0-9]+/g, "_") + "_CODE";
  const genBody = `// GENERATED by frontend/scripts/gen-rcore-code.mjs — do not edit by hand.\n`
    + `// The per-revision code record for ${ledger.section}: which declared AREA each revision changed, and how much.\n`
    + `// The patch text itself is fetched from /r-core/code/${id}/<rev>.json when a reader opens Code mode.\n`
    + `export const ${constName} = ${JSON.stringify(gen)} as const;\n`;
  const genAbs = path.join(ROOT, "frontend/lib/2525-core", `${id}-code.gen.ts`);
  const genCur = fs.existsSync(genAbs) ? fs.readFileSync(genAbs, "utf8") : null;
  if (CHECK) { if (genCur !== genBody) { console.error(`gen-rcore-code --check: ${id}-code.gen.ts is stale`); drift++; } }
  else if (genCur !== genBody) { fs.writeFileSync(genAbs, genBody); written.push(`${id}-code.gen.ts (${genBody.length} B)`); }

  const abs = path.join(TRACE, `${id}.code.json`);
  const cur = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
  if (CHECK) { if (cur !== body) { console.error(`gen-rcore-code --check: ${id}.code.json is stale (re-run \`node frontend/scripts/gen-rcore-code.mjs\`)`); drift++; } }
  else if (cur !== body) { fs.writeFileSync(abs, body); written.push(`${id}.code.json (${body.length} B)`); }
  else written.push(`${id}.code.json unchanged`);
}

if (CHECK && drift) process.exit(1);
console.log(CHECK ? `gen-rcore-code --check OK · ${projects.length} project code records match their ledgers`
                  : `gen-rcore-code: ${written.join(" · ")}`);
