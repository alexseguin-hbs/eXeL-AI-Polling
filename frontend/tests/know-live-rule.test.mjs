#!/usr/bin/env node
/**
 * KNOW WHAT IS LIVE BEFORE EVERY UPDATE — the rule is on the record (operator 2026-10-31: "test the site" · "Make sure you know
 * what fucking architect-2525 is live always").
 *
 * CLAUDE.md carries the standing rule with its three sources in order (the direct probe · the latest Verify Live LIVE STATE line ·
 * the operator's own stamp), the status-line format naming the source and the time, the clause that UNVERIFIED is allowed only with
 * the failed probe quoted, and the environment ask. His words of the day are persisted under docs/asks with a sha256 sidecar and
 * carry no model identifier.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const md = readFileSync(path.join(REPO, "CLAUDE.md"), "utf8");
const at = md.indexOf("KNOW WHAT IS LIVE BEFORE EVERY UPDATE (operator 2026-10-31");
ok(at > 0, "CLAUDE.md carries the rule, dated to the operator's words");
const rule = at > 0 ? md.slice(at, at + 2400) : "";
ok(/"test the site"/.test(rule) && /architect-2525 is live always/.test(rule), "the rule quotes his words");
const i1 = rule.indexOf("direct probe"), i2 = rule.indexOf("LIVE STATE"), i3 = rule.indexOf("operator's own stamp");
ok(i1 > 0 && i2 > i1 && i3 > i2, "the three sources are named in order: the direct probe, then the Verify Live LIVE STATE line, then the operator's own stamp");
ok(/npm run status/.test(rule) && /list_workflow_runs\(verify-live\.yml\)/.test(rule), "the rule says how each machine source is read");
ok(/cloudflare LIVE <sha> \(<source> · <time>\)/.test(rule), "the status line names its source and time");
ok(/UNVERIFIED is allowed only with the failed probe quoted/.test(rule), "UNVERIFIED is allowed only with the failed probe quoted");
ok(/cloud-environments#network-access/.test(rule) && /exel-ai-polling\.explore-096\.workers\.dev/.test(rule), "the standing environment ask names the host and the settings page");
ok(/know-live-rule\.test\.mjs/.test(rule), "the rule names its own gate");
ok(/read the second source/i.test(md.slice(md.indexOf("UNREACHABLE IS NOT A PASS"), md.indexOf("UNREACHABLE IS NOT A PASS") + 700)), "the older 'UNREACHABLE IS NOT A PASS' rule now sends the reader to the second source instead of stopping at UNVERIFIED");

const asks = path.join(REPO, "docs/asks");
const files = readdirSync(asks).filter((f) => /^2026\.10\.31_.*know_what_is_live.*\.md$/.test(f));
ok(files.length >= 1, "his 2026-10-31 words are persisted under docs/asks (stamped)");
for (const f of files) {
  ok(existsSync(path.join(asks, f + ".sha256")), `${f} has its sha256 sidecar`);
  const txt = readFileSync(path.join(asks, f), "utf8");
  ok(!/\b(opus|sonnet|haiku|fable)\b|claude-(opus|sonnet|haiku|fable)/i.test(txt), `${f} carries no model identifier`);
  ok(/architect-2525 is live always/.test(txt) && /004242d/.test(txt) && /000fe42/.test(txt), `${f} carries his words, his stamp and the served sha`);
}

console.log(`\nKNOW-LIVE-RULE ${pass}/${pass + fail} passed — the rule and his words are on the record`);
if (fail > 0) process.exit(1);
