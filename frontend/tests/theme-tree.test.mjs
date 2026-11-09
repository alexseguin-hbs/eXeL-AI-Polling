// t182 (2026-11-09): strict theme tree layout — fixed level-3 slots, children split inside them, fallback.
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/theme-tree.test.mjs
import { readFileSync } from "node:fs";
const { buildTreeLayout, slotPosition, slotColor } = await import("../lib/theme-tree.ts");
const { adaptLiveThemes } = await import("../lib/adapt-live-themes.ts");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const T = (id, parentId, count = 5) => ({ id, parentId, label: id, count, avgConfidence: 80, summary33: "" });
const L3 = [T("A"), T("B"), T("C")];
const L6 = [T("a1", "A"), T("a2", "A", 9), T("b1", "B"), T("b2", "B"), T("c1", "C"), T("c2", "C")];
const L9 = ["A", "B", "C"].flatMap((p) => [1, 2, 3].map((k) => T(`${p.toLowerCase()}9${k}`, p, k)));

const l3 = buildTreeLayout(L3, L3, 3);
ok(l3 && l3.length === 3 && l3.every((b, i) => b.slot === i), "level 3: one bubble per fixed slot");
const l6 = buildTreeLayout(L3, L6, 6, [...L3, ...L6]);
ok(l6 && l6.length === 6, "level 6: 6 bubbles");
ok(l6 && [0, 1, 2].every((s) => l6.filter((b) => b.slot === s).length === 2), "level 6: exactly 2 per parent slot");
ok(l6 && l6.filter((b) => b.slot === 0)[0].theme.id === "a2", "children ordered by count inside the slot");
const l9 = buildTreeLayout(L3, L9, 9, [...L3, ...L9]);
ok(l9 && [0, 1, 2].every((s) => l9.filter((b) => b.slot === s).length === 3), "level 9: exactly 3 per parent slot");
// children stay in their parent's sector: closer to their own slot than to any other slot
const dist = (p, q) => Math.hypot(p.cx - q.cx, p.cy - q.cy);
ok(l9.every((b) => [0, 1, 2].every((s) => s === b.slot || dist(b.pos, slotPosition(b.slot)) < dist(b.pos, slotPosition(s)))), "children sit in their parent's sector");
// no overlaps at any level
for (const [n, lay] of [[6, l6], [9, l9]]) {
  let overlap = false;
  for (let i = 0; i < lay.length; i++) for (let j = i + 1; j < lay.length; j++)
    if (dist(lay[i].pos, lay[j].pos) < lay[i].pos.r + lay[j].pos.r - 0.5) overlap = true;
  ok(!overlap, `level ${n}: bubbles do not overlap`);
}
// level 9 via a level-6 parent chain resolves to the level-3 root
const L9via6 = [T("x", "a1"), T("y", "a2"), T("z", "b1")];
const chain = buildTreeLayout(L3, L9via6, 9, [...L3, ...L6, ...L9via6]);
ok(chain && chain.find((b) => b.theme.id === "x").slot === 0 && chain.find((b) => b.theme.id === "z").slot === 1, "parent chain 9→6→3 resolves");
// fallbacks
ok(buildTreeLayout(L3, [T("q")], 6) === null, "missing parent_id → null (free layout)");
ok(buildTreeLayout(L3, [T("q", "nope")], 6) === null, "unknown parent → null");
ok(buildTreeLayout(L3.map(({ id, ...r }) => r), L6, 6) === null, "parents without ids → null");
ok(/^hsl\(/.test(slotColor("#FF0000", 0)) && slotColor("#FF0000", 0) !== slotColor("#FF0000", 2), "distinct fixed colour per slot");
ok(/^hsla\(.*0\.2\)$/.test(slotColor("#10B981", 1, 0.2)), "fill variant carries alpha");

const rows = [
  { id: "p", label: "Risk & Concerns", summary: "", confidence: 0.9, response_count: 4, theme01_category: "risk", theme_level: null, parent_theme_id: null },
  { id: "c3", label: "Privacy", summary: "", confidence: 0.8, response_count: 4, theme01_category: "risk", theme_level: "3", parent_theme_id: "p" },
  { id: "c6", label: "Cameras", summary: "", confidence: 0.8, response_count: 4, theme01_category: "risk", theme_level: "6", parent_theme_id: "p", parent_id: "c3" },
];
const ad = adaptLiveThemes("s", rows).theme2["Risk & Concerns"];
ok(ad.level3[0].id === "c3" && ad.level6[0].parentId === "c3", "adapter carries id + parent_id");

const fv = readFileSync(new URL("../components/flower-of-life/flower-visualization.tsx", import.meta.url), "utf8");
ok(/buildTreeLayout\(/.test(fv) && /<SplitBubble/.test(fv) && /!treeLayout && currentTheme2Themes\.map/.test(fv), "tree layout wired with free-layout fallback");
ok(/prefers-reduced-motion/.test(fv), "split animation respects reduced motion");
console.log(`theme-tree: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
