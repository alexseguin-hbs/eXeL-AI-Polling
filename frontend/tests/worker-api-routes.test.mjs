// Gate: every /api/* path the app calls is answered by the worker, never by the SPA fallback.
//
// This site deploys as Workers Static Assets: functions/ never runs. A route missing from worker.js
// falls through to env.ASSETS → index.html with a 200, so the caller gets HTML where it expected JSON.
// That silently killed /api/donate once, and until 2026-10-07 also /api/responses (Trinity Path C),
// /api/sessions, /api/drone-link and /api/geo. This gate (1) finds every `/api/<name>` the app calls,
// (2) drives worker.js with a fake ASSETS that returns the HTML fallback, and (3) fails if any of them
// comes back as that HTML.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("FAIL", m); } };

// 1 · every /api/<name> the shipped code calls (the FastAPI /api/v1 prefix is the backend's, not the worker's)
const called = new Set();
const walk = (d) => {
  for (const n of readdirSync(d)) {
    if (n === "node_modules" || n.startsWith(".")) continue;
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?)$/.test(n)) {
      if (p.includes(join("app", "api", "page.tsx"))) continue; // documentation samples, not calls
      for (const m of readFileSync(p, "utf8").matchAll(/["'`]\/api\/([a-z0-9_-]+)/g)) {
        if (m[1] !== "v1") called.add("/api/" + m[1]);
      }
    }
  }
};
for (const d of ["app", "components", "lib"]) walk(join(ROOT, d));
ok(called.size >= 8, `found the app's /api routes (${[...called].sort().join(" ")})`);

// 2 · a Worker-shaped environment: caches.default in memory, ASSETS = the SPA fallback
const store = new Map();
globalThis.caches = {
  default: {
    async match(k) { const r = store.get(typeof k === "string" ? k : k.url); return r ? r.clone() : undefined; },
    async put(k, r) { store.set(typeof k === "string" ? k : k.url, r.clone()); },
    async delete(k) { return store.delete(typeof k === "string" ? k : k.url); },
  },
};
const HTML = "<!doctype html><html><body>index</body></html>";
const env = { ASSETS: { fetch: async () => new Response(HTML, { status: 200, headers: { "content-type": "text/html" } }) } };
const { default: worker } = await import(join(ROOT, "worker.js"));
const call = (path, init) => worker.fetch(new Request("https://site.test" + path, init), env);

// 3 · each called route answers from the worker
const probe = {
  "/api/responses": "/api/responses?session=ABCD1234",
  "/api/sessions": "/api/sessions?code=ABCD1234",
  "/api/drone-link": "/api/drone-link?code=ABCD12",
  "/api/geo": "/api/geo",
  "/api/tmp": "/api/tmp",
  "/api/ai": "/api/ai",
  "/api/notify": "/api/notify",
  "/api/donate": "/api/donate",
};
for (const route of [...called].sort()) {
  const r = await call(probe[route] || route, { method: "GET" });
  const body = await r.text();
  ok(body !== HTML, `${route} is answered by the worker, not index.html (got ${r.status})`);
}

// 4 · Trinity Path C round-trip: a POSTed response comes back on GET for its session
{
  const post = await call("/api/responses", {
    method: "POST",
    headers: { "content-type": "application/json" },
    // the exact body components/session-view.tsx sends on Path C
    body: JSON.stringify({ short_code: "abcd1234", text: "Path C reaches the moderator", participant_id: "p-1", language_code: "en" }),
  });
  ok(post.status === 201, `POST /api/responses stores (got ${post.status} ${await post.clone().text()})`);
  const get = await call("/api/responses?session=ABCD1234", { method: "GET" });
  const got = await get.json();
  ok(get.status === 200 && got.total === 1 && got.items[0].clean_text === "Path C reaches the moderator",
    `GET /api/responses returns the stored response (${JSON.stringify(got).slice(0, 120)})`);
}

