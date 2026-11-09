// VIEW-ENTITLEMENT lock — 333 / Original unlock comes from the server's webhook-confirmed entitlement, fails closed,
// and drill-down rows never surface a tier the server withheld (null → empty).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/view-entitlement.test.mjs
import { LOCKED, normalizeEntitlement, drilldownToThemedResponses, drilldownPath, categoryForTheme1 } from "../lib/view-entitlement.ts";
import fs from "node:fs";

let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log(c ? "PASS" : "FAIL", m); };

ok(LOCKED.summary_333 === false && LOCKED.original === false, "LOCKED locks both paid views");
for (const bad of [null, undefined, "x", 42, [], { summary_333: "true", original: 1 }]) {
  const e = normalizeEntitlement(bad);
  ok(e.summary_333 === false && e.original === false, `fails closed on ${JSON.stringify(bad)}`);
}
const e = normalizeEntitlement({ viewer: "creator", basis: "poll_payment_confirmed", confirmed_paid_cents: 1111, summary_333: true, original: true });
ok(e.summary_333 && e.original && e.viewer === "creator" && e.thresholds.original_cents === 1111, "confirmed payment → both unlocked");
const ladder = normalizeEntitlement({ viewer: "participant", confirmed_paid_cents: 999, summary_333: true, original: false });
ok(ladder.summary_333 && !ladder.original, "ladder can unlock 333 without Original");

const raw = { entitlement: { summary_333: false, original: false }, items: [
  { id: "r1", participant_ref: "ab12cd34", theme01: "Risk & Concerns", theme01_confidence: 0.8, theme2_3: "Cost", theme2_6: "Cost A", theme2_9: "Cost A1",
    confidence: 0.9, summary_33: "s33", summary_111: "s111", summary_333: null, original: null },
] };
const out = drilldownToThemedResponses(raw);
ok(out.items.length === 1 && out.items[0].summary33 === "s33" && out.items[0].summary111 === "s111", "33 / 111 always mapped");
ok(out.items[0].summary333 === "" && out.items[0].rawText === "", "withheld 333 / Original stay empty");
ok(out.items[0].theme2Confidence === 90 && out.items[0].theme1Confidence === 80, "confidence normalized to percent");
ok(out.entitlement.summary_333 === false, "entitlement carried from the response");
ok(drilldownToThemedResponses(null).items.length === 0, "bad body → no rows");

ok(categoryForTheme1("Supporting Comments") === "support" && categoryForTheme1(null) === undefined, "Theme01 label → category");
const p = drilldownPath("sid-1", 6, "Cost & Time", "Risk & Concerns");
ok(p.startsWith("/sessions/sid-1/drilldown?") && p.includes("level=6") && p.includes("category=risk") && p.includes("theme=Cost+%26+Time"), "drill-down path encodes level/theme/category");

// Wiring locks: the dashboard no longer derives unlock from the creation tier, and expanding never bypasses Original.
const dash = fs.readFileSync(new URL("../app/dashboard/page.tsx", import.meta.url), "utf8");
ok(!/isPaidTier=\{session\.pricing_tier !== "free"\}/.test(dash) && /useViewEntitlement\(session\.id/.test(dash), "dashboard unlock comes from server entitlement");
const drawer = fs.readFileSync(new URL("../components/flower-of-life/response-drawer.tsx", import.meta.url), "utf8");
ok(!/\{isExpanded \? r\.rawText : getSummaryText\(r\)\}/.test(drawer) && /isExpanded && canOriginal/.test(drawer), "expand shows Original only when unlocked");

console.log(`view-entitlement: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
