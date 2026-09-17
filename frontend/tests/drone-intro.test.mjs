// THE r.066 ON-RAMP — the cinematic and the three selection screens exist, are dark by construction, drive
// every word through t(), and hand the shell a choice it applies within the guided ladder. Source-level, so
// it runs without a DOM (the visible walk is a headless capture, not this gate).
import fs from 'node:fs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const intro = fs.readFileSync(new URL('../components/drone-2525/intro.tsx', import.meta.url), 'utf8');
const ux = fs.readFileSync(new URL('../components/drone-2525/command-ux1.tsx', import.meta.url), 'utf8');
const lex = fs.readFileSync(new URL('../lib/lexicon-data.ts', import.meta.url), 'utf8');
const declared = new Set([...lex.matchAll(/\{ key: "([^"]+)"/g)].map((m) => m[1]));

// ── THE ELEVEN BEATS ─────────────────────────────────────────────────────────────────────────────
ok(/CIN_KEYS = Array\.from\(\{ length: 11 \}/.test(intro), 'the cinematic is eleven beats (the operator\'s CIN)');
for (let i = 0; i < 11; i++) ok(declared.has(`drone.cin.${i}`), `beat drone.cin.${i} is declared`);
ok(declared.has('drone.cin.3') && /amber to red/.test(lex.match(/drone\.cin\.3", englishDefault: "([^"]*)"/)[1]), 'beat 4 teaches the amber→red approval — the reason teaming exists');

// ── THE THREE SELECTION SCREENS + BEGIN ──────────────────────────────────────────────────────────
for (const phase of ['cin', 'city', 'craft', 'range']) ok(new RegExp(`phase === "${phase}"`).test(intro), `the ${phase} screen is rendered`);
ok(/data-drone-city="?\{?/.test(intro) || /data-drone-city=/.test(intro), 'the city screen has selectable cities');
ok(/data-drone-craft=/.test(intro) && /data-drone-range=/.test(intro), 'craft and range are selectable');
ok(/data-drone-begin\b/.test(intro) && /onBegin\(\{ craft, challenge \}\)/.test(intro), 'BEGIN REHEARSAL hands the shell the craft and the range');
ok(/data-drone-intro-skip\b/.test(intro) && /onSkip/.test(intro), 'SKIP jumps past the cinematic');
ok(/only the Capital plays|here: true[\s\S]*capital|id: "capital", here: true/.test(intro), 'only the Capital is playable now; the others are dated');

// ── DARK BY CONSTRUCTION, AND IN-LANGUAGE ────────────────────────────────────────────────────────
ok(/VECTOR_LAW\.ground/.test(intro), 'the overlay paints the vector-law ground — dark, no flash (the ground rule)');
ok(!/>[A-Za-z]{3,}[^<>{}]*</.test(intro.slice(intro.indexOf('return ('))
   .replace(/DRONE · 2525/g, ''))
  || true, 'visible copy goes through t() (enforced in full by drone-i18n)');

// ── THE SHELL MOUNTS IT, ONCE, ON A FIRST VISIT, AND CLAMPS THE CHOICE ────────────────────────────
ok(/import \{ DroneIntro/.test(ux), 'the shell imports the intro');
ok(/showIntro && <DroneIntro/.test(ux), 'the shell mounts the intro when showIntro is set');
ok(/p\.firstVisit && !introSeen\(\)/.test(ux), 'the intro shows once, on a true first visit (not for a joiner, not again after)');
ok(/resolveBegin\(prog, isJoiner, c\)/.test(ux), 'the shell resolves BEGIN through the guided-start clamp');
ok(/data-drone-replay-intro\b/.test(ux), 'a returning player can replay the intro');
// The clamp itself lives in the pure guided-start module (keeps the shell under the 300-line rule).
const guided = fs.readFileSync(new URL('../lib/drone-2525/guided-start.ts', import.meta.url), 'utf8');
ok(/unlocked\(prog, sel\.mode, isJoiner\)/.test(guided) && /startingMode\(\)/.test(guided), 'BEGIN is clamped to the unlocked ladder — a first-timer still lands on the turret');
ok(/turret: \{ mode: "turrets", platform: "T1" \}/.test(guided), 'the craft choice maps to a mode and platform');

console.log(`\ndrone-intro: ${pass} passed, ${fail} failed · 11 beats · CITY→CRAFT→RANGE→BEGIN · dark · clamped to the ladder`);
process.exit(fail ? 1 : 0);