// 5 · /api/geo answers JSON and refuses writes
{
  const g = await call("/api/geo", { method: "GET", headers: { "cf-ipcountry": "US" } });
  ok((g.headers.get("content-type") || "").includes("application/json"), "/api/geo is JSON");
  ok((await g.json()).country === "US", "/api/geo reads the country");
  const p = await call("/api/geo", { method: "POST" });
  ok(p.status === 405, `/api/geo POST is 405 (got ${p.status})`);
}

// 6 · HP-11: /api/sessions writes need the session's write key (only a count rise is open)
{
  const post = (body, key) => call("/api/sessions", {
    method: "POST",
    headers: { "content-type": "application/json", ...(key ? { "x-session-key": key } : {}) },
    body: JSON.stringify(body),
  });
  const get = async () => (await call("/api/sessions?code=HP11CODE", { method: "GET" })).json();

  // a bare count bump never creates a session (nor claims its key)
  const squat = await post({ short_code: "hp11code", participant_count: 5 });
  ok(squat.status === 404, `a count-only POST does not create a session (got ${squat.status})`);

  const created = await post({ short_code: "hp11code", title: "Real title", status: "open", question_text: "Q?", participant_count: 1 });
  const c = await created.json();
  ok(created.status === 201 && typeof c.write_key === "string" && c.write_key.length >= 32,
    `create returns the write key once (got ${created.status})`);
  ok(!("write_key_hash" in c), "create never returns the hash");
  const key = c.write_key;

  let g = await get();
  ok(!("write_key_hash" in g) && !("write_key" in g), `GET never returns the key or its hash (${Object.keys(g).join(",")})`);
  const stored = [...store.values()].length; // the Cache API fallback (no KV binding in this env)
  ok(stored > 0, "the session is stored");

  for (const [field, value] of [["title", "HIJACKED"], ["status", "closed"], ["question_text", "pwned?"], ["ai_provider", "grok"]]) {
    const r = await post({ short_code: "hp11code", [field]: value });
    ok(r.status === 403, `an overwrite of ${field} without the key is refused (got ${r.status})`);
  }
  const wrong = await post({ short_code: "hp11code", title: "HIJACKED" }, "0".repeat(64));
  ok(wrong.status === 403, `a wrong key is refused (got ${wrong.status})`);
  g = await get();
  ok(g.title === "Real title" && g.status === "open" && g.question_text === "Q?", `nothing was overwritten (${JSON.stringify(g).slice(0, 120)})`);

  const bump = await post({ short_code: "hp11code", participant_count: 7 });
  ok(bump.status === 201 && (await get()).participant_count === 7, `a participant_count increase without the key lands (got ${bump.status})`);
  await post({ short_code: "hp11code", participant_count: 3 });
  ok((await get()).participant_count === 7, "the count never goes down");

  const keyed = await post({ short_code: "hp11code", title: "Renamed", status: "polling", question_text: "Q2?", participant_count: 7 }, key);
  ok(keyed.status === 201, `with the key the change succeeds (got ${keyed.status})`);
  const viaBody = await post({ short_code: "hp11code", title: "Renamed again", status: "polling", participant_count: 7, write_key: key });
  ok(viaBody.status === 201, `the key is accepted as a body field too (got ${viaBody.status})`);
  g = await get();
  ok(g.title === "Renamed again" && g.status === "polling" && !("write_key_hash" in g), `the keyed change is stored, hash still hidden`);

  // the hash is a SHA-256 of the key, never the key itself
  const raw = [...store.entries()].find(([k]) => k.includes("HP11CODE"));
  const rawText = raw ? await raw[1].clone().text() : "";
  ok(rawText.includes("write_key_hash") && !rawText.includes(key), "only the key's hash is stored");

  // the client sends the key it was given (mock-data.ts syncSessionToKV)
  const md = readFileSync(join(ROOT, "lib", "mock-data.ts"), "utf8");
  ok(md.includes('headers["X-Session-Key"] = key') && md.includes("rememberSessionWriteKey(session.short_code, out.write_key)"),
    "mock-data.ts stores the create key and sends it on settings changes");
}

// 7 · non-API paths still reach the assets
{
  const r = await call("/financial-2525", { method: "GET" });
  ok((await r.text()) === HTML, "a page path still serves the asset");
}

console.log(`worker-api-routes: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
