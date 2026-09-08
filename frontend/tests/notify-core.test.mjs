// /api/notify — e-mail from eXeL: same-origin only, honest when unconfigured, link must be on-site, Resend call shape.
import { handleNotify } from "../notify-core.js";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const SITE = "https://exel-ai-polling.explore-096.workers.dev";
const req = (body, origin = SITE, method = "POST") => new Request(SITE + "/api/notify", { method, headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) }, body: method === "POST" ? JSON.stringify(body) : undefined });
const J = async (r) => ({ status: r.status, body: await r.json().catch(() => null) });
const good = { to: "daniel@example.test", sender: "Alex", title: "Note", link: SITE + "/soi-session/sign/?e=abc#s=def" };
let r = await J(await handleNotify(req(good), {})); ok(r.status === 200 && r.body.configured === false, "no key → {configured:false}");
r = await J(await handleNotify(req(good, null), { RESEND_API_KEY: "re_x", NOTIFY_FROM: "eXeL <sign@exel.test>" })); ok(r.status === 403, "no Origin → 403");
r = await J(await handleNotify(req(good, "https://evil.example"), { RESEND_API_KEY: "re_x", NOTIFY_FROM: "x" })); ok(r.status === 403, "cross-origin → 403");
r = await J(await handleNotify(req({ ...good, to: "not-an-email" }), { RESEND_API_KEY: "re_x", NOTIFY_FROM: "x" })); ok(r.status === 400, "bad address → 400");
r = await J(await handleNotify(req({ ...good, link: "https://evil.example/x" }), { RESEND_API_KEY: "re_x", NOTIFY_FROM: "x" })); ok(r.status === 400, "off-site link → 400");
const calls = []; globalThis.fetch = async (url, init) => { calls.push({ url, init }); return new Response(JSON.stringify({ id: "em_1" }), { status: 200, headers: { "Content-Type": "application/json" } }); };
r = await J(await handleNotify(req(good), { RESEND_API_KEY: "re_x", NOTIFY_FROM: "eXeL <sign@exel.test>" }));
ok(r.status === 200 && r.body.sent === true && r.body.id === "em_1", "configured → sent");
const sent = JSON.parse(calls[0].init.body);
ok(calls[0].url === "https://api.resend.com/emails" && calls[0].init.headers.Authorization === "Bearer re_x" && sent.to[0] === good.to && sent.from === "eXeL <sign@exel.test>" && /^Alex asks you to sign "Note" on eXeL AI Polling/.test(sent.text) && sent.subject === "Please sign: Note" && sent.text.includes(good.link), "Resend call carries from/to and a SERVER-composed subject + text (who · what · link)");
// the route is not a relay: a caller's own subject/text are ignored (fleet, Thor), and a second request for the same address within 20 s is throttled
{ const r2 = await J(await handleNotify(req({ ...good, to: "other@example.test", subject: "BUY NOW", text: "spam body" }), { RESEND_API_KEY: "re_x", NOTIFY_FROM: "eXeL <sign@exel.test>" })); const last = JSON.parse(calls[calls.length - 1].init.body);
  ok(r2.status === 200 && last.subject === "Please sign: Note" && !/spam|BUY/.test(last.text), "a caller's subject/text never reach the mail — the server composes it");
  const r3 = await J(await handleNotify(req({ ...good, to: "other@example.test" }), { RESEND_API_KEY: "re_x", NOTIFY_FROM: "x" })); ok(r3.status === 429, "the same address again within 20 s → 429"); }
globalThis.fetch = async () => new Response(JSON.stringify({ message: "Domain not verified" }), { status: 403, headers: { "Content-Type": "application/json" } });
r = await J(await handleNotify(req({ ...good, to: "third@example.test" }), { RESEND_API_KEY: "re_x", NOTIFY_FROM: "x" })); ok(r.status === 502 && /Domain/.test(r.body.error), "provider error surfaces");
console.log(`notify-core: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
