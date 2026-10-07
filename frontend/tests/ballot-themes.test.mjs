// Run through `npm run test:ballot-themes` (it adds the ts-alias loader); plain `node --test` cannot resolve "@/".
// BALLOT-THEMES lock (AsM round 2, Krishna 2026-10-07) — a real session's participant ballot ranks the
// session's OWN Cube 6 Theme02 ids, the rule cube7 submit_user_ranking enforces: non-empty rows at the
// voting level, under parents of the session's theme01_category when one is set. The page used to send
// the placeholder ids "t1".."t9", so every human ballot was refused (422).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/ballot-themes.test.mjs
import { readFileSync } from "node:fs";
import { ballotThemeRows, toBallotThemes, levelOf, categoryKey, ballotRetryDelayMs } from "../lib/ballot-themes.ts";
import { LIVE_SESSION_WRITE } from "../lib/api.ts";

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
ok(/simulationMode\s*\?\s*\(simThemes\.length > 0 \? simThemes : SIM_THEMES\)\s*:\s*\(liveBallot\.themes \?\? \[\]\)/.test(sv), "SIM_THEMES only in simulation mode");
const drv = readFileSync(new URL("../lib/sim-console-driver.ts", import.meta.url), "utf8");
ok(/ballotThemeRows\(rows, "9", "risk"\)/.test(drv), "the Admin Console driver builds its ballot with the same rule");

// Round 3 (Odin + Enki): a failed or empty load is never an empty ballot; it retries with backoff and jitter.
const bt = readFileSync(new URL("../lib/ballot-themes.ts", import.meta.url), "utf8");
ok(!/setThemes\(\[\]\)/.test(bt) && /status: "failed"/.test(bt), "a rejected fetch becomes a failed state with a retry, never []");
ok(ballotRetryDelayMs(1, () => 0.5) === 1500 && ballotRetryDelayMs(3, () => 0.5) === 6000 && ballotRetryDelayMs(20, () => 0.5) === 30000, "backoff 1.5 s doubling, capped at 30 s");
ok(ballotRetryDelayMs(1, () => 0) === 750 && ballotRetryDelayMs(1, () => 0.999) < 2250, "±50 % jitter so a crowd does not retry together");
ok(/liveBallot\.status === "failed"/.test(sv) && /shared\.error\.retry/.test(sv), "the page shows the failed state with a Retry button");
ok(/liveBallot\.status === "ready" && ballotThemes\.length > 0/.test(sv), "the ballot renders only with themes in it");
// Round 3 (Christo): a participant never calls the moderator-only close; results show their own order.
const rankBlock = sv.slice(sv.indexOf("{/* Ranking state */}"), sv.indexOf("{/* Results Phase"));
ok(!/\/close/.test(rankBlock), "the participant's See results never posts /sessions/{id}/close");
ok(/resultThemes/.test(sv.slice(sv.indexOf("{/* Results Phase"))) && /setMyRankedOrder\(order\)/.test(sv), "the results card shows the participant's own submitted order");
// Round 3 (Krishna): against the real backend the moderator's create and transitions write the keyed /api/sessions record.
ok(LIVE_SESSION_WRITE.test("/sessions") && LIVE_SESSION_WRITE.test(`/sessions/${U(1)}/poll`) && LIVE_SESSION_WRITE.test(`/sessions/${U(1)}/close`), "create and transitions are bridged to /api/sessions");
ok(!LIVE_SESSION_WRITE.test(`/sessions/${U(1)}/rankings`) && !LIVE_SESSION_WRITE.test("/sessions/join/ABCD"), "ballots and joins are not");

// Round 4: the bridge is really called, in order; the merge never moves status backwards; a re-open reaches a voter.
const apiSrc = readFileSync(new URL("../lib/api.ts", import.meta.url), "utf8");
ok(/LIVE_SESSION_WRITE\.test\(path\)[\s\S]{0,200}queueSessionSync\(/.test(apiSrc) && /prev\.then\(\(\) => syncSessionToKV\(/.test(apiSrc), "request() writes /api/sessions after create/transitions, one write at a time per code");
ok(/statusRank\(st as Session\["status"\]\) > statusRank\(data\.status\)/.test(sv) && /if \(ahead\(kvData\.status\)\)/.test(sv), "the edge copy only moves a loaded status forward");
ok(/setBallotDone\(true\)/.test(sv) && !/onComplete=\{\(order\) => \{\s*if \(!simulationMode && order\) setMyRankedOrder\(order\);\s*\/\/[^\n]*\n[^\n]*\n\s*setSession\(\(prev\) => prev \? \{ \.\.\.prev, status: "closed" \}/.test(sv), "a real voter's results keep the session's true status (a re-open still reaches them)");
ok(/BALLOT_EMPTY_RECHECK_CAP_MS = 5000/.test(bt) && /setAttempt\(0\)/.test(bt), "empty re-checks capped at 5 s; a new session starts the backoff over");

console.log(`\nballot-themes: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
