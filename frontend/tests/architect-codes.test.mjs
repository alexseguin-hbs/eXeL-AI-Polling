// ARCHITECT-2525 · BUILDING-CODE LIBRARY (operator 2026-11-02: "Place download of 2024 International Building Code
// (IBC) in specification/building code section"). The 2024 IBC lives in the Codes panel's standards list and is
// reachable from an always-visible "Official code library" row. INVARIANT (FIX-THE-CLASS): a building-code link is
// the PUBLISHER's official https source (ICC Digital Codes), NEVER a PDF we host or bundle (the I-Codes are
// ICC-copyrighted); every officialUrl opens in a new tab with rel="noopener" so the app is never framed/hijacked.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-codes.test.mjs
import fs from "node:fs";
import path from "node:path";
import { STANDARDS, STANDARD_BY_ID, requirementsFor } from "@/lib/building-codes";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.resolve(HERE, p), "utf8");
const panel = read("../components/architect-2525/codes-panel.tsx");

// ── the 2024 IBC standard the operator asked for ──
const ibc = STANDARD_BY_ID["usa-ibc-2024"];
ok(!!ibc, "the 2024 IBC standard exists (id usa-ibc-2024)");
ok(ibc && /IBC 2024/.test(ibc.name) && ibc.scope === "usa", "it is named 'USA · IBC 2024', USA scope");
ok(ibc && /International Building Code 2024/.test(ibc.citation), "citation names the International Building Code 2024");
ok(ibc && ibc.officialUrl === "https://codes.iccsafe.org/content/IBC2024V2.0", "officialUrl is the ICC Digital Codes 2024 IBC page (the publisher's free read-only view)");
ok(ibc && ibc.requirements.length >= 5, `IBC carries real headline requirements (${ibc ? ibc.requirements.length : 0})`);
ok(ibc && ibc.requirements.some((r) => /tornado/i.test(r)), "IBC headline cites the NEW 2024 tornado loads (real 2024 change — not invented)");
ok(ibc && ibc.requirements.some((r) => /egress/i.test(r)), "IBC headline cites means of egress (Ch. 10)");
ok(requirementsFor(["usa-ibc-2024"]).length === 1, "requirementsFor resolves the IBC id");

// ── the PRODUCT-TRUTH / copyright invariant: every officialUrl is the publisher's external https page, NEVER a file we host ──
const withUrl = STANDARDS.filter((s) => s.officialUrl);
ok(withUrl.length >= 1, "at least one standard carries an officialUrl (the IBC)");
for (const s of withUrl) {
  ok(/^https:\/\//.test(s.officialUrl), `${s.id}: officialUrl is https (external)`);
  ok(/iccsafe\.org/.test(s.officialUrl), `${s.id}: officialUrl points to the official publisher (ICC)`);
  ok(!/\.pdf(\?|$)/i.test(s.officialUrl) && !/^\/|^\.\//.test(s.officialUrl), `${s.id}: officialUrl is NOT a bundled/hosted PDF or local path (we link, never host the copyrighted code)`);
}

// ── the Codes panel renders the link safely + the always-visible library + the honest copyright note ──
ok(/data-arch-code-library/.test(panel), "the panel renders an always-visible 'Official code library' row (not gated behind selecting the standard)");
ok(/data-code-read=\{s\.id\}/.test(panel), "each library entry is a per-standard read link (data-code-read)");
ok(/target="_blank"[\s\S]{0,80}rel="noopener noreferrer"/.test(panel), "code links open in a new tab with rel=noopener noreferrer (no window.opener hijack)");
ok(/href=\{s\.officialUrl\}/.test(panel), "the links use the standard's officialUrl (one source — data-driven, not a hardcoded URL in the view)");
ok(/ICC-copyrighted|never host/i.test(panel), "the panel states the codes are ICC-copyrighted and we never host them (honest — a link, not a bundled download)");
ok(!/href="https?:\/\//.test(panel) && !/IBC2024V2\.0/.test(panel), "the view does NOT hardcode the IBC href/URL — it reads officialUrl from the data (one source); only a human-readable 'codes.iccsafe.org' label is shown");

console.log(`\narchitect-codes: ${pass} passed, ${fail} failed · 2024 IBC in the building-code section · official ICC https link (free read), never a hosted PDF · opens safely`);
process.exit(fail ? 1 : 0);
