// feedback-2525 — the operator's feedback reader (addendum 132: "supabase is repo of feedback; accessible by Easter egg unlock in admin
// console: Feedback-2525"). The reader is admin-only, reads through key-guarded database functions, and no key ever enters the repo.
import { readFileSync } from "node:fs";
import { feedbackCsv, feedbackError, siteName } from "../lib/feedback-2525.ts";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL: " + m); } };
const row = { id: "1", screen: "financial-2525", category: "bug", feedback_text: 'said "hi", then left\nline 2', device_type: "mobile", language_code: "en", is_resolved: false, created_at: "2026-10-02T03:00:00Z" };
const csv = feedbackCsv([row]);
ok(csv.split("\n")[0] === "created_at,site,screen,category,device,language,resolved,feedback", "CSV header");
ok(csv.includes('"Financial-2525"') && csv.includes('"said ""hi"", then left\nline 2"'), "CSV names the site and quotes text with quotes and newlines");
ok(siteName("financial-2525") === "Financial-2525" && siteName("drone-2525") === "Drone-2525" && siteName("dashboard") === "eXeL AI Polling", "the console names every sub-site from the one table");
ok(feedbackError("feedback: key not accepted") === "Key not accepted.", "a wrong key is said plainly");
ok(/migration 039/.test(feedbackError("Could not find the function public.product_feedback_list")), "a missing database update is said plainly");
const sim = readFileSync(new URL("../app/sim/page.tsx", import.meta.url), "utf8");
ok(/\{isAdmin && \(\s*<Button[^\n]*setView\("feedback"\)[^\n]*data-sim-feedback-tab>\s*Feedback-2525/.test(sim) && /\{view === "feedback" && isAdmin && <Feedback2525 \/>\}/.test(sim), "Feedback-2525 is a tab of the easter-egg admin console, shown and rendered only for the admin unlock");
const comp = readFileSync(new URL("../components/feedback-2525.tsx", import.meta.url), "utf8");
ok(/supabase\.rpc\("product_feedback_list"/.test(comp) && /supabase\.rpc\("product_feedback_resolve"/.test(comp) && !/from\("product_feedback"\)\.select/.test(comp), "the console reads only through the guarded functions — never a direct table read");
const mig = readFileSync(new URL("../../supabase/migrations/039_feedback_2525.sql", import.meta.url), "utf8");
ok(/REVOKE ALL ON TABLE feedback_admin_keys FROM anon, authenticated/.test(mig) && /SECURITY DEFINER/.test(mig) && /RAISE EXCEPTION 'feedback: key not accepted'/.test(mig) && /key_hash ~ '\^\[0-9a-f\]\{64\}\$'/.test(mig), "039: hashes only, no public table access, every read refuses without a key on file");
ok(!/GRANT[^;]*feedback_admin_ok/.test(mig), "039: the key check itself is not callable from outside");
const wf = readFileSync(new URL("../../.github/workflows/feedback-admin-key.yml", import.meta.url), "utf8");
ok(/key_hash:/.test(wf) && !/\bkey:\s*\n/.test(wf) && /\^\[0-9a-f\]\{64\}\$/.test(wf), "the key workflow receives only the hash, never the key");
console.log(`\nfeedback-2525: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
