// financial-crs — Financial-2525's CRS ladder, revision record and traceability (operator 2026-09-30, v.000_r.001).
// The Drone-2525 gate, mirrored: the one editable source (docs/financial-2525/financial-2525.v.000.json) is well-formed,
// its 13 parents sit one per Vision • 2525 section, its rendered views are fresh (--check), every row is in the CRS matrix
// with changeDesc = the source status, the handoff exists and hashes, the review record is named, the cap is the pod's.
// Run: node tests/financial-crs.test.mjs
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(process.cwd(), "..");
const SRC = path.join(ROOT, "docs/financial-2525/financial-2525.v.000.json");
const d = JSON.parse(fs.readFileSync(SRC, "utf8"));
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// ── 1 · version · revision · stamp (the operator's v.000_r.001 form) ──────────────────────────────────────────
ok(d.project.version === "000", `version is 000 (got ${d.project.version})`);
ok(/^\d\.\d{3}$/.test(d.project.revision), `revision is X.YYY (got ${d.project.revision})`);
ok(d.project.stamp === `v.${d.project.version}_r.${d.project.revision.slice(2)}`, `stamp is v.000_r.NNN (got ${d.project.stamp})`);
ok(d.revisions[d.revisions.length - 1].revision === d.project.revision, "project.revision is the last revisions[] entry");
ok(d.revisions[0].revision === "0.001" && d.revisions[0].kind === "ask" && /^[0-9a-f]{7,40}$/.test(d.revisions[0].commit), "Financial-2525 starts at revision 0.001 with the persisted ask's real commit (operator addendum 6)");

// ── 2 · the id law ──────────────────────────────────────────────────────────────────────────────────────────
const ids = d.crs.map((r) => r.id);
ok(new Set(ids).size === ids.length, "CRS ids are unique");
ok(ids.every((id) => /^FIN-\d{2}(\.\d{2})?$/.test(id)), "every id is FIN-##[.##] — two digits, never letters");
ok(ids.filter((id) => id.includes(".")).every((id) => ids.includes(id.split(".")[0])), "every sub-id has its parent");

// ── 3 · every row is whole ──────────────────────────────────────────────────────────────────────────────────
const SECTIONS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII"];
const STATUSES = ["draft", "approved", "implemented", "verified", "superseded", "out-of-scope"];
for (const r of d.crs) {
  ok(typeof r.statement === "string" && r.statement.length > 40, `${r.id}: a statement a reader can pass or fail`);
  ok(SECTIONS.includes(r.section), `${r.id}: cites a Vision section I..XIII`);
  ok(STATUSES.includes(r.status), `${r.id}: status is one of the six`);
  ok((r.uwf ?? []).every((u) => /^U-WF-\d{2}$/.test(u)), `${r.id}: U-WF trace ids are well-formed`);
  ok(r.phase && r.mode && r.metric && r.verify && r.dtm && r.stretch, `${r.id}: phase, mode, metric, verify, dtm, stretch present`);
  ok(r.in === `${r.id}.IN` && r.out === `${r.id}.OUT`, `${r.id}: in/out ids follow the id`);
  ok(fs.existsSync(path.join(process.cwd(), r.verify)), `${r.id}: its verification gate exists (${r.verify})`);
}

// ── 4 · thirteen parents, one per Vision section, in build order ──────────────────────────────────────────────
const parents = d.crs.filter((r) => !r.id.includes("."));
ok(parents.length === 13, `exactly 13 parent rows (got ${parents.length})`);
ok(new Set(parents.map((r) => r.section)).size === 13, "the 13 parents sit on 13 distinct Vision sections");
ok(parents.map((r) => r.id).join() === Array.from({ length: 13 }, (_, i) => `FIN-${String(i + 1).padStart(2, "0")}`).join(), "parents are FIN-01 … FIN-13 in order");

// ── 5 · revisions append only; a release cites a commit ───────────────────────────────────────────────────────
let last = 0;
for (const r of d.revisions) {
  const n = Math.round(Number(r.revision) * 1000);
  ok(n > last, `revision ${r.revision} strictly follows ${last / 1000}`);
  last = n;
  ok(["ask", "decision", "release", "correction"].includes(r.kind), `revision ${r.revision}: kind is ask|decision|release|correction`);
  if (r.kind === "release") ok(/^[0-9a-f]{7,40}$/.test(r.commit), `release ${r.revision} cites a real commit`);
}

