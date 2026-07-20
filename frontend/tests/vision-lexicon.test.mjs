// VISION-2525 shared-lexicon lock — the R-CORE / view / measurement UX phrases live in ONE master lexicon
// (lib/lexicon-data.ts) that BOTH Security-2525 and Architect-2525 consume. Operator: "one master everyone uses."
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/vision-lexicon.test.mjs
import { CUBE_GROUPS, DEFAULT_ENGLISH_TRANSLATIONS, ALL_KEYS } from "../lib/lexicon-data.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("PASS", m); } else { fail++; console.log("FAIL", m); } };

// 1. The Vision-2525 shared group is registered in the one master.
const group = CUBE_GROUPS.find((g) => g.cubeId === 40);
ok(!!group && group.keys.length > 0, "Vision-2525 shared UX group registered in CUBE_GROUPS (cubeId 40)");
ok(group.label.includes("Vision-2525"), "group label names Vision-2525");

// 2. The R-CORE + view + measurement vocabulary both projects render is present with English defaults.
const SHARED = [
  "vision.view.2d", "vision.view.3d", "vision.view.voxel", "vision.rcore",
  "vision.ctrl.reset", "vision.ctrl.mirrorH", "vision.ctrl.mirrorV", "vision.ctrl.northLock",
  "vision.nav.backToHouse",
  "vision.dim.fromWall", "vision.dim.toWall", "vision.dim.oc", "vision.dim.size", "vision.dim.set", "vision.dim.del",
];
for (const k of SHARED) {
  const e = DEFAULT_ENGLISH_TRANSLATIONS[k];
  ok(e && typeof e.englishDefault === "string" && e.englishDefault.trim().length > 0 && typeof e.context === "string" && e.context.length > 0,
    `${k} resolves through the master with a non-empty English default + context`);
}

// 3. Exact English defaults match the on-screen UI (so wiring is visually identical).
ok(DEFAULT_ENGLISH_TRANSLATIONS["vision.dim.fromWall"].englishDefault === "From wall", "vision.dim.fromWall = 'From wall'");
ok(DEFAULT_ENGLISH_TRANSLATIONS["vision.dim.oc"].englishDefault === "O.C.", "vision.dim.oc = 'O.C.'");
ok(DEFAULT_ENGLISH_TRANSLATIONS["vision.rcore"].englishDefault === "R-CORE", "vision.rcore = 'R-CORE'");
ok(DEFAULT_ENGLISH_TRANSLATIONS["vision.dim.set"].englishDefault === "Set", "vision.dim.set = 'Set'");

// 4. Every vision.* key is tagged cubeId 40 (single group, no leaks).
const visionKeys = ALL_KEYS.filter((k) => k.startsWith("vision."));
ok(visionKeys.length === group.keys.length, "all vision.* keys belong to the cubeId-40 group");
ok(visionKeys.every((k) => DEFAULT_ENGLISH_TRANSLATIONS[k].cubeId === 40), "every vision.* key is cubeId 40");

// 5. Master invariant — no duplicate keys anywhere in the one master (adding the group didn't collide).
const seen = new Set(), dups = [];
for (const k of ALL_KEYS) { if (seen.has(k)) dups.push(k); else seen.add(k); }
ok(dups.length === 0, `master lexicon has no duplicate keys (found ${dups.length})`);

console.log(`\nVISION-LEXICON ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
