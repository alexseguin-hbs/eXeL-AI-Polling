// ARCHITECT-2525 · HUD SLOT BUDGET (Wave 0, operator 2026-11-07 via MoT risk-sim: "five overlays already stack on the picture at
// 375/390/428 — new controls live INSIDE the map panel, no new absolute overlay"). A read-only source-scan of the walkthrough's
// ROOT overlays: every `<div className="… absolute …">` is a chip pinned over the first-person picture. The count is PINNED to
// today's number (room chip · turn cue · layer / framing / shell chips · 3 legends · map · sticks · caption) and the distinct
// anchor SLOTS (left/right × top/bottom offsets) likewise — a zoom / eye-height / measurements control is added inside the
// `data-arch-walk-map` panel (which must exist), never as one more overlay fighting for the phone's picture.
// Run: node tests/architect-hud-budget.test.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const walk = fs.readFileSync(path.join(ROOT, "components/architect-2525/architect-walkthrough.tsx"), "utf8");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };

// TODAY'S PINS (2026-11-07, Walk R3 + corner cams): 11 absolute overlay chips in 7 anchor slots. Raising either number is a
// decision for the 12-AsM sim, not a drive-by — put the control inside the map panel instead.
const HUD_OVERLAY_BUDGET = 11, HUD_SLOT_BUDGET = 7;

const overlays = [...walk.matchAll(/<div\b[^>]*className="([^"]*\babsolute\b[^"]*)"/g)];
// every data-arch-walk* hook on each overlay element (the sticks carry two: data-arch-walkpad + data-arch-walk-sticks)
const hooksOf = (tag) => tag.match(/data-arch-walk[\w-]*/g) || ["(unnamed)"];
const hooks = overlays.map((m) => hooksOf(m[0])[0]);
const allHooks = overlays.flatMap((m) => hooksOf(m[0]));
ok(overlays.length <= HUD_OVERLAY_BUDGET, `absolute overlay chips on the walk root: ${overlays.length} > budget ${HUD_OVERLAY_BUDGET} — new controls go INSIDE the map panel (found: ${hooks.join(", ")})`);
const anchor = (cls) => (cls.match(/\b(?:left|right|top|bottom|inset-x|inset-y|inset)-\[?[\w./%]+\]?/g) || []).sort().join(" ");
const slots = new Set(overlays.map((m) => anchor(m[1])));
ok(slots.size <= HUD_SLOT_BUDGET, `distinct HUD anchor slots: ${slots.size} > budget ${HUD_SLOT_BUDGET} (${[...slots].join(" | ")})`);
// the scan is live (the named chips are still found by it — a rewrite that hides the chips from the regex is not a budget win)
for (const h of ["data-arch-walk-room", "data-arch-walk-turncue", "data-arch-walk-map", "data-arch-walk-sticks"]) ok(allHooks.includes(h), `the scan finds the ${h} overlay`);
// the home for new in-walk controls exists
ok(/data-arch-walk-map\b/.test(walk) && /data-arch-walk-map-toggle/.test(walk), "the map panel (data-arch-walk-map, collapsible) exists — new controls live inside it");
// the overlays stay phone-safe: nothing pinned over the picture's centre (no absolute chip anchored at a vertical centre)
ok(!overlays.some((m) => /\btop-1\/2\b/.test(m[1])), "no overlay is pinned over the vertical centre of the picture (the viewer stays the hero)");

console.log(`\nARCHITECT-HUD-BUDGET ${pass}/${pass + fail} passed · ${overlays.length}/${HUD_OVERLAY_BUDGET} overlays · ${slots.size}/${HUD_SLOT_BUDGET} slots · new controls live inside the map panel`);
if (fail > 0) process.exit(1);
