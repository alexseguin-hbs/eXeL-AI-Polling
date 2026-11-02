// ARCHITECT-2525 · THE TINY HOME CARD — SAME FORMAT AS CUBE/ECO, CATALOG-HONEST VALUES (operator 2026-11-02:
// "fix the Tiny home format (above details to match exactly)"; the exemplar is the Cube/Eco card's labeled rows —
// Area / Cost / Build / Energy ★ / Carbon ★ + a basis footer). This REVERSES the 2026-10-31 catalog-only block
// (decision #116): the Tiny now shows the SAME rows as the other two, with its OWN honest values — Area 280 ft² ·
// 5 zones · Cost = the catalog ASSUMED $67,000 (house+hookups+delivery), NEVER an invented engine derivation ·
// Build mo · Energy/Carbon stars · a "catalog stock plan" footer. The LOFT / SECOND FLOOR switch + the three
// ASSUMED money lines move into "See details". ONE SOURCE: compareModels' Cost reads the same catalogSum for a
// preset, so the card's Cost ⇄ the compare-winner agree. Holds the CARD RENDER + the data contract + the one-source law.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-thow-card.test.mjs
import fs from "node:fs";
import path from "node:path";
import { modelById, catalogSum, compareModels, costFor } from "@/lib/architect-sim-options";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.resolve(HERE, p), "utf8");
const so = read("../components/architect-2525/simulate-options.tsx");

// ── the data contract (one source) — UNCHANGED: the Tiny still carries the catalog preset the operator fixed ──
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

// ── ONE SOURCE (operator 2026-11-02): the headline Cost a preset shows is its catalog ASSUMED sum, NOT the engine ──
const costRank = compareModels().find((r) => r.metric === "Cost");
const tinyCost = costRank.values.find((v) => v.id === "tiny").value;
ok(tinyCost === catalogSum(pr), `the compare Cost metric reads the Tiny's catalog sum ($${tinyCost}), the SAME number the card shows`);
ok(tinyCost !== costFor(tiny, tiny.native), "the Tiny's headline Cost is NOT the invented engine derivation (no fabricated stock-plan price)");
ok(costRank.winnerId === "tiny", "the Tiny is the cheapest of the three (its $67,000 wins the Cost compare)");

// ── the card RENDER (simulate-options.tsx) — the Tiny shows the SAME labeled rows as Cube/Eco ──
ok(/const preset = m\.catalogPreset;/.test(so) && /const headlineCost = preset \? catalogSum\(preset\) : cardTotal;/.test(so), "the card computes a catalog-aware headlineCost (catalog sum for a preset, engine total otherwise)");
ok(/const basisLabel = preset \? "catalog stock plan"/.test(so), "a preset's footer basis label is 'catalog stock plan' (honest — not 'real cost estimate')");
ok(/\{row\("Area", `\$\{m\.areaFt2\.toLocaleString\(\)\} ft² · \$\{m\.layoutLabel\}`\)\}/.test(so), "the Area row renders for EVERY form (one unified block — the Tiny matches Cube/Eco)");
ok(/\{row\("Cost", `\$\{usd\(headlineCost\)\} · \$\{usd\(headlinePerFt2\)\}\/ft²`, "Cost"\)\}/.test(so), "the Cost row shows headlineCost · $/ft² for every form (the Tiny shows its $67,000)");
ok(/\{row\("Build", `\$\{monthsFor\(m, opt\)\} mo`, "Build time"\)\}/.test(so), "the Build row renders for every form (the Tiny shows its build months)");
ok(/<span>\{basisLabel\}<\/span>\s*\n\s*<span style=\{\{ color: C\.dim \}\}>efficiency: estimated<\/span>/.test(so), "the basis footer (basisLabel · efficiency: estimated) renders for every form");
ok(!/data-arch-sim-catalog-costnote/.test(so) && !/no calculated project cost, \$\/ft², or star rating/.test(so), "the old 'no calculated cost / $/ft² / star rating' note is GONE (the Tiny now shows them, catalog-honest)");

// ── the catalog detail (LOFT/SECOND FLOOR + the three ASSUMED money lines) MOVED into "See details" ──
ok(/data-arch-sim-catalog=\{m\.id\}/.test(so), "the catalog detail body is tagged data-arch-sim-catalog (now under See details)");
ok(/data-arch-sim-catalog-money/.test(so) && /Placed on city utilities/.test(so) && /house \+ hookups \+ delivery/.test(so), "the money block still shows the three ASSUMED lines + the one labelled $67,000 sum");
ok(/data-arch-sim-upper=\{`\$\{m\.id\}:\$\{u\}`\}/.test(so) && /"loft", "second-floor"/.test(so), "the LOFT / SECOND FLOOR switch is kept (in See details)");
ok(/the card&apos;s Cost row shows this same sum/.test(so), "the detail ties the $67,000 back to the card's Cost row (one story, no drift)");

console.log(`\narchitect-thow-card: ${pass} passed, ${fail} failed · the Tiny Home card matches Cube/Eco (Area·Cost·Build·Energy★·Carbon★) with catalog-honest values ($67,000 ASSUMED, stock plan) · detail in See details`);
process.exit(fail ? 1 : 0);
