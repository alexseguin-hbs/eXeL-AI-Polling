/**
 * Narrow source-key / lookup test for newly introduced pod persist + video status strings.
 * Convention: keys live in lexicon-data.ts (DEFAULT_ENGLISH_TRANSLATIONS); screens call t(key).
 * Missing ×32 fills are staged in AFTER_FILL / AFTER_BATCH — explicit coverage gap, not silent.
 * Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/pod-persist-lexicon.test.mjs
 */
import { DEFAULT_ENGLISH_TRANSLATIONS } from "../lib/lexicon-data.ts";
import { PERSIST_STATUS_KEYS } from "../lib/pod-persist.ts";
import { RECORD_METHODS, FREE_TOOLS_NOTE_KEY } from "../lib/pod-projects.ts";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  ok — ${m}`); } else { fail++; console.error(`  FAIL — ${m}`); } };

const EXPECTED_EN = {
  "soi.pod.persist.device_saved": "Kept on this device.",
  "soi.pod.persist.device_failed": "This device would not keep a copy of the pod.",
  "soi.pod.persist.device_idle": "Nothing to keep yet.",
  "soi.pod.persist.shared_blocked_no_membership": "Kept on this device only — a shared team copy needs verified membership first.",
  "soi.pod.persist.shared_blocked_no_owner": "Kept on this device only — a shared team copy needs a verified lead first.",
  "soi.pod.persist.shared_blocked_project_mismatch": "Kept on this device only — this pod is locked to a different project.",
  "soi.pod.persist.shared_idempotent_hit": "Shared copy already holds this revision — nothing was rewritten.",
  "soi.pod.persist.shared_saved": "Shared with the team.",
  "soi.pod.persist.shared_unavailable": "Kept on this device only — a shared team copy is not available yet.",
  "soi.pod.record.hint.video": "Paste a YouTube link of the session. Unlisted: anyone with the link can watch and reshare. Private: only people you invite on YouTube, signed into those accounts — a private link alone does not open it for the whole team.",
  "soi.pod.record.hint.written": "Type the outcome in words.",
  "soi.pod.record.hint.voice": "Speak it — the polling tool's voice-to-text captures it.",
  "soi.pod.free_tools_note": "The pod runs on free tools: the polling tool's voice-to-text, a YouTube video link (Unlisted or Private — see the video hint), or plain text. No purchase is needed to witness and record an outcome — the Seed is membership, not a paywall on contribution.",
};

console.log("keys registered + englishDefault mirrors expected");
for (const [k, en] of Object.entries(EXPECTED_EN)) {
  const e = DEFAULT_ENGLISH_TRANSLATIONS[k];
  ok(!!e, `${k} in DEFAULT_ENGLISH_TRANSLATIONS`);
  ok(e?.englishDefault === en, `${k} englishDefault exact`);
  ok(e?.cubeId === 60, `${k} cubeId 60`);
}

console.log("PERSIST_STATUS_KEYS / RECORD_METHODS / FREE_TOOLS_NOTE_KEY point at those keys");
for (const [status, key] of Object.entries(PERSIST_STATUS_KEYS)) {
  ok(key in EXPECTED_EN, `status ${status} → ${key}`);
}
for (const r of RECORD_METHODS) {
  ok(typeof r.hintKey === "string" && r.hintKey in EXPECTED_EN, `RECORD_METHODS.${r.id}.hintKey`);
  ok(!("hint" in r), `RECORD_METHODS.${r.id} has no raw English hint field`);
}
ok(FREE_TOOLS_NOTE_KEY === "soi.pod.free_tools_note", "FREE_TOOLS_NOTE_KEY");

console.log("page renders via t(PERSIST_STATUS_KEYS…) / t(hintKey) / t(FREE_TOOLS_NOTE_KEY) — no PERSIST_STATUS_COPY");
const here = path.dirname(fileURLToPath(import.meta.url));
const page = fs.readFileSync(path.join(here, "../app/soi-session/page.tsx"), "utf8");
ok(page.includes("t(PERSIST_STATUS_KEYS[devicePersistStatus])"), "device status via t()");
ok(page.includes("t(PERSIST_STATUS_KEYS[sharedPersistStatus])"), "shared status via t()");
ok(!page.includes("PERSIST_STATUS_COPY"), "PERSIST_STATUS_COPY removed from page");
ok(page.includes("t(m.hintKey)") || page.includes("t(FREE_TOOLS_NOTE_KEY)"), "record hint or free tools via t()");
ok(page.includes("t(FREE_TOOLS_NOTE_KEY)"), "free tools via t()");
ok(!/RECORD_METHODS\.find\([^)]*\)\?\.hint\b/.test(page), "no raw .hint on RECORD_METHODS in page");

console.log("AFTER_FILL / AFTER_BATCH list the gap (do not claim 33-lang)");
const cov = fs.readFileSync(path.join(here, "lexicon-coverage.test.mjs"), "utf8");
const batch = fs.readFileSync(path.join(here, "sign-i18n-all.test.mjs"), "utf8");
for (const k of Object.keys(EXPECTED_EN)) {
  ok(cov.includes(`'${k}'`) || cov.includes(`"${k}"`), `AFTER_FILL lists ${k}`);
  ok(batch.includes(`"${k}"`), `AFTER_BATCH lists ${k}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
