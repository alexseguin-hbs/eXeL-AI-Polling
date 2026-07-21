// ADAPT-LIVE-THEMES lock — backend GET /sessions/{id}/themes rows → SessionThemeData.
// Guarantees real polling results map into the 3 Theme01 buckets × 3/6/9 Theme02
// geometry, and that an unthemed session yields totalResponses 0 (caller shows a
// placeholder, NOT the seeded 5,000-response mock).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/adapt-live-themes.test.mjs
import { adaptLiveThemes, THEME01_LABELS } from "../lib/adapt-live-themes.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log(c ? "PASS" : "FAIL", m); };

// ── Empty input → totalResponses 0, geometry padded to 3/6/9 ──
const empty = adaptLiveThemes("s1", []);
ok(empty.totalResponses === 0, "no rows → totalResponses 0 (placeholder, not mock)");
ok(
  THEME01_LABELS.every(
    (l) => empty.theme2[l].level3.length === 3 && empty.theme2[l].level6.length === 6 && empty.theme2[l].level9.length === 9,
  ),
  "empty → every bucket padded to 3/6/9 slots",
);
ok(THEME01_LABELS.every((l) => empty.theme2[l].level9.every((t) => t.isEmpty)), "empty padded slots flagged isEmpty");

// ── Real rows: parents set counts + confidence (0-1 and 0-100 both normalize to %) ──
const rows = [
  { id: "p1", label: "Risk & Concerns", summary: "risk agg", confidence: 0.84, response_count: 6, theme01_category: "risk", theme_level: null, parent_theme_id: null },
  { id: "p2", label: "Supporting Comments", summary: "sup agg", confidence: 91, response_count: 3, theme01_category: "support", theme_level: null, parent_theme_id: null },
  { id: "c1", label: "Mobile UX", summary: "mobile", confidence: 0.7, response_count: 4, theme01_category: "risk", theme_level: "3", parent_theme_id: "p1" },
  { id: "c2", label: "API access", summary: "api", confidence: 0.6, response_count: 2, theme01_category: "risk", theme_level: "9", parent_theme_id: "p1" },
];
const d = adaptLiveThemes("s2", rows);
ok(d.theme1["Risk & Concerns"].count === 6 && d.theme1["Risk & Concerns"].avgConfidence === 84, "risk parent → count 6, conf 84% (0-1 normalized)");
ok(d.theme1["Supporting Comments"].avgConfidence === 91, "support parent → conf 91% (0-100 passthrough)");
ok(d.totalResponses === 9, "totalResponses = sum of parent counts (6+3+0)");
ok(d.theme2["Risk & Concerns"].level3[0].label === "Mobile UX" && d.theme2["Risk & Concerns"].level3[0].count === 4, "child level3 → risk bucket");
ok(d.theme2["Risk & Concerns"].level9.some((t) => t.label === "API access"), "child level9 → risk bucket");
ok(d.theme2["Risk & Concerns"].level3.length === 3, "risk level3 padded to 3 with 1 real theme");
ok(d.theme1["Neutral Comments"].count === 0 && d.theme1["Neutral Comments"].isEmpty === true, "unseen bucket (neutral) → count 0, isEmpty");

console.log(`\nADAPT-LIVE-THEMES ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
