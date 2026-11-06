// ROOM ICONOLOGY — the no-overlap gate (operator 2026-11-06, with a phone shot of the room view: "standardize the
// element iconology so NOTHING overlaps"). The render (room-designer.tsx) and this gate read the SAME pure source,
// lib/room-chrome.ts, so the no-overlap truth cannot drift. For EVERY element of EVERY decided layout AND every room's
// fallback default, selecting it must put its NAME BADGE on a side with 0 overlap against any OTHER element's footprint,
// and keep the badge + the drag GRIP fully inside the room walls (viewBox 1..99).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/room-iconology.test.mjs
import { STANDARD_LAYOUTS, defaultObjectsForRoom } from "../lib/room-objects.ts";
import { TINY_ROOM_LAYOUT } from "../lib/room-layout.ts";
import { chromeFor, badgeRect, footprintRect, rectsOverlap } from "../lib/room-chrome.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };

// the badge box, and the grip's 2.3×3.3 handle box, must sit fully inside the walls (viewBox 1..99)
const insideWalls = (r) => r.x1 >= 1 - 1e-6 && r.y1 >= 1 - 1e-6 && r.x2 <= 99 + 1e-6 && r.y2 <= 99 + 1e-6;
const gripBox = (g) => ({ x1: g.x - 1.15, y1: g.y - 1.65, x2: g.x + 1.15, y2: g.y + 1.65 });

function auditLayout(name, objs) {
  for (const sel of objs) {
    const ch = chromeFor(sel, objs);
    const br = badgeRect(ch);
    // 0 overlaps with any OTHER element's footprint
    const clash = objs.filter((o) => o.id !== sel.id).find((o) => rectsOverlap(br, footprintRect(o)));
    ok(!clash, `${name}: the "${ch.name}" badge clears every neighbour (hit ${clash ? clash.kind : ""})`);
    ok(insideWalls(br), `${name}: the "${ch.name}" badge stays inside the walls (x ${br.x1.toFixed(1)}–${br.x2.toFixed(1)} · y ${br.y1.toFixed(1)}–${br.y2.toFixed(1)})`);
    ok(insideWalls(gripBox(ch.grip)), `${name}: the "${ch.name}" grip stays inside the walls`);
  }
}

// 1. every DECIDED standard layout (the ones a bedroom etc. opens with)
for (const [k, objs] of Object.entries(STANDARD_LAYOUTS)) auditLayout(`STANDARD_LAYOUTS.${k}`, objs);

// 2. every canonical room's FALLBACK default (the packer output when there is no decided layout)
for (const cell of TINY_ROOM_LAYOUT) auditLayout(`default(${cell.k})`, defaultObjectsForRoom(cell.k));

// 3. determinism — same inputs → same chrome (replay law)
{
  const objs = defaultObjectsForRoom("M");
  const a = JSON.stringify(objs.map((o) => chromeFor(o, objs)));
  const b = JSON.stringify(objs.map((o) => chromeFor(o, objs)));
  ok(a === b, "chromeFor is deterministic (same layout → same chrome)");
}

console.log(`\nROOM-ICONOLOGY ${pass}/${pass + fail} passed · 0 badge overlaps on the standard + fallback layouts`);
if (fail > 0) process.exit(1);