// ── 6 · the handoff exists and hashes; the laws are the operator's numbers ────────────────────────────────────
const handoff = path.join(ROOT, d.project.handoff);
ok(fs.existsSync(handoff), `handoff exists: ${d.project.handoff}`);
ok(createHash("sha256").update(fs.readFileSync(handoff)).digest("hex") === d.project.handoffSha256, "handoffSha256 matches the ask file byte for byte (PERSIST FIRST)");
ok(d.accrual.holdHours === 3 && d.calendar.quarterDays === 91 && d.calendar.gridDays === 364 && d.calendar.downDay === 365 && d.mot.full === "3600.3600..3600", "the laws carry the operator's numbers: hold 3 h · 91 · 364 · 365 · FULL 3600.3600..3600");
ok(d.calendar.personalFrames.join() === "33,66,99" && d.mot.ltu.M === 33 && d.mot.ltu.Q === 99, "personal frames 33/66/99; M 33 · Q 99");
ok(d.tokenization.yugCeiling === 9999 && /YUG_CEILING/.test(fs.readFileSync(path.join(process.cwd(), "lib/pod-yug.ts"), "utf8")), "the 9,999 웃 cap is the pod's YUG_CEILING, reused (operator addendum 4)");
ok(d.business.status.startsWith("TEST LATER") && d.project.tenant.startsWith("personal"), "personal first; business declared, tested after feedback (operator addendum 5)");
ok(Array.isArray(d.decisions) && d.decisions.length >= 9 && d.decisions.every((x) => /^FD-\d{2}$/.test(x.id) && x.basis), "≥ 9 decisions on the record, each with a basis");
ok(Array.isArray(d.reviews) && d.reviews.length >= 1 && d.reviews[0].lenses === 12 && d.reviews[0].record, "the twelve-lens review round is named on the record (FIN-09)");
// FIN-09, the second half: the round is ON DISK, whole, and hashes to the ledger — the gap the lenses themselves named.
const rec = path.join(ROOT, d.reviews[0].record);
const recBody = fs.existsSync(rec) ? fs.readFileSync(rec, "utf8") : "";
ok(!/^PENDING/.test(d.reviews[0].status) && fs.existsSync(rec), `round 1 is persisted on disk: ${d.reviews[0].record}`);
ok((recBody.match(/^### /gm) || []).length === 12 && /^## The synthesis$/m.test(recBody) && /the stop rule/.test(recBody), "the round-1 record carries 12 lens sections, the synthesis and the stop rule");
ok(/^[0-9a-f]{64}$/.test(d.reviews[0].sha256 ?? "") && recBody && createHash("sha256").update(fs.readFileSync(rec)).digest("hex") === d.reviews[0].sha256, "the round-1 record hashes to reviews[0].sha256 (the hash the operator can check)");
ok(fs.existsSync(rec + ".sha256") && fs.readFileSync(rec + ".sha256", "utf8").startsWith(d.reviews[0].sha256), "the record's .sha256 sidecar carries the same hash");
ok(/^[0-9a-f]{7,40}$/.test(d.reviews[0].commit ?? ""), "the record names the commit that persisted it alone");
ok(d.decisions.some((x) => x.id === "FD-14" && /stop rule/.test(x.decision) && /all seven/.test(x.decision) && /business/.test(x.decision)), "FD-14 adopts the stop rule the twelve stated (seven conditions; business waits)");
ok(!/\b(Opus|Fable|Sonnet|Haiku|Grok|Gemini|GPT)\b/.test(recBody), "no model identifier in the persisted record");

// ── 6b · r.005 (addenda 11–13): the 365-day whole, Mars on its own revolution, the LTU table in the Admin panel ──────
ok(d.mot.revolution.financialYearDays === 365.259636 && d.mot.revolution.halfYearInA === 1800 && d.mot.revolution.fullInA === 3600 && d.mot.orbitUnitsEarth.aSeconds === 8766.231264 && d.mot.payMotInA === 298.97 && d.example.motInA === 298.97, "r.007 (addendum 18): the exact revolution 365.259636 d = 3600 A on the record: one A = 8,766.23 s; the pay MoT 298.97 A");
ok(d.mot.orbitUnitsEarth365 && d.mot.orbitUnitsEarth365.aSeconds === 8760 && /r\.005/.test(d.mot.orbitUnitsEarth365.note) && /299\.0641/.test(d.mot.payMotNote), "r.005's exact-365 units and its pay MoT stay on the record (never edited away)");
ok(d.mot.anchor && d.mot.anchor.default === "perihelion" && /CST STANDARD/.test(d.mot.anchor.cst) && /2026\.01\.03_11\.15\.\.00/.test(d.mot.anchor.cst) && /never daylight/.test(d.mot.anchor.cst), "the perihelion is the default anchor and its instant is written in Austin CST standard on the record");
ok(/298\.97/.test(d.mot.payMotNote) && d.mot.orbitUnitsEarthMean && d.mot.orbitUnitsEarthMean.aSeconds === 8766.2, "r.003's reading stays on the record (never edited away)");
ok(d.mot.tierD && d.mot.tierD.notation === "A.BBBB..CCCC...DDDD" && /DECLARED/.test(d.mot.tierD.status), "the fourth tier D is declared, not on the glass");
ok(d.mot.revolution.marsEarthDays === 686.98 && /Earth hours/.test(d.mot.revolution.marsLtu), "Mars: its own revolution in Earth days, Earth hours as LTU for now");
ok(d.mot.planetLtuTable && d.mot.planetLtuTable.rows.join() === "earth,mars" && /Admin panel/.test(d.mot.planetLtuTable.where) && d.mot.ltu.analysisMonth === 91, "the per-planet LTU table is master data in the Admin panel; Month 91 for now");
for (const [old, next] of [["FIN-01.01", "FIN-01.02"], ["FIN-02", "FIN-02.01"], ["FIN-13", "FIN-13.01"], ["FIN-01.02", "FIN-01.03"], ["FIN-02.01", "FIN-02.02"], ["FIN-06.01", "FIN-06.03"], ["FIN-06.03", "FIN-06.04"]]) {
  const o = d.crs.find((x) => x.id === old), n = d.crs.find((x) => x.id === next);
  ok(o && o.status === "superseded" && new RegExp(next.replace(/\./g, "\\.")).test(o.metric), `${old} is superseded and names its successor`);
  ok(n && (n.status === "implemented" || (n.status === "superseded" && /SUPERSEDED by FIN-/.test(n.metric))) && n.section === o.section, `${next} is implemented in the parent's Vision section (or itself superseded by a named successor)`);
}
ok(d.crs.find((x) => x.id === "FIN-13.02")?.verify === "tests/planet-ltu.test.mjs", "FIN-13.02 (the LTU table) is gated by planet-ltu");
ok(d.crs.find((x) => x.id === "FIN-06.02")?.status === "implemented" && d.crs.find((x) => x.id === "FIN-06.04")?.status === "implemented" && d.crs.find((x) => x.id === "FIN-13.03")?.status === "implemented", "r.008–r.010: FIN-06.02 (every category carries its icon) is additive; FIN-06.04 (the full-width unit dropdown) implemented; FIN-13.03 (a planet's positions on its own revolution) implemented");
for (const id of ["FD-15", "FD-16", "FD-17", "FD-18", "FD-21", "FD-22", "FD-23", "FD-24"]) ok(d.decisions.some((x) => x.id === id && x.basis.length > 10), `${id} is on the record with a basis`);
ok(d.reviews[1] && d.reviews[1].round === 2 && d.reviews[1].revision === "0.007" && /^PENDING/.test(d.reviews[1].status), "round 2 of the twelve lenses is named on r.007 (PENDING until it returns)");

// ── 7 · rendered views fresh (--check) ────────────────────────────────────────────────────────────────────────
try { execFileSync("node", [path.join(ROOT, "scripts/financial-render.mjs"), "--check"], { stdio: "pipe" }); pass++; }
catch (e) { fail++; console.log("FAIL: financial-render --check reports drift:\n" + String(e.stdout || e.stderr || e)); }

// ── 8 · every row is in the CRS matrix with changeDesc = the source status ─────────────────────────────────────
const matrix = fs.readFileSync(path.join(process.cwd(), "lib/crs-matrix-data.ts"), "utf8");
ok(matrix.includes('"reviewId": "FIN-2026.09.30-r0.001"'), "the matrix carries the FIN review id");
for (const r of d.crs) {
  const m = new RegExp(`"crs": "${r.id}",[\\s\\S]{0,3200}?"changeDesc": "([^"]*)"`).exec(matrix);   // lazy: the row's own changeDesc comes first; r.007 rows run past 1,600 chars
  ok(m && m[1] === r.status, `${r.id}: in the matrix with changeDesc = ${r.status}${m ? ` (got ${m[1]})` : " (missing)"}`);
}

// ── 9 · the app imports the generated module, never docs/ ──────────────────────────────────────────────────────
const ux = fs.readFileSync(path.join(process.cwd(), "components/financial-2525/command-ux1.tsx"), "utf8");
ok(/financial-2525\/domain\.gen/.test(ux) && !/docs\/financial-2525/.test(ux), "the surface reads domain.gen, not docs/");
ok(fs.readFileSync(path.join(process.cwd(), "lib/2525-core/financial-ledger.gen.ts"), "utf8").includes("FINANCIAL_LEDGER"), "the R-CORE ledger module exists (gen-rcore-revisions)");
const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/traceability/financial-2525.ledger.json"), "utf8"));
ok(ledger.section === "Financial-2525" && ledger.route === d.project.route && ledger.entries.length >= 2 && ledger.entries[0].kind === "ask", "the traceability ledger opens with the ask and carries the route");

console.log(`\nfinancial-crs: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
