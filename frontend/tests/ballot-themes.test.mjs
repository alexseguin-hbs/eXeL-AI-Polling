// BALLOT-THEMES lock (AsM round 2, Krishna 2026-10-07) — a real session's participant ballot ranks the
// session's OWN Cube 6 Theme02 ids, the rule cube7 submit_user_ranking enforces: non-empty rows at the
// voting level, under parents of the session's theme01_category when one is set. The page used to send
// the placeholder ids "t1".."t9", so every human ballot was refused (422).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/ballot-themes.test.mjs
import { readFileSync } from "node:fs";
import { ballotThemeRows, toBallotThemes, levelOf, categoryKey } from "../lib/ballot-themes.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log(c ? "PASS" : "FAIL", m); };

const U = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const parent = (id, label, cat) => ({ id, label, summary: "", confidence: 0.9, response_count: 10, theme01_category: cat, theme_level: null, parent_theme_id: null });
const child = (id, label, level, pid, count) => ({ id, label, summary: "", confidence: 0.8, response_count: count, theme01_category: null, theme_level: level, parent_theme_id: pid });
const rows = [
  parent(U(1), "Risk & Concerns", "risk"), parent(U(2), "Supporting Comments", "support"), parent(U(3), "Neutral Comments", "neutral"),
  ...Array.from({ length: 9 }, (_, i) => child(U(10 + i), `Risk ${i}`, "9", U(1), 20 - i)),
  child(U(30), "", "9", U(1), 0), // an empty padding slot: never on the ballot
  ...Array.from({ length: 9 }, (_, i) => child(U(40 + i), `Support ${i}`, "9", U(2), 5)),
  ...Array.from({ length: 3 }, (_, i) => child(U(60 + i), `Risk L3 ${i}`, "3", U(1), 9)),
];

const risk9 = ballotThemeRows(rows, "9", "risk");
ok(risk9.length === 9, "risk @ 9 → the nine non-empty risk Theme02 rows");
ok(risk9.every((r) => r.parent_theme_id === U(1) && r.label), "every ballot row is a non-empty child of a risk parent");
ok(risk9.map((r) => r.label).join() === Array.from({ length: 9 }, (_, i) => `Risk ${i}`).join(), "the server's row order is kept (deterministic)");
ok(ballotThemeRows(rows, "9", null).length === 18, "no category → every category's level-9 rows (backend: no parent scope)");
ok(ballotThemeRows(rows, "3", "risk").length === 3, "level 3 reads the level-3 rows only");
ok(ballotThemeRows(rows, "9", "neutral").length === 0, "a category with no children → empty ballot");
ok(ballotThemeRows([], "9", "risk").length === 0, "no themes → empty ballot, never placeholders");

const themes = toBallotThemes(risk9, rows);
ok(themes.every((t) => /^[0-9a-f-]{36}$/.test(t.id)), "every ballot id is the session's own UUID — never t1..t9");
ok(themes.every((t) => t.partition === "Risk & Concerns" && t.confidence <= 1), "partition from the parent, confidence 0–1");

ok(levelOf("theme2_3") === "3" && levelOf("theme2_6") === "6" && levelOf(undefined) === "9", "voting level → 3/6/9, default 9");
ok(categoryKey("Risk & Concerns") === "risk" && categoryKey("Supporting Comments") === "support" && categoryKey("x") === null, "categoryKey mirrors the backend _category_key");

const sv = readFileSync(new URL("../components/session-view.tsx", import.meta.url), "utf8");
ok(/useSessionBallotThemes\(/.test(sv), "session-view loads the real ballot with useSessionBallotThemes");
ok(!/themes=\{simThemes\.length > 0 \? simThemes : SIM_THEMES\}/.test(sv), "the ranking UI no longer falls back to SIM_THEMES for a real session");
ok(/simulationMode\s*\?\s*\(simThemes\.length > 0 \? simThemes : SIM_THEMES\)\s*:\s*\(liveBallot \?\? \[\]\)/.test(sv), "SIM_THEMES only in simulation mode");
const drv = readFileSync(new URL("../lib/sim-console-driver.ts", import.meta.url), "utf8");
ok(/ballotThemeRows\(rows, "9", "risk"\)/.test(drv), "the Admin Console driver builds its ballot with the same rule");

console.log(`\nballot-themes: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
