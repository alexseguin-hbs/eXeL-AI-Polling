// rcore-revisions — the R-CORE version-history model + adapters + compare, and the two Stage-1 mounts.
// ====================================================================================================
// Pure gate (operator 2026-09-25): the adapters normalize a ledger and a DRS revisions[] correctly;
// compareRevisions is deterministic and its counts follow the ledger; the badge source wires the two
// click stages and opens the panel; and BOTH Stage-1 surfaces (SoI-2525, Drone-2525) mount RCoreBadge.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/rcore-revisions.test.mjs
import fs from "node:fs";
import {
  fromLedgerJson, fromDrsRevisions, historyOf, compareRevisions, firstSentence, redactModelIds,
} from "../lib/2525-core/revisions.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// ── 1 · fromLedgerJson normalizes a traceability ledger ───────────────────────────────────────────
const ledger = {
  section: "Test-2525", route: "/t", note: "n",
  entries: [
    { rev: 1, date: "2026-01-01", kind: "ask", text: "First ask. Details here.", commit: "aaa111" },
    { rev: 2, date: "2026-01-02", kind: "release", text: "Shipped the thing. And more.", commit: "bbb222" },
    { rev: 3, date: "2026-01-03", kind: "decision", text: "Decided to do X.", commit: "" },
    { rev: 4, date: "2026-01-04", kind: "correction", text: "Fixing the record. The invariant holds.", commit: "ddd444" },
  ],
};
const H = fromLedgerJson(ledger);
ok(H.surface === "Test-2525" && H.route === "/t", "ledger surface + route carried through");
ok(H.revisions.length === 4, `4 revisions (got ${H.revisions.length})`);
ok(H.current === "4", `current = newest rev as string (got ${H.current})`);
ok(H.revisions[0].rev === "1" && H.revisions[0].kind === "ask", "entry 1 rev/kind normalized");
ok(H.revisions[0].title === "First ask." && H.revisions[0].detail === "First ask. Details here.", "title = first sentence; detail = full text");
ok(H.revisions[0].commit === "aaa111", "commit carried when present");
ok(H.revisions[2].commit === undefined, "empty commit → undefined (not a shipped sha)");

// ── 2 · firstSentence ─────────────────────────────────────────────────────────────────────────────
ok(firstSentence("Hello world. Next thing.") === "Hello world.", "firstSentence stops at the first period");
ok(firstSentence("") === "", "firstSentence of empty is empty");

// ── 3 · fromDrsRevisions normalizes a DRS revisions[] ──────────────────────────────────────────────
const drs = [
  { revision: "0.001", date: "2026-01-01", kind: "ask", why: "An ask.", commit: "fe6fa34" },
  { revision: "0.002", date: "2026-01-02", kind: "release", why: "A release.", commit: "PENDING" },
];
const dr = fromDrsRevisions(drs);
ok(dr.length === 2 && dr[0].rev === "0.001" && dr[0].kind === "ask" && dr[0].detail === "An ask.", "DRS revision normalized (rev/kind/detail)");
ok(dr[1].commit === "PENDING", "a non-sha commit ('PENDING') is kept verbatim");
const H2 = historyOf("SoI", "/s", dr);
ok(H2.current === "0.002" && H2.surface === "SoI", "historyOf wraps a revision list with surface/route/current");

// ── 4 · compareRevisions — deterministic + counts follow the ledger ────────────────────────────────
const c1 = compareRevisions("1", "4", H);
const c2 = compareRevisions("1", "4", H);
ok(JSON.stringify(c1) === JSON.stringify(c2), "compareRevisions is deterministic (same inputs → same output)");
ok(c1.fromRev === "1" && c1.toRev === "4", "from/to resolved to the picked revisions");
ok(c1.crossed.length === 3, `crossed = entries after 'from' through 'to' (got ${c1.crossed.length}, expected 3)`);
ok(c1.releasesCrossed === 1, `1 release crossed (got ${c1.releasesCrossed})`);
ok(c1.added === 1, `added = crossed asks+releases = 1 (got ${c1.added})`);
ok(c1.revised === 2, `revised = crossed decisions+corrections = 2 (got ${c1.revised})`);
ok(c1.carried === 1, `carried = the floor 'from' and before = 1 (got ${c1.carried})`);
ok(c1.impact === "L5", `impact = L5 (an 'invariant' correction crossed; got ${c1.impact})`);
ok(Array.isArray(c1.ops) && c1.sideBySide && typeof c1.sideBySide.left === "string" && typeof c1.sideBySide.right === "string", "a word diff (ops + sideBySide) is produced for differing details");
ok(/^[0-9a-f]{8}$/.test(c1.compareHash), "compareHash is 8 hex chars");

// same revision on both sides → nothing crossed
const cs = compareRevisions("2", "2", H);
ok(cs.crossed.length === 0 && cs.releasesCrossed === 0 && cs.added === 0 && cs.revised === 0, "compare(x,x) crosses nothing");

