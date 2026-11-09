// Narrow SensorFusion collab lexicon key/lookup/source gate.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/sensor-fusion-lexicon.test.mjs
import fs from "node:fs";
import path from "node:path";
import { SF_NOTE_KEYS } from "../lib/sensor-fusion/collab.ts";
import { DEFAULT_ENGLISH_TRANSLATIONS } from "../lib/lexicon-data.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const keys = Object.values(SF_NOTE_KEYS);
ok(keys.length === 14, `14 collab note keys (got ${keys.length})`);
ok(keys.every((k) => k.startsWith("sf.collab.")), "keys use sf.collab.* prefix");
ok(keys.every((k) => DEFAULT_ENGLISH_TRANSLATIONS[k]?.englishDefault?.trim()), "lexicon-data englishDefault present for each key");
ok(keys.every((k) => DEFAULT_ENGLISH_TRANSLATIONS[k]?.cubeId === 81), "cubeId 81 SensorFusion collaborative persistence");

const cov = fs.readFileSync(path.resolve(import.meta.dirname, "./lexicon-coverage.test.mjs"), "utf8");
ok(/sf\.collab\./.test(cov) && /SensorFusion-2525 collab UI notes/.test(cov), "AFTER_FILL stages sf.collab.* as English-only");
ok(/×32 fill unverified|unverified/.test(cov), "coverage comment states ×32 fill unverified");

const page = fs.readFileSync(path.resolve(import.meta.dirname, "../app/SensorFusion-2525/sensor-fusion.tsx"), "utf8");
ok(/useLexicon/.test(page) && /t\(SF_NOTE_KEYS\./.test(page), "page looks up new notes via t()/SF_NOTE_KEYS");
ok(/t\(gate\.noteKey\)/.test(page) && /t\(gated\.noteKey\)/.test(page), "auth/reviewer failures translate noteKey");
ok(!/setUploadNote\("Sign in as a member of the sensor-fusion project/.test(page), "no hardcoded auth English in page");
ok(!/Team progress\/settings sync is waiting on the collaborative tables/.test(page), "sync-waiting English is not hardcoded in page");

console.log(`sensor-fusion-lexicon: ${pass} passed, ${fail} failed · non-en coverage for these keys is AFTER_FILL / explicitly unverified`);
process.exit(fail ? 1 : 0);
