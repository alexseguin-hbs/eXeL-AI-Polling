// HOMEPAGE EASTER-EGG lock — the two hidden preset hyperlinks stay wired to their destinations:
//  · white "Trinity Framework" (trinity.blank.title)  → /main/Celestial-2525/
//  · violet "Sacred Family Framework" (trinity.family.title) → /main/Architect-2525/design → Architect
//    Design → MODEL, where the Tiny Home / Home target-market selector lives (Thought Master IMG_7483).
// Run: node --experimental-strip-types tests/home-eggs.test.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log(c ? "PASS" : "FAIL", m); };

const page = fs.readFileSync(path.join(ROOT, "app/page.tsx"), "utf8");
// Trinity egg (unchanged) — white preset → Celestial-2525.
ok(/trinity\.blank\.title[\s\S]{0,160}href="\/main\/Celestial-2525\/"[\s\S]{0,40}data-trinity-egg/.test(page), "Trinity Framework egg → /main/Celestial-2525/ (data-trinity-egg)");
// Family egg — violet family preset → Architect Design deep-link.
ok(/trinity\.family\.title[\s\S]{0,160}href="\/main\/Architect-2525\/design\/"[\s\S]{0,40}data-family-egg/.test(page), "Sacred Family Framework egg → /main/Architect-2525/design/ (data-family-egg)");

// The design deep-link route mounts the Architect on the DESIGN tab.
const route = fs.readFileSync(path.join(ROOT, "app/main/Architect-2525/design/page.tsx"), "utf8");
ok(/initialTab="DESIGN"/.test(route), "design route mounts <ArchitectCommandUX1 initialTab=\"DESIGN\">");

// DESIGN resolves to the Design tab + MODEL subtab (where Tiny Home / Home is selectable).
const ux = fs.readFileSync(path.join(ROOT, "components/architect-2525/command-ux1.tsx"), "utf8");
ok(/DESIGN:\s*\[\s*"Design"\s*,\s*"Model"\s*\]/.test(ux), 'alias DESIGN → ["Design","Model"] (lands on Model)');

console.log(`\nHOME-EGGS ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
