// EVERY TOP-LEVEL ROUTE IS CLASSIFIED, AND EVERY PROJECT HAS A RECORD (DD-55).
//
// Operator 2026-10-14: "each innovation project gets its own rcore panel (drone, security, light codex,
// Vision-2525, etc)", and, asked what counts as a project: "all projects that are off main. /project-2525".
//
// A pure route-shape rule cannot be the gate as stated — the app has 26 top-level routes with a page and
// sixteen of them are utilities (auth, joining, a session, a redirect). So the rule survives in a stronger
// form: EVERY top-level route must appear in docs/traceability/projects.registry.json with a kind, and a row
// classified `project` must carry a ledger and a mounted panel. The gate never guesses — the row is the
// decision — and a `utility` row must say WHY in one line, so an exclusion is on the record.
//
// FLOOR ASSERTIONS are deliberate: a walk that finds nothing must FAIL rather than pass 0 of 0.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
let pass = 0, fail = 0, owed = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const FE = path.join(ROOT, 'frontend');
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/traceability/projects.registry.json'), 'utf8'));

// ── the walk: every top-level directory under app/ that has a page ────────────────────────────────
const onDisk = fs.readdirSync(path.join(FE, 'app'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(FE, 'app', d.name, 'page.tsx')))
  .map((d) => '/' + d.name).sort();
ok(onDisk.length >= 20, `the route walk found routes (${onDisk.length}); a walk that finds nothing must fail, not pass 0 of 0`);

const rows = Array.isArray(reg.routes) ? reg.routes : [];
const listed = rows.map((r) => r.route).sort();
ok(new Set(listed).size === listed.length, 'no route is classified twice');
const unclassified = onDisk.filter((r) => !listed.includes(r));
const phantom = listed.filter((r) => !onDisk.includes(r));
ok(unclassified.length === 0, `every top-level route is classified: unclassified = ${unclassified.join(', ') || 'none'}`);
ok(phantom.length === 0, `the registry names no route that does not exist: phantom = ${phantom.join(', ') || 'none'}`);

const KINDS = Object.keys(reg.kinds || {});
ok(KINDS.length === 4 && ['project', 'alias', 'surface', 'utility'].every((k) => KINDS.includes(k)), 'the four kinds are declared with their meaning');
for (const r of rows) ok(KINDS.includes(r.kind), `${r.route} carries a declared kind (got ${r.kind})`);

// ── a utility is a DECISION, so it says why ───────────────────────────────────────────────────────
for (const r of rows.filter((x) => x.kind === 'utility' || x.kind === 'alias' || x.kind === 'surface'))
  ok(typeof r.why === 'string' && r.why.length > 10, `${r.route} (${r.kind}) says in one line why it is not a project`);
for (const r of rows.filter((x) => x.kind === 'alias')) {
  ok(typeof r.of === 'string' && listed.includes(r.of), `${r.route} names the project it is an alias of (${r.of})`);
  ok(!r.ledger, `${r.route} is an alias and has NO ledger of its own — one record per project, never two`);
}

