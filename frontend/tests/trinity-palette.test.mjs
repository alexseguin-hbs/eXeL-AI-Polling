// TRINITY PALETTE lock — TRINITY_COLORS is the single source of truth for the SoI Trinity spectrum, read by the home
// page, Divinity Guide, and the SoI section (COIN_C: SI→temporal · HI→family · AI→consciousness). Pins the anchor hues
// so the ♡◬웃 coins + SoI rings + default theme can't silently drift. Run:
// node --experimental-strip-types tests/trinity-palette.test.mjs
import { TRINITY_COLORS } from "../lib/trinity-palette.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

const keys = Object.keys(TRINITY_COLORS);
const vals = Object.values(TRINITY_COLORS);

ok(keys.length === 13, "13 spectrum stops (infrared → white)");
ok(vals.every((v) => /^#[0-9A-Fa-f]{6}$/.test(v)), "every colour is a valid #RRGGBB hex");
ok(new Set(vals).size === vals.length, "no duplicate colours in the spectrum");

// SoI Tri-Coin anchors (soi-section COIN_C + the cyan-rings work depend on these exact hues)
ok(TRINITY_COLORS.consciousness === "#00FFFF", "◬ AI / default = cyan #00FFFF");
ok(TRINITY_COLORS.temporal === "#FFFF00", "♡ SI = sunset yellow #FFFF00");
ok(TRINITY_COLORS.family === "#8B00FF", "웃 HI = violet #8B00FF");
ok(TRINITY_COLORS.human === "#8B0000", "human = infrared #8B0000 (spectrum start)");
ok(TRINITY_COLORS.blank === "#FFFFFF", "blank = white #FFFFFF (Trinity Framework)");

console.log(`\nTRINITY-PALETTE ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
