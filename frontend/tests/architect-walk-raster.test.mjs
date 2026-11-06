// ARCHITECT-2525 · WALK-MODE RASTER (operator 2026-11-06: "use this" — his own "WALK MODE" figure from eXeL AI).
// "His pictures, never drawn": the Walk affordance uses the operator's raster, cropped to a transparent-background
// icon, in place of the drawn WalkGlyph — on BOTH the Edit⇄Walk toggle (architect-design) and the room HUD
// (architect-walkthrough). The shipped icon + the full-card provenance are PINNED by sha256 so a re-export or a
// swap can never silently change his picture (same law as the Drone-2525 pose/magazine rasters).
// Run: node tests/architect-walk-raster.test.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.resolve(HERE, p), "utf8");
const sha = (p) => { try { return crypto.createHash("sha256").update(fs.readFileSync(path.resolve(HERE, p))).digest("hex"); } catch { return null; } };

// The shipped icon (used by the app) and the full-card master (provenance, not in the web bundle).
const ICON = "../public/architect-2525/walk-mode-icon.png";
const CARD = "../../docs/architecture-2525/img/walk-mode-card.png";
const ICON_SHA = "29e729749ef7718417046a5e0916bd8fb0045607cddbeb104d1879470cf59d86";
const CARD_SHA = "b16254758bbc89af8bead1b158cfee11bdf9e4c7b1e6bfc3940359cf70ef550f";

// ── the files exist and are EXACTLY his picture (sha256-pinned — never re-drawn, never silently re-exported) ──
ok(fs.existsSync(path.resolve(HERE, ICON)), "the shipped walk-mode icon exists (public/architect-2525/walk-mode-icon.png)");
ok(sha(ICON) === ICON_SHA, `the walk-mode icon is byte-for-byte the pinned crop (sha256 ${ICON_SHA.slice(0, 12)}…)`);
ok(fs.existsSync(path.resolve(HERE, CARD)), "the full WALK MODE card is kept as provenance (docs/architecture-2525/img/walk-mode-card.png)");
ok(sha(CARD) === CARD_SHA, `the provenance card is byte-for-byte the operator's raster (sha256 ${CARD_SHA.slice(0, 12)}…)`);
// a transparent PNG (RGBA) — the figure sits cleanly on the dark toggle/HUD, no black box
const iconBytes = (() => { try { return fs.readFileSync(path.resolve(HERE, ICON)); } catch { return Buffer.alloc(0); } })();
ok(iconBytes.slice(0, 8).toString("hex") === "89504e470d0a1a0a", "the icon is a real PNG");
ok(iconBytes.length > 0 && iconBytes.length < 60_000, `the icon is a small web asset (${iconBytes.length} bytes) — downscaled, not the 800KB card`);

// ── the WalkRaster component serves his picture (one place, reused by toggle + HUD) ──
const icons = read("../components/architect-2525/architect-walk-icons.tsx");
ok(/export function WalkRaster\b/.test(icons), "architect-walk-icons exports WalkRaster");
ok(/\/architect-2525\/walk-mode-icon\.png/.test(icons), "WalkRaster points at the shipped icon path");

// ── the Edit⇄Walk toggle (Design) uses EditGlyph for Edit + his WalkRaster for Walk (not the drawn WalkGlyph) ──
const design = read("../components/architect-2525/architect-design.tsx");
ok(/import \{ WalkRaster, EditGlyph \} from "\.\/architect-walk-icons"/.test(design), "architect-design imports WalkRaster");
ok(/\{m === "edit" \? <><EditGlyph[\s\S]{0,80}?<WalkRaster/.test(design), "the Walk side of the toggle renders <WalkRaster> (his figure)");
ok(!/<WalkGlyph/.test(design), "the drawn WalkGlyph no longer renders in architect-design (replaced by his raster)");

// ── the room HUD (walkthrough) uses the same WalkRaster ──
const walk = read("../components/architect-2525/architect-walkthrough.tsx");
ok(/import \{ WalkRaster,/.test(walk), "architect-walkthrough imports WalkRaster");
ok(/<WalkRaster size=\{16\} \/> \{room \?/.test(walk), "the current-room HUD renders <WalkRaster> before the room label");
ok(!/<WalkGlyph/.test(walk), "the drawn WalkGlyph no longer renders in the walkthrough HUD");

// ── no emoji anywhere on the walk affordance ──
ok(!/🚶/.test(design) && !/🚶/.test(walk), "no 🚶 emoji on the Walk toggle or HUD");

console.log(`\narchitect-walk-raster: ${pass} passed, ${fail} failed · the operator's WALK MODE figure (sha256-pinned) is the Walk toggle + HUD icon — his picture, never drawn`);
process.exit(fail ? 1 : 0);
