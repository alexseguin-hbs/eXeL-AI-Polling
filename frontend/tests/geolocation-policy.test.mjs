// GEOLOCATION POLICY gate (R5, 2026-10-31 — operator: "ensure GPS WORKS AS WELL").
// ROOT CAUSE, on the record: public/_headers sent `Permissions-Policy: … geolocation=()` on `/*`, which DISABLES the
// Geolocation API for the whole origin — every 📍 tap failed instantly with code 1 and the "Location is blocked" text,
// on every phone, since the header shipped (eef4b4b9b), while the button code was right all along. The Worker copies
// asset headers unchanged for HTML (worker.js), so the header IS what the browser sees. The class fix: every
// Permissions-Policy this site sends (public/_headers · the Worker's SensorFusion override · the pod page) allows
// geolocation for the site itself — `geolocation=(self)` — and never `geolocation=()` again.
// Run: node tests/geolocation-policy.test.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };

const headers = fs.readFileSync(path.join(ROOT, "public/_headers"), "utf8");
const policies = [...headers.matchAll(/^\s*Permissions-Policy:\s*(.+)$/gm)].map((m) => m[1].trim());
ok(policies.length >= 1, `public/_headers declares at least one Permissions-Policy (${policies.length})`);
ok(policies.every((p) => /geolocation=\(self\)/.test(p)), "every Permissions-Policy in public/_headers allows geolocation for the site itself — geolocation=(self)");
ok(policies.every((p) => !/geolocation=\(\)/.test(p)), "no Permissions-Policy in public/_headers ever says geolocation=() (the root cause of 'Location is blocked')");
// the `/*` block (every page, incl. /Architect-2525/) — read as the block that follows the `/*` path line
const star = headers.split(/^\/\*\s*$/m)[1] ?? "";
ok(/Permissions-Policy:[^\n]*geolocation=\(self\)/.test(star), "the /* block (which covers /Architect-2525/ and the pod) carries geolocation=(self)");

const worker = fs.readFileSync(path.join(ROOT, "worker.js"), "utf8");
const wp = [...worker.matchAll(/"Permissions-Policy",\s*"([^"]+)"/g)].map((m) => m[1]);
ok(wp.length >= 1 && wp.every((p) => /geolocation=\(self\)/.test(p) && !/geolocation=\(\)/.test(p)), "every Permissions-Policy the Worker sets (SensorFusion override) allows geolocation=(self)");

// the button: synchronous getCurrentPosition in the tap (iOS requires the gesture), the denied copy tells the
// operator what to do on the phone, and the error is logged with its code/message (never swallowed).
const sky = fs.readFileSync(path.join(ROOT, "components/architect-2525/architect-skysun.tsx"), "utf8");
ok(/navigator\.geolocation\.getCurrentPosition\(/.test(sky), "the Site tab 📍 calls navigator.geolocation.getCurrentPosition");
ok(/isSecureContext/.test(sky), "the Site tab checks isSecureContext before asking (http → an honest message, not 'blocked')");
ok(/console\.warn\("\[gps\] fix refused:"/.test(sky), "a refused fix is logged with err.code + err.message (never a silent catch)");
ok(/Settings → Privacy & Security → Location Services → Safari/.test(sky), "the denied copy tells the operator the iPhone path to allow location, then tap 📍 again");
const pod = fs.readFileSync(path.join(ROOT, "app/soi-session/page.tsx"), "utf8");
ok(/console\.warn\("\[pod gps\] fix refused:"/.test(pod), "the pod's GPS error callback logs the refusal (was a silent () => {})");

console.log(`\nGEOLOCATION-POLICY ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
