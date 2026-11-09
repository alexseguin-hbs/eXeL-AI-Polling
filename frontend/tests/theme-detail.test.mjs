// t181 (2026-11-09): theme detail sheet + description list — pure helpers and wiring.
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/theme-detail.test.mjs
import { readFileSync } from "node:fs";
const { descriptionState, firstLine, DESCRIPTION_WORDS } = await import("../lib/theme-detail.ts");
const { adaptLiveThemes } = await import("../lib/adapt-live-themes.ts");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

ok(DESCRIPTION_WORDS[9] === 111 && DESCRIPTION_WORDS[6] === 222 && DESCRIPTION_WORDS[3] === 333, "111/222/333 at 9/6/3");
ok(descriptionState({}, true) === "hidden", "no field yet → block hidden");
ok(descriptionState({ description: "Text." }, false) === "locked", "unpaid → locked, never the text");
ok(descriptionState({ description: "Text." }, true) === "text", "paid → text");
ok(descriptionState({ description: null }, true) === "unavailable", "sent but empty → unavailable");
ok(firstLine("First sentence here. Second one.") === "First sentence here.", "first sentence");
ok(firstLine("x".repeat(300)).length === 140, "long line truncated to 140");
ok(firstLine("") === "", "empty");

const base = { id: "p", label: "Risk & Concerns", summary: "s", confidence: 0.9, response_count: 4, theme01_category: "risk", theme_level: null, parent_theme_id: null };
const child = { id: "c", label: "Privacy", summary: "s33", confidence: 0.8, response_count: 4, theme01_category: "risk", theme_level: "3", parent_theme_id: "p" };
const noField = adaptLiveThemes("s", [base, child]).theme2["Risk & Concerns"].level3[0];
ok(!("description" in noField), "adapter: no description key when the API has none");
const withField = adaptLiveThemes("s", [base, { ...child, description: "Long text." }]).theme2["Risk & Concerns"].level3[0];
ok(withField.description === "Long text.", "adapter passes description through");

const fv = readFileSync(new URL("../components/flower-of-life/flower-visualization.tsx", import.meta.url), "utf8");
ok(/<ThemeDetailSheet/.test(fv) && /<ThemeDescriptionList/.test(fv), "sheet + list wired into the flower view");
ok(/compact=\{isPortrait\}/.test(fv), "bubbles switch to compact text at phone width");
const sheet = readFileSync(new URL("../components/flower-of-life/theme-detail-sheet.tsx", import.meta.url), "utf8");
ok(/sm:w-\[420px\]/.test(sheet) && /bottom-0/.test(sheet), "bottom sheet on mobile, side panel on desktop");
ok(!/>[A-Z][a-z]+ [a-z]+</.test(sheet), "no hard-coded English JSX text in the sheet");
console.log(`theme-detail: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