// order-independent window: (a,b) and (b,a) resolve the same from→to window
const cab = compareRevisions("1", "3", H);
const cba = compareRevisions("3", "1", H);
ok(cab.fromRev === cba.fromRev && cab.toRev === cba.toRev && cab.crossed.length === cba.crossed.length, "the compare window is order-independent");

// ── 5 · real generated data (the two Stage-1 sources) ──────────────────────────────────────────────
const { SOI_DRS_REVISIONS } = await import("../lib/2525-core/soi-drs-revisions.gen.ts");
const { DRONE_LEDGER } = await import("../lib/2525-core/drone-ledger.gen.ts");
const soiH = historyOf("SoI-2525", "/SoI-2525", fromDrsRevisions(SOI_DRS_REVISIONS));
// FRESHNESS, not a floor (fleet 2026-09-26, HIGH): the generated SoI ledger must reflect EVERY revision of its
// source (docs/drs/drs.v00.00.json) and end on the same rev — a stale gen (the 0.127-vs-0.130 drift) fails here.
const drsSrc = JSON.parse(fs.readFileSync(new URL("../../docs/drs/drs.v00.00.json", import.meta.url), "utf8"));
ok(soiH.revisions.length === drsSrc.revisions.length, `SoI gen reflects EVERY DRS revision (gen ${soiH.revisions.length} === source ${drsSrc.revisions.length}) — no stale drift`);
ok(soiH.current === drsSrc.revisions[drsSrc.revisions.length - 1].revision, `SoI gen ends on the source's latest revision (${soiH.current} === ${drsSrc.revisions[drsSrc.revisions.length - 1].revision})`);
ok(soiH.revisions.every((r) => r.rev && typeof r.title === "string"), "every SoI revision normalized (rev + title)");
// MODEL-ID RENDER REDACTION (operator 2026-09-26, "redact at render, keep record"): the normalized text the panel
// renders (title + detail, on every surface) carries NO model identifier, though the source ledgers keep their words.
const MODEL = /\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku)\s*\d|\bGrok\b|\bGemini\b|\bGPT-?\s*\d/i;
ok(redactModelIds("Model changed to Opus 4.8 mid-round; the Grok audit") === "Model changed to an external model mid-round; the an external model audit", "redactModelIds replaces model tokens with a neutral label");
const soiClean = soiH.revisions.every((r) => !MODEL.test(r.title) && !MODEL.test(r.detail ?? ""));
const droneClean = fromLedgerJson(DRONE_LEDGER).revisions.every((r) => !MODEL.test(r.title) && !MODEL.test(r.detail ?? ""));
ok(soiClean, "no model identifier renders in ANY SoI revision (title/detail) — the flagship compare surface is clean");
ok(droneClean, "no model identifier renders in ANY Drone revision (title/detail) — the drone compare surface is clean");
const droneH = fromLedgerJson(DRONE_LEDGER);
ok(droneH.surface === "Drone-2525" && droneH.revisions.length >= 40, `Drone history from the ledger (${droneH.revisions.length} entries)`);
const soiCmp = compareRevisions(soiH.revisions[0].rev, soiH.current, soiH);
ok(soiCmp.crossed.length === soiH.revisions.length - 1, "SoI compare(first → current) crosses everything but the floor");

