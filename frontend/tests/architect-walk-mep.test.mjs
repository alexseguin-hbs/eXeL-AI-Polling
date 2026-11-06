// ARCHITECT-2525 · WALK MEP gate (operator 2026-11-06: "I can't see electrical when in that phase"). The walk and this
// gate read the SAME pure module (lib/architect-walk-mep.ts), which REUSES the 2D/3D run geometry (lib/mep-runs). Proves:
// Electrical → outlet boxes at receptacle height + a panel box + wires only between 1.5 and 8 ft; Water → floor pipes
// only; Duct → ceiling; the Y-FLIP puts a north-wall outlet at the FAR side of the walk; colours come from MEP_COLOR.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-walk-mep.test.mjs
import { walkMep } from "../lib/architect-walk-mep.ts";
import { MEP_COLOR, OUTLET_AFF_FT, STUB_AFF_FT } from "../lib/mep-runs.ts";
import { defaultObjectsForRoom } from "../lib/room-objects.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };
const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;
const ROOM_FT = 10;
const lineZs = (g) => g.lines.flat().map((p) => p[2]);

// ── Electrical: 6 outlets → 6 outlet boxes + 1 panel box; wires only z∈[1.5,8]; colour = MEP_COLOR.wiring ──
const w = walkMep("wiring", 6, []);
ok(w.color === MEP_COLOR.wiring, "wiring layer uses MEP_COLOR.wiring (one shared colour source)");
ok(w.boxes.filter((b) => b.kind === "outlet").length === 6, `6 outlets → 6 outlet boxes (got ${w.boxes.filter((b) => b.kind === "outlet").length})`);
ok(w.boxes.filter((b) => b.kind === "panel").length === 1, "exactly one service panel box");
ok(w.boxes.filter((b) => b.kind === "outlet").every((b) => near(b.z, OUTLET_AFF_FT)), `every outlet box sits at receptacle height (${OUTLET_AFF_FT} ft)`);
const zs = lineZs(w);
ok(zs.length > 0 && Math.min(...zs) >= OUTLET_AFF_FT - 1e-9 && Math.max(...zs) <= ROOM_FT + 1e-9, `wires run only between ${OUTLET_AFF_FT} and the 10-ft top plate (min ${Math.min(...zs)} · max ${Math.max(...zs)})`);

// ── the Y-FLIP — a north-wall outlet (plan gy 0) projects to the FAR half of the walk (world y near ROOM_FT) ──
ok(w.boxes.some((b) => b.kind === "outlet" && b.pts.some((p) => p[1] > ROOM_FT - 1.5)), "a north-wall outlet is Y-FLIPPED to the FAR side of the walk (not in front of the eye)");
// offset by a neighbour origin shifts the WHOLE layer +ROOM_FT in y, so a neighbour's wiring reads beyond the shared wall
const w0 = walkMep("wiring", 4, []);
const wN = walkMep("wiring", 4, [], 0, ROOM_FT);
const minY = (g) => Math.min(...g.lines.flat().map((p) => p[1]));
ok(near(minY(wN) - minY(w0), ROOM_FT), `a neighbour layer (oy = ROOM_FT) is shifted +${ROOM_FT} ft in y (reads beyond the shared wall)`);

// ── Water: floor pipes only, no boxes; colour cyan ──
const wa = walkMep("water", 0, defaultObjectsForRoom("B"));
ok(wa.color === MEP_COLOR.water, "water layer uses MEP_COLOR.water");
ok(wa.boxes.length === 0, "water draws no outlet/panel boxes");
ok(wa.lines.length > 0 && wa.lines.flat().every((p) => near(p[2], 0.3)), "water pipes run on the floor (z ≈ 0.3)");

// ── Duct: at the ceiling but BELOW the 8-ft slab (P0 fix — was 9.5, above the ceiling) ──
const du = walkMep("duct", 0, []);
ok(du.lines.length > 0 && du.lines.flat().every((p) => p[2] > 10.0 && p[2] <= 12.0), "ducts run in the PLENUM above the 10-ft inner ceiling (z ∈ (10, 12]) — the nested-cube shell");

