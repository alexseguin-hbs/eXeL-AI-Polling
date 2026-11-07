// ARCHITECT-2525 · WALK MEP CALL-SITE gate (Revision A · Wave 0 · P0·E, MoT ruling 2026-11-07). The current-room-only MEP
// law ("MEP draws for THIS ROOM ONLY", rewalk2 P0) lived ONLY in the component with NO gate: a future pass that called
// addMep/walkMep for a neighbour cell — exactly what the neighbour SHELL pass (nbShell) does for shell glyphs — would bleed a
// wet room's service through a wall with every behaviour gate still green (walkMep is pure, so architect-walk-mep-rooms can
// prove WHAT a room draws, never WHO asked for it). Source-scan gate, like architect-immersion. INVARIANTS: exactly ONE
// addMep( call site in the whole walkthrough, inside forAll, at origin 0,0 (THIS room's frame) keyed off THIS room's own
// identity; walkMep is reached ONLY through addMep; the neighbour-shell pass never calls either; the law's comment survives
// where the code is. Robust to whitespace (brace-matched bodies; comments masked; strings skipped).
// Run: node tests/architect-walk-mep-callsite.test.mjs
import fs from "node:fs";
import path from "node:path";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const FILE = "../components/architect-2525/architect-walkthrough.tsx";
const src = fs.readFileSync(path.resolve(HERE, FILE), "utf8");

// ── helpers ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Mask // and /* */ comments with spaces — LENGTH-PRESERVING, so every index + line number below is true of the real file —
// while leaving string/template literals intact (a "// not a comment" inside a string stays).
function maskComments(t) {
  let out = "", i = 0; const n = t.length;
  while (i < n) {
    const c = t[i], d = t[i + 1];
    if (c === "/" && d === "/") { while (i < n && t[i] !== "\n") { out += " "; i++; } continue; }
    if (c === "/" && d === "*") { const e = t.indexOf("*/", i + 2); const end = e < 0 ? n : e + 2; out += t.slice(i, end).replace(/[^\n]/g, " "); i = end; continue; }
    if (c === '"' || c === "'" || c === "`") { const q = c; out += c; i++; while (i < n && t[i] !== q) { if (t[i] === "\\") { out += t[i] + (t[i + 1] ?? ""); i += 2; continue; } out += t[i]; i++; } out += t[i] ?? ""; i++; continue; }
    out += c; i++;
  }
  return out;
}
const code = maskComments(src);
const lineOf = (idx) => src.slice(0, idx).split("\n").length;
// The brace-matched body that opens at index `open` (a "{"), skipping string literals so a "}" in a string can't close it.
function bodyAt(t, open) {
  let depth = 0;
  for (let i = open; i < t.length; i++) {
    const c = t[i];
    if (c === '"' || c === "'" || c === "`") { const q = c; i++; while (i < t.length && t[i] !== q) { if (t[i] === "\\") i++; i++; } continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return { start: open + 1, end: i, body: t.slice(open + 1, i) }; }
  }
  return null;
}
// `const <name> = (<params>) => {` → its body + absolute offsets (whitespace-tolerant; params may carry defaults/types).
function arrowFn(name) {
  const m = new RegExp(`const\\s+${name}\\s*=\\s*\\(([^()]*(?:\\([^()]*\\)[^()]*)*)\\)\\s*(?::[^=]*)?=>\\s*\\{`).exec(code);
  if (!m) return null;
  const open = m.index + m[0].length - 1;
  const b = bodyAt(code, open);
  return b ? { def: m.index, params: m[1], ...b } : null;
}
// Call sites of `name(` in a region (definitions read `name = (` and never match). Returns absolute indices of the "(".
function calls(name, from = 0, to = code.length) {
  const out = []; const re = new RegExp(`\\b${name}\\s*\\(`, "g"); re.lastIndex = from; let m;
  while ((m = re.exec(code)) && m.index < to) out.push(m.index + m[0].length - 1);
  return out;
}
// The arguments of the call whose "(" is at `open`, split at depth-0 commas, whitespace-trimmed.
function argsAt(open) {
  const args = []; let depth = 0, cur = "";
  for (let i = open + 1; i < code.length; i++) {
    const c = code[i];
    if (c === '"' || c === "'" || c === "`") { const q = c; cur += c; i++; while (i < code.length && code[i] !== q) { cur += code[i]; i++; } cur += code[i]; continue; }
    if (c === "(" || c === "[" || c === "{") depth++;
    if (c === ")" || c === "]" || c === "}") { if (depth === 0) { args.push(cur.trim()); return args; } depth--; }
    if (c === "," && depth === 0) { args.push(cur.trim()); cur = ""; continue; }
    cur += c;
  }
  return args;
}
const inside = (idx, fn) => !!fn && idx > fn.start && idx < fn.end;

// ── 1 · the THREE functions exist: addMep (the ONE bridge to walkMep), forAll (the ONE caller), nbShell (the neighbour pass) ──
const addMep = arrowFn("addMep"), forAll = arrowFn("forAll"), nbShell = arrowFn("nbShell");
ok(!!addMep, "architect-walkthrough.tsx defines `const addMep = (…) => {` (the one bridge from the walk to walkMep)");
ok(!!forAll, "architect-walkthrough.tsx defines `const forAll = (…) => {` (the one MEP pass, THIS room)");
ok(!!nbShell, "architect-walkthrough.tsx defines `const nbShell = (…) => {` (the neighbour SHELL pass — shell glyphs only)");