// ── 6 · the badge source wires the two-click states and opens the panel ────────────────────────────
const badgeSrc = fs.readFileSync(new URL("../components/2525-core/rcore-badge.tsx", import.meta.url), "utf8");
const panelSrc0 = fs.readFileSync(new URL("../components/2525-core/rcore-revision-panel.tsx", import.meta.url), "utf8");
// operator 2026-09-30: REST = the R-CORE wordmark centred; a tap MAXIMIZES the single icon, a second tap MINIMIZES it (a toggle);
// the icon opens the panel; the header shows no lone icon and centres the wordmark + its line.
ok(/data-rcore-pill[\s\S]*onClick=\{toggleIcon\}/.test(badgeSrc) && /setShowIcon\(\(v\) => !v\)/.test(badgeSrc) && /aria-expanded=\{showIcon\}/.test(badgeSrc), "badge REST: the R-CORE wordmark is the toggle (a tap shows the icon, a second tap hides it)");
ok(/data-rcore-icon[\s\S]*onClick=\{openPanel\}/.test(badgeSrc) && /setOpen\(true\)/.test(badgeSrc), "badge ICON: the single icon, when shown, opens the panel (setOpen(true))");
ok(/transform: showIcon \? "scale\(1\)" : "scale\(0\)"/.test(badgeSrc) && /height: showIcon \? H : 0/.test(badgeSrc) && /pointerEvents: showIcon \? "auto" : "none"/.test(badgeSrc) && /aria-hidden=\{!showIcon\}/.test(badgeSrc), "the icon grows and shrinks the same way (maximize ↔ minimize) and is inert while hidden");
ok(!/setStage\(/.test(badgeSrc) && /className="flex w-full flex-col items-center justify-center"/.test(badgeSrc), "no three-stage ladder remains; R-CORE and its icon sit on the centre line");
ok(/data-rcore-header[^\n]*justifyContent: "center"/.test(panelSrc0) && /flexDirection: "column", alignItems: "center", textAlign: "center"/.test(panelSrc0), "the panel header centres the wordmark and its line");
ok(!/data-rcore-header[\s\S]{0,1200}r-core-icon\.png/.test(panelSrc0), "the panel header shows no lone reticle icon (the wordmark carries the brand)");
ok(/position: "absolute", right: 12, top: "50%"[\s\S]{0,400}data-rcore-download[\s\S]{0,900}data-rcore-close/.test(panelSrc0), "the download and close buttons keep the right edge");
ok(/\{open && <RCoreRevisionPanel/.test(badgeSrc), "badge renders RCoreRevisionPanel when open");
ok(/data-rcore-badge/.test(badgeSrc) && /flex w-full flex-col items-center justify-center/.test(badgeSrc) && !/fixed left-1\/2/.test(badgeSrc), "badge sits at the BOTTOM of the page in normal flow (mounted last, centred column: R-CORE, then its icon), never a fixed overlay on top of the image/slide (operator 2026-09-25)");

// the panel is the version-history + compare tool, reusing compareRevisions
const panelSrc = fs.readFileSync(new URL("../components/2525-core/rcore-revision-panel.tsx", import.meta.url), "utf8");
ok(/data-rcore-panel/.test(panelSrc) && /compareRevisions\(/.test(panelSrc), "panel is the compare tool (uses compareRevisions)");
ok(/rcore\.version_history/.test(panelSrc) && /rcore\.what_changed/.test(panelSrc), "panel is titled Version History and shows the 'What changed' diff");
ok(/decisionsOf\(/.test(panelSrc) && /\\bD\\d/.test(panelSrc), "panel renders the per-revision D# decision citations (traceability), not just the diff (fleet 2026-09-26, Athena)");

// ── 6b · ONE logo size: the bottom badge and the panel header size the rasters from the SAME constant ──
// Operator 2026-09-27: "make R-CORE LOGO AND LOGO + Word art default size at bottom of page and the same size at
// top of comparison / revision review." The invariant is the shared constant, not a pixel number: the badge reads
// RCORE_LOGO_H, every raster in the panel header reads RCORE_LOGO_H, and no raster is forced to a square.
const revSrc = fs.readFileSync(new URL("../lib/2525-core/revisions.ts", import.meta.url), "utf8");
ok(/export const RCORE_LOGO_H = \d+;/.test(revSrc), "RCORE_LOGO_H is exported once from the shared revisions module (no import cycle)");
// the badge names its rasters by the ICON / WORDMARK constants; the panel inlines the two paths
const badgeImgs = [...badgeSrc.matchAll(/<img src=\{(?:ICON|WORDMARK)\}[^>]*>/g)].map((m) => m[0]);
const panelImgs = [...panelSrc.matchAll(/<img[^>]*\/r-core\/r-core-(?:icon|wordmark)\.png[^>]*>/g)].map((m) => m[0]);
ok(badgeImgs.length === 2 && badgeImgs.every((s) => /height: H\b/.test(s) && /width: "auto"/.test(s)) && /const H = RCORE_LOGO_H;/.test(badgeSrc), "badge: icon + wordmark rasters at height H = RCORE_LOGO_H, natural width");
ok(panelImgs.length === 1 && panelImgs.every((s) => /height: RCORE_LOGO_H\b/.test(s) && /width: "auto"/.test(s) && !/width=\{\d+\}|height=\{\d+\}/.test(s)), "panel header: ONE raster — the wordmark — at height RCORE_LOGO_H, natural width, never a forced square (the lone icon left the header, operator 2026-09-30)");
ok(!/height: \d+, width: "auto"/.test(panelSrc) && !/height: \d+, width: "auto"/.test(badgeSrc), "no hardcoded raster height remains in the badge or the panel — one size, one constant");

// ── 7 · both Stage-1 surfaces mount RCoreBadge, each from its own source ────────────────────────────
const soiSrc = fs.readFileSync(new URL("../app/SoI-2525/page.tsx", import.meta.url), "utf8");
ok(/<RCoreBadge\b/.test(soiSrc) && /fromDrsRevisions/.test(soiSrc) && /SOI_DRS_REVISIONS/.test(soiSrc), "SoI-2525 mounts RCoreBadge, sourced from the DRS revisions");
const droneSrc = fs.readFileSync(new URL("../components/drone-2525/command-ux1.tsx", import.meta.url), "utf8");
ok(/<RCoreBadge\b/.test(droneSrc) && /fromLedgerJson/.test(droneSrc) && /DRONE_LEDGER/.test(droneSrc), "Drone-2525 mounts RCoreBadge, sourced from the traceability ledger");

console.log(`\nrcore-revisions: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
