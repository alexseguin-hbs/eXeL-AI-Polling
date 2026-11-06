// ARCHITECT-2525 · WALK MEP gate (operator 2026-11-06: "I can't see electrical when in that phase"). The walk and this
// gate read the SAME pure module (lib/architect-walk-mep.ts), which REUSES the 2D/3D run geometry (lib/mep-runs). Proves:
// Electrical → outlet boxes at receptacle height + a panel box + wires only between 1.5 and 8 ft; Water → floor pipes
// only; Duct → ceiling; the Y-FLIP puts a north-wall outlet at the FAR side of the walk; colours come from MEP_COLOR.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-walk-mep.test.mjs
import { walkMep } from "../lib/architect-walk-mep.ts";
import { MEP_COLOR, OUTLET_AFF_FT } from "../lib/mep-runs.ts";
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
ok(zs.length > 0 && Math.min(...zs) >= OUTLET_AFF_FT - 1e-9 && Math.max(...zs) <= 8 + 1e-9, `wires run only between ${OUTLET_AFF_FT} and 8 ft (min ${Math.min(...zs)} · max ${Math.max(...zs)})`);

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

// ── Duct: ceiling ──
const du = walkMep("duct", 0, []);
ok(du.lines.length > 0 && du.lines.flat().every((p) => p[2] > ROOM_FT - 1), "ducts run at the ceiling");

console.log(`\nARCHITECT-WALK-MEP ${pass}/${pass + fail} passed · wires+outlets+panel · floor pipes · Y-flip · shared MEP_COLOR`);
if (fail > 0) process.exit(1);