// ── 2 · exactly ONE addMep( call site in the WHOLE file, and it is inside forAll ──
const addMepCalls = calls("addMep");
ok(addMepCalls.length === 1, `exactly ONE addMep( call site in the whole walkthrough (found ${addMepCalls.length} at lines ${addMepCalls.map(lineOf).join(",") || "—"})`);
const inForAll = addMepCalls.filter((i) => inside(i, forAll));
ok(inForAll.length === 1, `that one addMep( call sits inside forAll (${inForAll.length} inside; forAll spans lines ${forAll ? `${lineOf(forAll.start)}–${lineOf(forAll.end)}` : "?"})`);
const site = addMepCalls[0];
if (site !== undefined) console.log(`addMep call site pinned: ${FILE.replace("../", "frontend/")}:${lineOf(site)} → ${src.split("\n")[lineOf(site) - 1].trim()}`);

// ── 3 · its origin is (0, 0) — THIS room's frame — and it keys off THIS room's own identity (roomObjs + room.k) ──
// addMep(L, outlets, objs, ox, oy, boxesOnly?, kind?) — see the definition's params
const args = site !== undefined ? argsAt(site) : [];
ok(args.length >= 5, `the addMep call passes at least (layer, outlets, objs, ox, oy) (got ${args.length} args: ${args.join(" | ")})`);
ok(args[3] === "0" && args[4] === "0", `the addMep origin is literally 0, 0 — THIS room's frame, never a neighbour offset (got ox=${args[3]} oy=${args[4]})`);
ok(/^roomObjs$/.test(args[2] ?? ""), `the objects passed are THIS room's own (roomObjs; got ${args[2]})`);
ok(/^room\??\.k$/.test(args[6] ?? ""), `the kind passed is THIS room's own key (room?.k; got ${args[6] ?? "—"})`);
ok(addMep ? /\bwalkMep\s*\(\s*L\s*,\s*outlets\s*,\s*objs\s*,\s*ox\s*,\s*oy\s*,\s*kind\s*\)/.test(addMep.body) : false, "addMep forwards (layer, outlets, objs, ox, oy, kind) to walkMep unchanged");

// ── 4 · walkMep is reached ONLY through addMep: exactly one walkMep( call site in the file, inside addMep ──
const walkMepCalls = calls("walkMep");
ok(walkMepCalls.length === 1, `exactly ONE walkMep( call site in the whole walkthrough (found ${walkMepCalls.length} at lines ${walkMepCalls.map(lineOf).join(",") || "—"})`);
ok(walkMepCalls.every((i) => inside(i, addMep)), "the walkMep( call sits inside addMep — no second path draws MEP geometry");

// ── 5 · the neighbour-shell pass draws NO MEP: no addMep(/walkMep( inside nbShell, nor on the lines that invoke it ──
ok(nbShell ? calls("addMep", nbShell.start, nbShell.end).length === 0 && calls("walkMep", nbShell.start, nbShell.end).length === 0 : false, "nbShell's body calls neither addMep nor walkMep (shell glyphs only — MEP never bleeds through a wall)");
const nbShellInvocations = calls("nbShell").filter((i) => !inside(i, nbShell));
ok(nbShellInvocations.length >= 4, `nbShell is invoked for the N/S/E/W neighbours (${nbShellInvocations.length} call sites)`);
const invocationLines = new Set(nbShellInvocations.map(lineOf));
ok([...invocationLines].every((ln) => !/\b(addMep|walkMep)\s*\(/.test(code.split("\n")[ln - 1])), `the neighbour-pass invocation lines (${[...invocationLines].join(",")}) carry no addMep/walkMep`);
// and NOTHING after forAll's own invocation ever adds MEP — the single call site above already proves it; this names the region
const forAllRun = /for\s*\(\s*const\s+\w+\s+of\s+layers\s*\)\s*forAll\s*\(/.exec(code);
ok(!!forAllRun, "every active layer is drawn through forAll (`for (const L of layers) forAll(L)`)");
ok(forAllRun ? calls("addMep", forAllRun.index).length === 0 : false, "no addMep( call site after the forAll loop (the neighbour pass region draws no MEP)");
ok(nbShell && forAll ? nbShell.def > forAll.end : false, "the neighbour pass comes AFTER the room's own MEP pass (ordering of the two regions is as pinned)");

// ── 6 · the law's comment survives, where the code is (between addMep's definition and forAll's) ──
const law = src.indexOf("MEP draws for THIS ROOM ONLY");
ok(law >= 0, "the comment `MEP draws for THIS ROOM ONLY` survives in architect-walkthrough.tsx");
ok(addMep && forAll ? law > addMep.end && law < forAll.def : false, "…and it sits between addMep's definition and forAll's (the next reader meets the law at the call site)");
ok(/never a neighbour/.test(src), "the comment still says `never a neighbour's` (the half of the law the neighbour-shell pass must honour)");

console.log(`\nARCHITECT-WALK-MEP-CALLSITE ${pass}/${pass + fail} passed · one addMep at (0,0) inside forAll · walkMep only via addMep · neighbour shell pass draws no MEP · law comment kept`);
if (fail > 0) process.exit(1);
