import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { countWords, validateAsm111Comments, validateMot333, inPodSoft333Band, ASM_MASTERS } from "../lib/wordcount.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fix = path.join(__dirname, "../fixtures/synthetic");
let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("FAIL:", msg); } }

const v111 = fs.readFileSync(path.join(fix, "asm111-valid.txt"), "utf8");
const i110 = fs.readFileSync(path.join(fix, "asm111-invalid-110.txt"), "utf8");
const i112 = fs.readFileSync(path.join(fix, "asm111-invalid-112.txt"), "utf8");
ok(countWords(v111) === 111, "valid fixture is 111");
ok(countWords(i110) === 110, "110 fixture");
ok(countWords(i112) === 112, "112 fixture");

const comments = ASM_MASTERS.map((m) => ({ master: m, text: v111 }));
ok(validateAsm111Comments(comments).ok, "12×111 validates");
ok(!validateAsm111Comments([{ master: "Aset", text: i110 }]).ok, "110 refuses");
ok(!validateAsm111Comments([{ master: "Aset", text: i112 }]).ok, "112 refuses");
ok(!validateAsm111Comments(comments.slice(0, 11)).ok, "missing master refuses when requireAllTwelve");

const motOk = fs.readFileSync(path.join(fix, "mot333-valid.md"), "utf8").trim().split(/\n\s*\n/);
ok(validateMot333(motOk).ok, "3×111 MoT validates");
ok(validateMot333(motOk).total === 333, "MoT total 333");
const motBad = fs.readFileSync(path.join(fix, "mot333-invalid-2para.md"), "utf8").trim().split(/\n\s*\n/);
ok(!validateMot333(motBad).ok, "2-paragraph MoT refuses");
ok(!validateMot333([v111, i110, v111]).ok, "111+110+111 refuses");

ok(inPodSoft333Band(320), "pod soft band accepts 320");
ok(!inPodSoft333Band(299), "pod soft band rejects 299");
ok(countWords("  a   b  ") === 2, "whitespace collapse");

console.log(`wordcount: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
