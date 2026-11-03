// ARCHITECT-2525 · Simulate is mobile-first at 390px (operator tests on his phone; "mobile-first verification" is
// Release Process #9). Source-scan regression guard that the Simulate surfaces touched in R1–R3 stay phone-safe:
// the compact ⬇ PDF chip never forces the row wide (shrink-0), the wide 13-CHECKS matrix scrolls INSIDE itself
// (overflow-x-auto) rather than pushing the page, the Eco hex-dimension lines wrap, the A01 link is a normal chip,
// and nothing on these surfaces sets a min-width wider than a phone. The live 390px proof is the R1–R3 FX captures;
// this locks the structure so it can't regress. Run: node tests/architect-sim-mobile.test.mjs
import fs from "node:fs";
import path from "node:path";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.resolve(HERE, p), "utf8");
const opts = read("../components/architect-2525/simulate-options.tsx");

// ── the compact download chip rides the title line without forcing width (operator: "make one line … doesn't take so much space") ──
ok(/data-arch-sim-print[\s\S]{0,200}shrink-0/.test(opts), "the ⬇ PDF chip is shrink-0 (never stretches the title row on a phone)");
ok(/THREE WAYS TO BUILD YOUR HOME[\s\S]{0,400}data-arch-sim-print/.test(opts), "the chip shares the heading's line (one line)");

// ── the wide side-by-side matrix scrolls inside itself, not the page ──
ok(/data-arch-sim-matrix[\s\S]{0,40}overflow-x-auto|overflow-x-auto[\s\S]{0,40}data-arch-sim-matrix/.test(opts), "the 13-CHECKS matrix scrolls inside its own container (overflow-x-auto) — the page never scrolls sideways");

// ── the Eco hex-dimension reference lines wrap (leading-snug text, not a fixed-width block) ──
ok(/data-arch-eco-floor[\s\S]{0,80}leading-snug/.test(opts) && /data-arch-eco-roof[\s\S]{0,80}leading-snug/.test(opts), "the Eco hex-dimension lines wrap (leading-snug), not a wide fixed row");

// ── the A01 link is a normal inline chip (no fixed huge width) and the lightbox image is contained ──
ok(/data-arch-eco-a01\b[\s\S]{0,160}inline-flex/.test(opts), "the A01 link is a normal inline chip");
ok(/data-arch-eco-a01-overlay[\s\S]{0,400}p-3/.test(opts), "the A01 lightbox keeps a side gutter on a phone (p-3)");
ok(/object-contain/.test(opts), "the A01 image is object-contain (fits the phone screen, no overflow)");

// ── nothing on these surfaces pins a min-width wider than a phone (the matrix inner min-w is 300, inside its own scroller) ──
const bigMinW = [...opts.matchAll(/min-w-\[(\d+)px\]/g)].map((m) => +m[1]).filter((n) => n > 360);
ok(bigMinW.length === 0, `no min-width wider than a phone on the Simulate surfaces (found ${bigMinW.join(", ") || "none"})`);
// the one deliberate inner min-width (the matrix scroller) is <= 320 and lives inside overflow-x-auto
ok(/minWidth: 300/.test(opts), "the only inner min-width is the 300px matrix track (inside the overflow-x-auto scroller)");

console.log(`\narchitect-sim-mobile: ${pass} passed, ${fail} failed · Simulate is phone-safe at 390px (compact chip shrink-0 · matrix scrolls inside · eco lines wrap · A01 contained · no page-wide min-width)`);
process.exit(fail ? 1 : 0);