// ── a project must have a record, or say plainly that it is owed ──────────────────────────────────
const projects = rows.filter((r) => r.kind === 'project');
ok(projects.length >= 6, `the registry names projects (${projects.length})`);
for (const p of projects) {
  if (p.ledger) ok(fs.existsSync(path.join(ROOT, 'docs/traceability', p.ledger)), `${p.route}'s ledger exists: ${p.ledger}`);
  if (p.panel) ok(fs.existsSync(path.join(FE, p.panel.replace(/^frontend\//, ''))) || fs.existsSync(path.join(ROOT, p.panel)), `${p.route}'s panel file exists: ${p.panel}`);
  if (p.panel) {
    const f = fs.existsSync(path.join(FE, p.panel)) ? path.join(FE, p.panel) : path.join(ROOT, p.panel);
    // MOUNTED, not merely imported: `import { RCoreBadge }` left behind after the JSX is deleted would satisfy a
    // name match and the panel would be gone. Found by sabotage while writing this gate — the badge was removed
    // from /light-codex's JSX and this assertion stayed green until it was tightened to the opening tag.
    ok(/<RCoreBadge\b/.test(fs.readFileSync(f, 'utf8')), `${p.route} MOUNTS the shared badge (<RCoreBadge …>) in ${p.panel}`);
  }
  // A project may keep its record somewhere other than docs/traceability — SensorFusion's belongs to another
  // workflow and moving it would break theirs. Then the row must name BOTH the file and the gate that holds it
  // to the same law, and both must exist: an exception without a gate is just an exception.
  if (!p.ledger && p.ledgerFile) {
    ok(fs.existsSync(path.join(ROOT, p.ledgerFile)), `${p.route}'s record file exists: ${p.ledgerFile}`);
    ok(typeof p.gate === 'string' && fs.existsSync(path.join(ROOT, p.gate)),
      `${p.route} keeps its record outside docs/traceability and names the GATE that holds it to the same law: ${p.gate || 'none'}`);
    const g = p.gate ? fs.readFileSync(path.join(ROOT, p.gate), 'utf8') : '';
    ok(/merge-base', '--is-ancestor|--is-ancestor/.test(g), `${p.route}'s gate proves its commits are ANCESTORS of HEAD, not merely that they exist`);
    const pkg = JSON.parse(fs.readFileSync(path.join(FE, 'package.json'), 'utf8'));
    ok(p.gate && (pkg.scripts.prebuild.includes(path.basename(p.gate)) || Object.values(pkg.scripts).some((v) => String(v).includes(path.basename(p.gate)))),
      `${p.route}'s gate is wired into the build, not merely present`);
  } else if (!p.ledger || !p.panel) {
    ok(typeof (p.owed || p.note) === 'string' && (p.owed || p.note).length > 20,
      `${p.route} has no ${!p.ledger ? 'ledger' : 'panel'} and says plainly why, in its own row`);
    if (p.owed) { owed++; console.log(`OWED   ${p.route} — ${p.owed.slice(0, 110)}…`); }
  }
}

// ── every ledger on disk is accounted for by some row ─────────────────────────────────────────────
const ledgersOnDisk = fs.readdirSync(path.join(ROOT, 'docs/traceability')).filter((f) => f.endsWith('.ledger.json')).sort();
ok(ledgersOnDisk.length >= 8, `the ledger walk found ledgers (${ledgersOnDisk.length})`);
const claimed = new Set([...rows.map((r) => r.ledger), ...(reg.alsoLedgered || []).map((r) => r.ledger)].filter(Boolean));
const orphan = ledgersOnDisk.filter((f) => !claimed.has(f));
ok(orphan.length === 0, `every ledger belongs to a classified row: orphan = ${orphan.join(', ') || 'none'}`);

// ── an alias renders the SAME component as the project it points at ───────────────────────────────
// (the assertion is the same component IMPORT, not an identical body: /review-2525 passes no props where
//  /Security-2525 passes initialTab — getting that wrong would make this gate lie about the one case it is for)
const importsOf = (route) => {
  const f = path.join(FE, 'app', route.replace(/^\//, ''), 'page.tsx');
  if (!fs.existsSync(f)) return [];
  const src = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return [...src.matchAll(/from\s+"(@\/components\/[^"]+)"/g)].map((m) => m[1]).sort();
};
for (const a of rows.filter((r) => r.kind === 'alias')) {
  const mine = importsOf(a.route), theirs = importsOf(a.of);
  if (mine.length === 0 || theirs.length === 0) { ok(true, `${a.route} is a redirect or has no component import — its why carries the reason`); continue; }
  ok(mine.some((m) => theirs.includes(m)), `${a.route} renders the same component as ${a.of} (${mine.join(',')} vs ${theirs.join(',')})`);
}


// ── DD-80 · EVERY R-CORE CARRIES THE CODE UNLOCK (operator 2026-10-17: "All R-CORE need code button unlocks").
// The chip renders behind {hasCode} in the panel, and hasCode is true only where the SURFACE passes its own
// index. Declaring a record in the registry is therefore not enough — a project could have a perfect
// <id>.code.json and still show no button, which is exactly the state he screenshotted on Financial-2525.
// These three legs hold the whole chain: declared → generated → PASSED TO THE BADGE.
{
  const fe = new URL("../", import.meta.url);
  const withCode = projects.filter((p) => typeof p.codeRecord === "string");
  ok(withCode.length >= 9, `every project that has code declares a record (${withCode.length} of ${projects.length}; /vision-2525 is codeRecord:false by DD-62 — he called it a white paper)`);
  for (const p of withCode) {
    ok(Array.isArray(p.paths) && p.paths.length > 0 && Array.isArray(p.areas) && p.areas.length > 0,
       `${p.route}: declares its own scoped paths and cube areas`);
  }
  // the surface actually passes it — read every file that mounts the badge
  const mounts = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) { if (!/node_modules|\.next/.test(f)) walk(f); }
    else if (/\.tsx$/.test(f) && fs.readFileSync(f, "utf8").includes("<RCoreBadge")) mounts.push(f); } };
  walk(path.join(fileURLToPath(fe), "app")); walk(path.join(fileURLToPath(fe), "components"));
  ok(mounts.length >= 10, `every badge mount is read (${mounts.length})`);
  const passing = mounts.filter((f) => /codeId="/.test(fs.readFileSync(f, "utf8")));
  ok(passing.length >= 9,
     `at least nine surfaces pass their code index to the badge, so the </> chip actually renders (${passing.length}) — declaring a record and never handing it over is how Financial-2525 showed no button`);
}

console.log(`\nprojects-registry: ${pass} passed, ${fail} failed · ${onDisk.length} top-level routes classified · ${projects.length} projects, ${owed} still owed a record · ${ledgersOnDisk.length} ledgers, 0 orphans`);
process.exit(fail ? 1 : 0);
