// Full-Embed Web Component — pure-core lock (origin normalization, src build, message trust).
// The custom-element half needs a browser; this exercises the security-critical pure core
// that decides which iframe src to load and which postMessage events to trust.
import assert from "node:assert";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const core = require("../public/embed/exel-polling.js");

let pass = 0;
const ok = (name, cond) => { assert.ok(cond, name); console.log("PASS " + name); pass++; };

// normalizeOrigin: full URL or bare origin → origin; junk → "".
ok("origin from full url", core.normalizeOrigin("https://x.workers.dev/session?code=1") === "https://x.workers.dev");
ok("origin from bare origin", core.normalizeOrigin("https://x.workers.dev") === "https://x.workers.dev");
ok("origin junk → empty", core.normalizeOrigin("not a url") === "");
ok("origin empty → empty", core.normalizeOrigin("") === "");

// buildSrc: requires host + code; encodes; adds embed=1.
const src = core.buildSrc("https://x.workers.dev", "DEMO2026", { theme: "sunset", lang: "es" });
ok("src targets host origin + /session", src.startsWith("https://x.workers.dev/session?"));
ok("src carries code", src.includes("code=DEMO2026"));
ok("src marks embed", src.includes("embed=1"));
ok("src carries theme + lang", src.includes("theme=sunset") && src.includes("lang=es"));
ok("src empty without code", core.buildSrc("https://x.workers.dev", "") === "");
ok("src empty without host", core.buildSrc("", "DEMO2026") === "");
ok("code is url-encoded", core.buildSrc("https://x.workers.dev", "a b&c").includes("code=a%20b%26c"));

// isTrustedMessage: origin-locked + envelope-marked + whitelisted type only.
const O = "https://x.workers.dev";
const good = { origin: O, data: { source: "exel-polling", type: "response", payload: { id: 1 } } };
ok("trusts our envelope from the right origin", core.isTrustedMessage(good, O) === true);
ok("rejects wrong origin (spoof)", core.isTrustedMessage({ ...good, origin: "https://evil.test" }, O) === false);
ok("rejects missing envelope marker", core.isTrustedMessage({ origin: O, data: { type: "response" } }, O) === false);
ok("rejects non-whitelisted type", core.isTrustedMessage({ origin: O, data: { source: "exel-polling", type: "steal-cookies" } }, O) === false);
ok("rejects non-object data", core.isTrustedMessage({ origin: O, data: "response" }, O) === false);
ok("rejects when no expected origin configured", core.isTrustedMessage(good, "") === false);

// Every advertised inbound event is whitelisted (no dead event names).
["ready", "response", "themes-ready", "ranking-complete", "resize", "error"].forEach((t) => {
  ok("inbound event whitelisted: " + t, core.INBOUND_EVENTS.includes(t));
});

console.log(`\nEMBED-WEB-COMPONENT ${pass}/${pass} passed`);
