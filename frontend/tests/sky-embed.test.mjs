// SKY-EMBED lock — the Architect Design→Sky subtab renders the Celestial-2525 MASTER via iframe (single source,
// operator: "the master design is always the Celestial-2525 — use an iframe so code does not have to be repurposed").
// Pure-node wiring guard for the e2a39f3 embed + the #A67 truth-fix. Run: node --experimental-strip-types tests/sky-embed.test.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log(c ? "PASS" : "FAIL", m); };

const ux = fs.readFileSync(path.join(ROOT, "components/architect-2525/command-ux1.tsx"), "utf8");
ok(/import\s*\{\s*SkyCelestialEmbed\s*\}\s*from\s*"\.\/sky-celestial-embed"/.test(ux), "command-ux1 imports SkyCelestialEmbed");
ok(/sub\("Design"\)\s*===\s*"Sky"\s*\?\s*<SkyCelestialEmbed/.test(ux), "Design→Sky subtab renders <SkyCelestialEmbed>");

const emb = fs.readFileSync(path.join(ROOT, "components/architect-2525/sky-celestial-embed.tsx"), "utf8");
ok(/data-sky-celestial-embed/.test(emb), "embed carries the data-sky-celestial-embed hook (SPIRAL #A67)");
ok(/src="\/main\/Celestial-2525\/"/.test(emb), "iframe src = /main/Celestial-2525/ (the master)");
ok(/<iframe/.test(emb), "renders an <iframe> (no code repurposing)");

console.log(`\nSKY-EMBED ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
