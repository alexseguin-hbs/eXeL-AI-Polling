// CRS-09 / CRS-39: collected rows → ThemedResponse for ResponseDrawer tabs
import assert from "node:assert/strict";
const { adaptCollectedResponses, withCollectedResponses, adaptLiveThemes } = await import("../lib/adapt-live-themes.ts");

const items = [
  {
    response_id: "r1",
    user: "User_0001",
    detailed_results: "original long text here",
    summary_33: "thirty three words summary",
    summary_111: "one hundred eleven words summary",
    summary_333: "three hundred thirty three words summary",
    theme01: "Risk & Concerns",
    theme01_confidence: 0.9,
    theme2_3: "Safety & Control",
    theme2_3_confidence: 0.85,
    theme2_6: "Surveillance Risks",
    theme2_9: "Opacity Issues",
  },
  {
    response_id: "r2",
    user: "Anon",
    detailed_results: "skip me",
    theme01: "Not A Real Label",
    summary_33: "x",
  },
];

const themed = adaptCollectedResponses(items);
assert.equal(themed.length, 1, "only Theme01-labeled rows map");
assert.equal(themed[0].summary33, "thirty three words summary");
assert.equal(themed[0].summary111, "one hundred eleven words summary");
assert.equal(themed[0].summary333, "three hundred thirty three words summary");
assert.equal(themed[0].rawText, "original long text here");
assert.equal(themed[0].theme2_3, "Safety & Control");

const base = adaptLiveThemes("s1", [
  { id: "r", label: "Risk & Concerns", summary: "short", confidence: 0.8, response_count: 1, theme01_category: "risk", theme_level: null, parent_theme_id: null },
]);
const merged = withCollectedResponses(base, items);
assert.equal(merged.responses.length, 1);
assert.equal(merged.theme1["Risk & Concerns"].count, 1);
console.log("adapt-collected-responses: OK");