// ══ P2 PLUMBING — valves, risers, hot-over-cold, traps, vents (ISA-flavoured glyphs, IRC placement) ════════════════════
const BATH = defaultObjectsForRoom("B"); // tub · shower · toilet · sink (+ shelving/mirror, not fixtures)
const wp = walkMep("water", 0, BATH);
const gk = (g, k) => g.glyphs.filter((x) => x.kind === k);
// 1 · one MAIN ball valve + one PEX manifold at the water source
ok(gk(wp, "valve").length === 1, `water draws exactly one MAIN ball valve (got ${gk(wp, "valve").length})`);
ok(gk(wp, "manifold").length === 1, `water draws exactly one PEX manifold (got ${gk(wp, "manifold").length})`);
// 2 · stops per kind — tub/shower get a mixing valve (0 stops), sink 2, toilet 1 → mixer 2 + stop 3
ok(gk(wp, "mixer").length === 2, `tub + shower each get a mixing valve (2 mixers, got ${gk(wp, "mixer").length})`);
ok(gk(wp, "stop").length === 3, `sink 2 + toilet 1 angle stops = 3 (got ${gk(wp, "stop").length})`);
// 3 · every angle stop sits at a real rough-in stub height
const stubVals = new Set(Object.values(STUB_AFF_FT));
ok(gk(wp, "stop").every((s) => stubVals.has(Number(s.at[2].toFixed(2)))), "every angle stop sits at a rough-in stub height (STUB_AFF_FT)");
// 4 · hot-over-cold — hot sublines exist for the non-toilet runs, and NEVER for a toilet-only room
const hot = wp.sublines.filter((s) => s.color === MEP_COLOR.hot);
ok(hot.length > 0, `hot (red) supply sublines exist for the non-toilet fixtures (${hot.length})`);
const toiletOnly = walkMep("water", 0, [{ kind: "toilet", gx: 5, gy: 5 }]);
ok(toiletOnly.sublines.filter((s) => s.color === MEP_COLOR.hot).length === 0, "a toilet has NO hot supply (0 hot sublines)");
// 5 · cold floor run is unchanged (Release Process #6) — the shipped `lines` still run at z 0.3
ok(wp.lines.length > 0 && wp.lines.flat().every((p) => near(p[2], 0.3)), "water cold floor runs stay at z 0.3 (shipped lines untouched)");

// ── SEWER: drains FALL to the SE stack; traps, vents, cleanout, vent-through-roof ──
const sp = walkMep("sewer", 0, BATH);
// every drain line falls (z non-increasing) and bottoms out near the stack datum 0.1
let allFall = true, bottomsOut = true;
for (const ln of sp.lines) { for (let i = 1; i < ln.length; i++) if (ln[i][2] > ln[i - 1][2] + 1e-9) allFall = false; if (Math.abs(ln[ln.length - 1][2] - 0.1) > 1e-6) bottomsOut = false; }
ok(allFall, "every sewer drain FALLS toward the stack (z strictly non-increasing — ¼″/ft slope)");
ok(bottomsOut, "every drain bottoms out at the stack datum z 0.1");
ok(gk(sp, "cleanout").length === 1, `exactly one cleanout at the stack base (got ${gk(sp, "cleanout").length})`);
ok(gk(sp, "vent").length === 1, `exactly one vent-through-roof terminal (VTR) (got ${gk(sp, "vent").length})`);
ok(gk(sp, "flange").length === 1, `the toilet drains through a closet flange, not a trap (${gk(sp, "flange").length})`);
// vent sublines rise to the 10-ft ceiling, dashed, in vent green
const vents = sp.sublines.filter((s) => s.color === MEP_COLOR.vent && s.dash);
ok(vents.length > 0 && vents.every((v) => v.pts.some((p) => near(p[2], 10, 1e-6))), "vents rise dashed to the 10-ft ceiling (vent-through-roof)");

// ── one shared colour source gains hot/vent/ductReturn (P2/P3) without disturbing the shipped keys ──
ok(MEP_COLOR.hot && MEP_COLOR.vent && MEP_COLOR.ductReturn, "MEP_COLOR gained hot + vent + ductReturn (one source)");
ok(MEP_COLOR.water === "#19c8cf" && MEP_COLOR.sewer === "#22c55e" && MEP_COLOR.wiring === "#ffd400" && MEP_COLOR.duct === "#38bdf8", "shipped MEP_COLOR keys are unchanged (Release Process #6)");

console.log(`\nARCHITECT-WALK-MEP ${pass}/${pass + fail} passed · wires+outlets+panel · floor pipes · Y-flip · shared MEP_COLOR · P2 valves/risers/hot/traps/vents`);
if (fail > 0) process.exit(1);
