#!/usr/bin/env node
// Financial-2525 round record (operator 2026-10-02: "SSSES, 12 AsM AAR and UX TEST, and Spiral test forward and backward
// implementation of Financial-2525 · EACH ROUND YOU FIND GAPS; fix code · go 33 rounds").
// Usage: node scripts/fin-round-record.mjs <revision e.g. 0.056> <round-file docs/financial-2525/rounds/rNN.md> "<why, one paragraph>"
// Appends the round as a revision (kind correction, commit = the HEAD it was built on, shipped PENDING), records the previous
// revision as shipped at that same HEAD (the door only starts a round once the previous ship is LIVE), adds the ledger rows,
// re-renders the views and the R-CORE gen. Append-only: no existing entry is edited except a PENDING shipped field.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
const [rev, roundFile, why] = process.argv.slice(2);
if (!/^\d\.\d{3}$/.test(rev || "") || !roundFile || !why) { console.error("usage: <0.NNN> <round-file> <why>"); process.exit(2); }
if (!existsSync(roundFile)) { console.error(`round file missing: ${roundFile}`); process.exit(2); }
const J = "docs/financial-2525/financial-2525.v.000.json", L = "docs/traceability/financial-2525.ledger.json";
const d = JSON.parse(readFileSync(J, "utf8")), l = JSON.parse(readFileSync(L, "utf8"));
const head = execSync("git rev-parse --short HEAD").toString().trim();
const date = execSync("date -u +%F").toString().trim();
const last = d.revisions[d.revisions.length - 1];
if (Math.round(Number(rev) * 1000) !== Math.round(Number(last.revision) * 1000) + 1) { console.error(`revision ${rev} must follow ${last.revision}`); process.exit(3); }
let nextLedger = Math.max(...l.entries.map((e) => e.rev)) + 1;
if (last.shipped === "PENDING") {
  last.shipped = head;
  l.entries.push({ rev: nextLedger++, date, kind: "release", text: `r.${last.revision.slice(2)} shipped and LIVE (Verify Live ✓ on ${head}).`, commit: head });
}
d.revisions.push({ revision: rev, date, kind: "correction", why: `${why} Round record: ${roundFile}.`, commit: head, shipped: "PENDING" });
d.project.revision = rev;
d.project.stamp = `v.${d.project.version}_r.${rev.slice(2)}`;
l.entries.push({ rev: nextLedger, date, kind: "correction", text: `r.${rev.slice(2)} correction — ${why.slice(0, 240)}`, commit: head });
writeFileSync(J, JSON.stringify(d, null, 1) + "\n");
writeFileSync(L, JSON.stringify(l, null, 1) + "\n");
execSync("node scripts/financial-render.mjs && node frontend/scripts/gen-rcore-revisions.mjs", { stdio: "inherit" });
console.log(`recorded r.${rev.slice(2)} on ${head} · ledger rev ${nextLedger}`);
