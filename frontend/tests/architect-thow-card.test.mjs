// ARCHITECT-2525 · THE TINY HOME CARD IS A CATALOG PRESET (operator 2026-10-31: "ARCHITECT-2525 — THOW card only. Do not
// touch the nine-space plan. The Tiny Home card is a catalog preset … interior 10'-0" × 28'-0" · main floor 280 ft² …
// upper half 140 ft² · LOFT or SECOND FLOOR … outside 11'-0" × 29'-0" · 6 in walls · ASSUMED … not a normal tow …
// House $57,000 / Hookups $7,000 / Delivery $3,000 ASSUMED, separate lines … Placed on city utilities · $67,000 …
// DELETE 8.5×24, 204 ft², standard THOW, $118,800, $582/ft², Build 2 mo, Energy stars, Carbon stars … do not show PASS,
// a star rating, or a calculated project cost"). Holds the CARD RENDER (simulate-options.tsx) + the data contract.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-thow-card.test.mjs
import fs from "node:fs";
import path from "node:path";
import { modelById, catalogSum } from "@/lib/architect-sim-options";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.resolve(HERE, p), "utf8");
const so = read("../components/architect-2525/simulate-options.tsx");

// ── the data contract (one source) ──
const tiny = modelById("tiny"), pr = tiny.catalogPreset;
ok(!!pr, "the Tiny model carries a catalogPreset");
ok(pr.mainFloorFt2 === 280 && tiny.areaFt2 === 280, "main floor 280 ft² exactly");
ok(pr.upperFt2 === 140 && pr.upperDefault === "loft", "upper half 140 ft², LOFT by default (switchable to SECOND FLOOR)");
ok(JSON.stringify(pr.interiorFt) === "[10,28]" && JSON.stringify(pr.exteriorFt) === "[11,29]" && pr.wallIn === 6, "interior 10×28 · exterior 11×29 · 6-in walls");
ok(pr.money.house === 57000 && pr.money.hookups === 7000 && pr.money.delivery === 3000, "money: House $57k · Hookups $7k · Delivery $3k (separate ASSUMED lines)");
ok(catalogSum(pr) === 67000, "the one labelled sum = $67,000 (house + hookups + delivery)");
ok(pr.cardLines.some((l) => /not a normal tow/i.test(l)), "the card says 'not a normal tow'");
ok(pr.notes.some((n) => /second floor.*NOT CALCULATED|NOT CALCULATED/i.test(n)) && pr.notes.some((n) => /well.*septic.*not included|not included/i.test(n)), "second floor NOT CALCULATED; well/septic not included");
ok(!/\b204\b|8\.5|standard THOW|118,?800|\$?582/.test(tiny.form + " " + pr.cardLines.join(" ")), "DELETED from the card data: 8.5×24, 204 ft², standard THOW, $118,800, $582/ft²");

// ── the card RENDER (simulate-options.tsx) — catalog preset branch, money lines, the switch, no calculated cost ──
ok(/m\.catalogPreset \? \(\(\) => \{/.test(so), "the card branches on m.catalogPreset (the Tiny renders as a catalog preset, not the engine card)");
ok(/data-arch-sim-catalog=\{m\.id\}/.test(so), "the catalog card body is tagged data-arch-sim-catalog");
ok(/data-arch-sim-catalog-money/.test(so) && /Placed on city utilities/.test(so) && /house \+ hookups \+ delivery/.test(so), "the money block shows the three ASSUMED lines + the one labelled $67,000 sum");
ok(/data-arch-sim-upper=\{`\$\{m\.id\}:\$\{u\}`\}/.test(so) && /"loft", "second-floor"/.test(so), "the LOFT / SECOND FLOOR switch is on the card");
ok(/data-arch-sim-catalog-costnote/.test(so) && /no calculated project cost, \$\/ft², or star rating/.test(so), "the catalog preset shows NO calculated cost / $/ft² / star rating (its cost block is gated off)");
// the engine card rows (Cost $/ft², Build mo, Energy/Carbon stars) only render for NON-catalog models
ok(/\}\)\(\) : \(<>\s*\n\s*<div className="mt-1\.5 space-y-0\.5">\s*\n\s*\{row\("Area"/.test(so), "the engine rows (Cost/$-ft²/Build/Energy★/Carbon★) are the else-branch — only Cube/Eco show them");

console.log(`\narchitect-thow-card: ${pass} passed, ${fail} failed · the Tiny Home card is a catalog preset (280 ft² · ASSUMED money · LOFT/SECOND FLOOR · no stars/PASS/cost)`);
process.exit(fail ? 1 : 0);
