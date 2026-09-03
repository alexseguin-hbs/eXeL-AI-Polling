// manta-language-gate.mjs — flag language that outruns the Red gates (handoff §20.7).
//
// Scans docs/manta-2525/**/*.md for the eight forbidden terms and the one line the handoff
// says must not be distributed. The handoff's own "do not use" quotation and §20.7's list
// are the only exemptions — they name the problem; they are not the problem.
//
// Run: node scripts/manta-language-gate.mjs        (exit 1 on any hit outside the exemptions)
import fs from 'fs';
import path from 'path';

const M = JSON.parse(fs.readFileSync('docs/manta-2525/manta-trinity.v1.7.1.json', 'utf8'));
const TERMS = M.forbidden_language;                 // feasible · closed · safe · proven · operational · hurricane avoidance · descend during storm · ready for build
const BANNED_LINE = M.do_not_distribute;

const files = fs.readdirSync('docs/manta-2525').filter((f) => f.endsWith('.md')).map((f) => path.join('docs/manta-2525', f));
let hits = 0;
const rx = new RegExp('\\b(' + TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'i');

for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  // A file whose provenance header says it is VERBATIM (the operator's handoff, an external
  // review) is evidence, not our claim — the gate reads it, it does not police it.
  if (lines.slice(0, 15).some((l) => /verbatim/i.test(l))) { console.log(`skip ${f}  (verbatim input — evidence, not claims)`); continue; }
  let inHandoffQuoteBlock = false;
  let negList = false;   // inside a "They are not:" / "It is not:" bullet list — the package naming what it is NOT
  lines.forEach((line, i) => {
    const n = i + 1;
    if (/\bnot:\s*$/i.test(line.trim())) { negList = true; return; }
    if (negList) { if (line.trim() === '') negList = false; return; }
    // Exemptions: the handoff's §6 "Do not use phrases…" line + the quoted line; §20.7's list items;
    // this repository's own critique when it QUOTES a hit (marked with `⟦quoted⟧`).
    if (/^Do not use phrases that imply operational readiness/.test(line)) { inHandoffQuoteBlock = true; return; }
    if (inHandoffQuoteBlock && line.trim() === BANNED_LINE) { inHandoffQuoteBlock = false; return; }
    if (/^\s*[-*]\s+(feasible|closed|safe|proven|operational|hurricane avoidance|descend during storm|ready for build)\s*$/i.test(line)) return;
    if (/⟦quoted⟧/.test(line)) return;
    if (/^\s*>/.test(line) && /forbidden|flag|do not use|must not/i.test(line)) return;
    if (line.includes(BANNED_LINE)) { hits++; console.log(`HIT  ${f}:${n}  banned line: "${BANNED_LINE}"`); return; }
    // The doctrine says trust must be PROVEN — the opposite of claiming something is proven.
    if (line.includes(M.project.doctrine) || /trust must be proven/i.test(line)) return;
    // The package's own boundary vocabulary names what it is NOT: "operational doctrine",
    // "operational authorizations", "operational readiness", "hurricane-safety advice".
    if (/operational (doctrine|authori[sz]ations?|readiness)|hurricane-safety/i.test(line)) return;
    const m = line.match(rx);
    if (!m) return;
    // Negated or boundary context is the package stating what it is NOT ("not an operational
    // doctrine", "remain closed", "not proven", "do not use … safe") — that is the posture, not a claim.
    const before = line.slice(0, m.index).toLowerCase();
    const negated = /\b(not|never|no|nothing|nobody|none|cannot|remain|remains|until|before|without|isn't|aren't|do not|does not)\b[^.;:]{0,60}$/.test(before)
      || /^\s*(\*|-|•)?\s*(a |an )?(operational doctrine|hurricane-safety advice|safety case)/i.test(line.trim());
    if (negated) return;
    hits++; console.log(`HIT  ${f}:${n}  "${m[1]}"  →  ${line.trim().slice(0, 110)}`);
  });
}
console.log(`\n${files.length} file(s) scanned · ${hits} hit(s)`);
if (hits) { console.error('\nLanguage outruns the gates. Reword, or quote it with ⟦quoted⟧ inside the critique.'); process.exit(1); }
