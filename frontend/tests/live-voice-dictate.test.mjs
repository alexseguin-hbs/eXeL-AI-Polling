/**
 * CRS-15.09 — LiveVoiceDictate wiring + API client + lexicon keys.
 * Browser Web Speech itself is unverifiable headless — we only assert the code path exists.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const dictate = read("components/live-voice-dictate.tsx");
ok(dictate.includes("useSpeechRecognition"), "prefers Web Speech hook");
ok(dictate.includes("api.transcribeVoice"), "server fallback calls transcribeVoice");
ok(dictate.includes('role = "participant"'), "participant role default");
ok(/role\?: \"participant\" \| \"moderator\"/.test(dictate) || dictate.includes('LiveVoiceRole'), "moderator role supported");
ok(dictate.includes("edit_before_submit"), "editable-before-submit copy");
ok(dictate.includes("pickVoiceMime"), "MIME negotiation on server fallback");
ok(!/submitVoiceResponse/.test(dictate), "dictate path must NOT auto-submit");

const api = read("lib/api.ts");
ok(api.includes("transcribeVoice:"), "api.transcribeVoice present");
ok(api.includes("/voice/transcribe"), "hits /voice/transcribe");
ok(/voice\(\?:\\\/transcribe\)\?/.test(api) || api.includes("voice(?:\\/transcribe)?"), "PARTICIPANT_WRITE covers /voice/transcribe");

const session = read("components/session-view.tsx");
ok(session.includes("LiveVoiceDictate"), "participant session mounts LiveVoiceDictate");
ok(session.includes('role="participant"'), "participant role wired");

const dash = read("app/dashboard/page.tsx");
ok(dash.includes("data-moderator-dictate-title"), "moderator title mic");
ok(dash.includes("data-moderator-dictate-description"), "moderator description mic");

const decision = read("components/final-decision.tsx");
ok(decision.includes("LiveVoiceDictate"), "decision reason mic");
ok(decision.includes('role="moderator"'), "moderator role on decision");

const lex = read("lib/lexicon-data.ts");
for (const k of [
  "cube3.voice.dictate",
  "cube3.voice.edit_before_submit",
  "cube3.voice.browser_only_hint",
  "cube3.voice.timeout",
  "cube3.voice.network_error",
  "cube3.voice.stt_fallback_failed",
  "cube3.voice.moderator_dictate",
]) {
  ok(lex.includes(`key: "${k}"`), `lexicon ${k}`);
}

const cubes = readFileSync(join(root, "../docs/CUBES_1-3.md"), "utf8");
ok(/CRS-15\.09.*Implemented \(code\)/s.test(cubes) || cubes.includes("CRS-15.09") && cubes.includes("Implemented (code)"), "CRS-15.09 marked Implemented (code)");

console.log(`live-voice-dictate: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
