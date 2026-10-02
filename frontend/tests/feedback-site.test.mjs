// feedback-site — every sub-site's feedback is logged as its own (operator 2026-10-02, addendum 128: "ensure feedback when operation
// Financial-2525 goes and gets logged for Financial-2525 · same holds true with eXeL Polling and other sub sites").
import { readFileSync } from "node:fs";
import { feedbackSite } from "../lib/feedback-screen.ts";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL: " + m); } };
const cases = [
  ["/financial-2525/", "financial-2525"], ["/main/Financial-2525", "financial-2525"], ["/drone-2525", "drone-2525"], ["/main/Drone-2525/", "drone-2525"],
  ["/main/Security-2525/", "security-2525"], ["/Architect-2525", "architect-2525"], ["/main/Celestial-2525", "celestial-2525"], ["/SoI-2525/", "soi-2525"],
  ["/innovation", "innovation"], ["/vision-2525/MoT", "vision-2525"], ["/divinity-guide-trinity", "other"], ["/divinity-guide", "divinity-guide"],
  ["/dashboard", "dashboard"], ["/session", "polling"], ["/join", "join"], ["/sim", "sim"], ["/", "landing"], ["/somewhere-new", "other"],
];
for (const [path, screen] of cases) ok(feedbackSite(path).screen === screen, `${path} → ${screen} (got ${feedbackSite(path).screen})`);
ok(feedbackSite("/financial-2525").site === "Financial-2525" && feedbackSite("/dashboard").site === "eXeL AI Polling", "the site name travels with the tag");
const w = readFileSync(new URL("../components/feedback-widget.tsx", import.meta.url), "utf8");
const p = readFileSync(new URL("../components/providers.tsx", import.meta.url), "utf8");
ok(/supabase\.from\("product_feedback"\)\.insert\(row\)/.test(w), "the widget WRITES the row to the product_feedback table (the static site has no server behind POST /feedback)");
ok(/screen: where\.screen/.test(w) && /const where = feedbackSite\(/.test(w), "the row's screen is the sub-site it came from");
ok(/Site: \$\{where\.site\}/.test(w), "the context line names the site in words");
ok(/if \(!logged\) await api\.post\("\/feedback", row\)/.test(w), "a live backend is the fallback, and a failure still says so (never a silent success)");
ok(/const screen = feedbackSite\(path\)\.screen/.test(p) && !/: "other";/.test(p), "the site footer reads the one table — no hand-written route chain left");
console.log(`\nfeedback-site: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
