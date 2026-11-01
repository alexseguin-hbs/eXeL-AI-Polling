#!/usr/bin/env node
/**
 * THE FEEDBACK FORMAT — one comment/decision per image, for every image (operator 2026-10-31: "send updated html and decision
 * file … image then comment, image comment/decision (1 for 1 for all images)"). The rule lives in CLAUDE.md's FX HTML + JSON
 * rule (Release Process #5); his words are persisted under docs/asks with a sha256 sidecar. The artifacts themselves are built
 * outside the repo, so this gate holds the RULE and the RECORD — the two things a future session reads before building one.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const md = readFileSync(path.join(REPO, "CLAUDE.md"), "utf8");
const rule = md.slice(md.indexOf("EVERY CHUNK IS DELIVERED AS THE FX HTML + JSON FEEDBACK ARTIFACT"), md.indexOf("OFFICIAL HI DECISIONS ARE PRESENTED AS HTML OPTIONS"));
ok(rule.length > 0, "the FX HTML + JSON rule is in CLAUDE.md");
ok(/PER IMAGE — one for one, for every image/.test(rule), "the FX rule says: one 👍/✎/✋ row + comment PER IMAGE, one for one, for every image");
ok(/operator 2026-10-31: "image\s*\n?\s*then comment, image comment\/decision \(1 for 1 for all images\)"/.test(rule), "the rule quotes his words");
ok(/a before image, an after image and a whole-screen capture are\s*\n?\s*three cards/.test(rule), "a before image, an after image and a whole-screen capture are three cards");
ok(/decision cards carry real images beside their picks/.test(rule), "decision cards carry real images beside their picks, each with its own row");
ok(/features\[<imageId>\]/.test(rule), "the paired JSON holds one features[<imageId>] per image");
ok(/the H\.I\. DECISION section sits at the END of the page, in flow — never a panel pinned over the middle of a phone/.test(rule) && /HI input\s*\n?\s*section should be on bottom and not cover center of screen/.test(rule), "the FX rule says: the H.I. DECISION section is at the END of the page, only a one-line bar pinned at the bottom (operator 2026-10-31 20:40)");
const asks = path.join(REPO, "docs/asks");
const files = readdirSync(asks).filter((f) => /^2026\.10\.31_.*feedback_format_one_decision_per_image\.md$/.test(f));
ok(files.length === 1, "his words are persisted once under docs/asks (stamped)");
for (const f of files) {
  ok(existsSync(path.join(asks, f + ".sha256")), `${f} has its sha256 sidecar`);
  const t = readFileSync(path.join(asks, f), "utf8");
  ok(/1 for 1 for all images/.test(t) && !/\b(opus|sonnet|haiku|fable)\b/i.test(t), `${f} carries his words and no model identifier`);
}
const layoutAsk = readdirSync(asks).filter((f) => /^2026\.10\.31_.*fx_hi_input_section_at_the_bottom_never_covering_the_centre\.md$/.test(f));
ok(layoutAsk.length === 1 && existsSync(path.join(asks, layoutAsk[0] + ".sha256")), "his 20:40 layout words are persisted once with their sha256 sidecar");

console.log(`\nFX-FORMAT ${pass}/${pass + fail} passed — one comment/decision per image is the rule, on the record`);
if (fail > 0) process.exit(1);
