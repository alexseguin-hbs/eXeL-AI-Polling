// ARCHITECT-2525 LAYER TREE integrity lock — LAYER_TREE is the single Vision-Tree that house/estimate/BOM/right-panel
// all read. Guards: unique node ids (no dup → no selection collisions), findLayer resolution, the 4 target markets +
// which are locked, and deterministic recommendPlacement. Run:
// node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-layers.test.mjs
import { LAYER_TREE, flattenLayers, childCount, findLayer, HOME_TYPES, UNLOCKED_MARKETS, isVisibleForType, recommendPlacement } from "../lib/architect-layers.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

// ── markets ──
ok(HOME_TYPES.length === 4, "4 target markets");
ok(JSON.stringify(HOME_TYPES.map((h) => h.id)) === JSON.stringify(["tiny", "full", "multifamily", "commercial"]), "market order tiny·full·multifamily·commercial");
ok(!HOME_TYPES[0].locked && !HOME_TYPES[1].locked, "tiny + full are unlocked (buildable today)");
ok(HOME_TYPES[2].locked === true && HOME_TYPES[3].locked === true, "multifamily + commercial locked (coming soon)");
ok(JSON.stringify(UNLOCKED_MARKETS) === JSON.stringify(["tiny", "full"]), "UNLOCKED_MARKETS = [tiny, full]");

// ── tree shape ──
ok(JSON.stringify(LAYER_TREE.map((s) => s.id)) === JSON.stringify(["physical", "operational", "lifecycle"]), "3 scopes: physical·operational·lifecycle");
const all = flattenLayers();
ok(all.length > 0, "flattenLayers returns the whole tree");
ok(all.every((n) => typeof n.id === "string" && n.id.length > 0 && typeof n.label === "string"), "every node has a string id + label");

// ── UNIQUE ids — the load-bearing integrity guard (selection keys off node.id) ──
const ids = all.map((n) => n.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
ok(dupes.length === 0, `no duplicate node ids (dupes: ${[...new Set(dupes)].slice(0, 5).join(", ")})`);

// ── findLayer resolution ──
const leaf = all.find((n) => !n.children?.length);
const found = findLayer(leaf.id);
ok(found !== null && found.node.id === leaf.id, "findLayer resolves a real leaf id");
ok(Array.isArray(found.path) && found.path[found.path.length - 1].id === leaf.id, "findLayer path ends at the node");
ok(!!found.scope && ["physical", "operational", "lifecycle"].includes(found.scope.id), "findLayer returns the owning scope");
ok(findLayer("bogus/nope") === null && findLayer("") === null, "findLayer(unknown/empty) → null");

// ── childCount ──
ok(childCount(LAYER_TREE[0]) === LAYER_TREE[0].children.length, "childCount = direct children");

// ── recommendPlacement — deterministic, returns valid tree ids ──
const hi = recommendPlacement("hi", "tiny");
const ai = recommendPlacement("ai", "tiny");
ok(Array.isArray(hi) && Array.isArray(ai), "recommendPlacement returns arrays for hi + ai");
ok(hi.every((id) => findLayer(id) !== null), "every hi recommendation is a real tree id");
ok(JSON.stringify(recommendPlacement("hi", "tiny")) === JSON.stringify(hi), "recommendPlacement is deterministic");

// ── isVisibleForType — deterministic ──
const scopeId = found.scope.id;
ok(isVisibleForType(leaf.id, scopeId, "full") === isVisibleForType(leaf.id, scopeId, "full"), "isVisibleForType deterministic");

console.log(`\nARCHITECT-LAYERS ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
