// SoI-2525 durable store — SECURITY LOCKS (adversarial audit fixes 1-3 + Thor 3c).
//
// Locks, in order:
//   1 · RLS actually authorises      — migration 030 shape: no `length(owner_key) > 0` no-op policy, no anon
//                                      table policy, anon grants revoked, RPC-only access keyed by an exact
//                                      owner key, `user_id`/`created_at` present for the org cutover.
//   2 · ownerKey() fails closed      — never the shared constant "anon", never a millisecond-granular id;
//                                      cloudEnabled() reports false when no durable key can be minted, and
//                                      every store entry point short-circuits before touching the network.
//   3 · lossy writes are visible     — scrubReport() sees truncation / redaction / silently-dropped fields.
//   4 · no image PII mirror          — lib/image-library.ts no longer writes to the shared table.
//
// Optional live probe (opt-in): set RLS_PROBE_URL + RLS_PROBE_ANON_KEY to prove against the real database
// that `select *` returns nothing, and that a cross-owner read and a cross-owner delete are both denied.
//
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/innovation-store-security.test.mjs

import fs from "node:fs";
import path from "node:path";

// A syntactically valid but unroutable Supabase env, so `supabase` is non-null and the "short-circuits
// BEFORE any network call" locks are meaningful. Nothing below ever reaches the wire.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= "https://locks.invalid";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= "test-anon-key";

const ROOT = path.resolve(import.meta.dirname, "..");
const REPO = path.resolve(ROOT, "..");
const read = (p) => fs.readFileSync(path.resolve(REPO, p), "utf8");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const store = await import("../lib/innovation-store.ts");
const { ownerKey, ownerKeyOrNull, cloudEnabled, saveState, loadState, loadAllState, deleteState, scrubReport, REDACT_MAX, MATERIAL_LOSS_CHARS } = store;

// ── harness ──────────────────────────────────────────────────────────────────────────────────────────
function fakeLS(initial = {}, opts = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => { if (opts.throwOnGet) throw new Error("blocked"); return m.has(k) ? m.get(k) : null; },
    setItem: (k, v) => { if (opts.throwOnSet) throw new Error("blocked"); if (!opts.dropWrites) m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
    _map: m,
  };
}
async function withLS(descriptor, fn) {
  const had = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, ...descriptor });
  try { return await fn(); }
  finally {
    if (had) Object.defineProperty(globalThis, "localStorage", had);
    else delete globalThis.localStorage;
  }
}
const withValue = (v, fn) => withLS({ value: v, writable: true }, fn);
const noStorage = (fn) => withLS({ value: undefined, writable: true }, fn);

// Same shape guard the database enforces in innovation_state_owner_ok() (migration 030).
const dbOwnerOk = (v) =>
  typeof v === "string" && v.length >= 32 && v.length <= 64 && /^[A-Za-z0-9-]+$/.test(v) && v.toLowerCase() !== "anon";

// ══ 2 · ownerKey / cloudEnabled fail closed ══════════════════════════════════════════════════════════
await noStorage(() => {
  ok(ownerKeyOrNull() === null, "no localStorage ⇒ ownerKeyOrNull() is null (no shared bucket)");
  ok(cloudEnabled() === false, "no durable key ⇒ cloudEnabled() is false even with a Supabase client");
});

await withLS({ get() { throw new Error("Lockdown Mode"); } }, () => {
  ok(ownerKeyOrNull() === null, "localStorage access that THROWS ⇒ null, not \"anon\"");
});

await withValue(fakeLS({}, { throwOnGet: true }), () => {
  ok(ownerKeyOrNull() === null, "getItem() that throws ⇒ null");
});
await withValue(fakeLS({}, { throwOnSet: true }), () => {
  ok(ownerKeyOrNull() === null, "setItem() that throws ⇒ null (Safari Private Browsing)");
});
await withValue(fakeLS({}, { dropWrites: true }), () => {
  ok(ownerKeyOrNull() === null, "silently-dropped writes ⇒ null (a non-durable key is not a key)");
});

await withValue(fakeLS(), () => {
  const k = ownerKeyOrNull();
  ok(typeof k === "string" && dbOwnerOk(k), `working storage mints a DB-acceptable key (${k})`);
  ok(ownerKeyOrNull() === k, "the minted key is persisted and stable across calls");
});

// The exact live defect: a legacy shared "anon" already in localStorage must never be honoured.
await withValue(fakeLS({ "innovation.ownerId": "anon" }), () => {
  const k = ownerKeyOrNull();
  ok(k !== "anon", "a legacy \"anon\" owner id is rejected, not reused");
  ok(dbOwnerOk(k), "…and is re-minted as a real 128-bit key (the shared bucket self-heals)");
});
// The old crypto-less fallback ("own-" + Date.now().toString(36)) was enumerable — also rejected.
await withValue(fakeLS({ "innovation.ownerId": "own-" + Date.now().toString(36) }), () => {
  const k = ownerKeyOrNull();
  ok(!k.startsWith("own-"), "a legacy millisecond-granular \"own-…\" id is rejected");
  ok(dbOwnerOk(k), "…and re-minted from the CSPRNG");
});

// No CSPRNG ⇒ fail closed rather than mint a guessable durable key.
{
  const cd = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  Object.defineProperty(globalThis, "crypto", { value: undefined, configurable: true, writable: true });
  await withValue(fakeLS(), () => {
    ok(ownerKeyOrNull() === null, "no crypto ⇒ ownerKeyOrNull() is null (never mints a guessable key)");
  });
  if (cd) Object.defineProperty(globalThis, "crypto", cd);
  ok(!!globalThis.crypto, "crypto global restored for the remaining locks");
}

// The total ownerKey() shim (page.tsx's `me`) must still never hand back a shared constant.
await noStorage(() => {
  const a = ownerKey(), b = ownerKey();
  ok(a !== "anon" && b !== "anon", "ownerKey() never returns the shared constant \"anon\"");
  ok(a === b, "ownerKey() is stable within a page load (UI identity does not flicker)");
  ok(a.startsWith("local-only:"), "the fallback identity is explicitly marked local-only");
  ok(!dbOwnerOk(a), "the local-only identity is REJECTED by the database owner guard — it can never scope a row");
});

// Every entry point short-circuits before the network when there is no durable key.
await noStorage(async () => {
  ok(await saveState("config", { a: 1 }) === "offline", "saveState() ⇒ offline with no durable key (no shared write)");
  ok(await loadState("config") === null, "loadState() ⇒ null with no durable key");
  ok(Object.keys(await loadAllState(["config"])).length === 0, "loadAllState() ⇒ {} with no durable key");
  ok(await deleteState("config") === "offline", "deleteState() ⇒ offline with no durable key");
});

// ══ 3 · lossy writes are visible ═════════════════════════════════════════════════════════════════════
ok(REDACT_MAX === 4000, "REDACT_MAX mirrors redactSecrets()'s cap");
{
  const dataSrc = read("frontend/lib/innovation-data.ts");
  const m = /export function redactSecrets\(s: string, max = (\d+)\)/.exec(dataSrc);
  ok(!!m && Number(m[1]) === REDACT_MAX, "REDACT_MAX is still in sync with innovation-data.ts redactSecrets()");
}
{
  const long = "x".repeat(REDACT_MAX + 500);
  const r = scrubReport({ note: long }, { note: long.slice(0, REDACT_MAX) });
  ok(r.truncatedFields === 1, "scrubReport detects a string truncated at the cap");
  ok(r.lostChars === 500, "scrubReport counts the exact characters lost");
  ok(r.lossy === true, "truncation ⇒ lossy");
}
{
  const r = scrubReport({ k: "token abc" }, { k: "token [redacted]" });
  ok(r.redactedFields === 1 && r.truncatedFields === 0, "a plain redaction is reported as redaction, not truncation");
  ok(r.lossy === false, "a small redaction is not flagged lossy (no false alarms on idle saves)");
}
{
  const big = "s".repeat(MATERIAL_LOSS_CHARS + 10);
  const r = scrubReport({ k: big }, { k: "" });
  ok(r.lossy === true, `a shrink of >= ${MATERIAL_LOSS_CHARS} chars is flagged lossy even without truncation`);
}
{
  // Thor 3d — scrubDeep's `const out = {}` silently drops an own "__proto__" key. scrubReport sees it.
  const raw = JSON.parse('{"__proto__":"' + "y".repeat(MATERIAL_LOSS_CHARS + 1) + '"}');
  const r = scrubReport(raw, {});
  ok(r.lossy === true, "a field silently dropped by the scrubber (own \"__proto__\") is reported, not swallowed");
}
{
  const same = { a: "hello", b: [1, 2, { c: "world" }] };
  const r = scrubReport(same, JSON.parse(JSON.stringify(same)));
  ok(r.lostChars === 0 && r.lossy === false && r.rawChars === r.safeChars, "an unchanged payload reports zero loss");
}
{
  const src = read("frontend/lib/innovation-store.ts");
  ok(/"saved-lossy"/.test(src) && /saved-lossy/.test(src.slice(src.indexOf("export type CloudStatus"), src.indexOf("export type CloudStatus") + 200)),
     "CloudStatus carries a distinct saved-lossy state — the caller is told, not left guessing");
  ok(/console\.warn\(/.test(src), "a lossy cloud write also logs — it is never swallowed");
}

// ══ 1 · migration 030 — RLS that actually authorises ═════════════════════════════════════════════════
const MIG = "supabase/migrations/030_innovation_state_rls_hardening.sql";
ok(fs.existsSync(path.resolve(REPO, MIG)), `${MIG} exists (history is superseded, not rewritten)`);
{
  const sql = read(MIG);
  ok(!/length\(owner_key\)\s*>\s*0/.test(sql), "030 contains no `length(owner_key) > 0` no-op authorisation");
  for (const p of ["Owners read innovation state", "Owners insert innovation state", "Owners update innovation state", "Owners delete innovation state"]) {
    ok(sql.includes(`DROP POLICY IF EXISTS "${p}"`), `030 drops the no-op policy "${p}"`);
  }
  // `select *` with no filter must return nothing for the public anon key: no anon policy + no anon grants.
  const policies = sql.match(/CREATE POLICY[\s\S]*?;/g) ?? [];
  ok(policies.length === 1, "030 leaves exactly one direct-table policy");
  ok(!/CREATE POLICY[\s\S]*?TO[^\n]*\banon\b/.test(sql), "no policy grants the anon role direct table access ⇒ bare `select *` matches zero rows");
  ok(/TO authenticated/.test(policies[0]) && /user_id = auth\.uid\(\)/.test(policies[0]),
     "the one policy keys rows to auth.uid(), not to a not-null check");
  ok(/USING\s*\(user_id IS NOT NULL AND user_id = auth\.uid\(\)\)/.test(sql),
     "an authenticated `select *` returns only rows that user has claimed — never another owner's");
  ok(/REVOKE ALL ON TABLE innovation_state FROM anon/.test(sql), "anon's table grants are revoked outright (defence in depth)");
  ok(/ALTER TABLE innovation_state ENABLE ROW LEVEL SECURITY/.test(sql), "RLS stays enabled");

  // Org-cutover columns the future migration cannot retrofit.
  ok(/ADD COLUMN IF NOT EXISTS user_id\s+UUID REFERENCES auth\.users\(id\)/.test(sql), "030 adds nullable user_id UUID REFERENCES auth.users");
  ok(/ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now\(\)/.test(sql), "030 adds created_at");

  // The only anon path in: exact-key RPCs. No enumeration, no wildcard.
  const FNS = ["innovation_state_get", "innovation_state_list", "innovation_state_put", "innovation_state_del"];
  for (const f of FNS) {
    const body = sql.slice(sql.indexOf(`CREATE OR REPLACE FUNCTION ${f}(`));
    ok(sql.includes(`CREATE OR REPLACE FUNCTION ${f}(`), `030 defines ${f}()`);
    ok(/SECURITY DEFINER/.test(body.slice(0, 400)), `${f}() is SECURITY DEFINER`);
    ok(/SET search_path = public, pg_temp/.test(body.slice(0, 400)), `${f}() pins search_path (no hijack)`);
    ok(/innovation_state_owner_ok\(p_owner\)/.test(body.slice(0, 900)), `${f}() rejects a malformed / guessed owner key up front`);
    ok(/owner_key = p_owner/.test(body.slice(0, 2400)), `${f}() scopes by an EXACT owner_key equality — cross-owner access is not reachable`);
    ok(new RegExp(`GRANT EXECUTE ON FUNCTION ${f}\\(`).test(sql), `${f}() is granted to anon, authenticated`);
  }
  // Cross-owner read / delete: the read paths additionally refuse a row claimed by another account.
  const getBody = sql.slice(sql.indexOf("FUNCTION innovation_state_get("), sql.indexOf("FUNCTION innovation_state_list("));
  ok(/user_id IS NULL OR s\.user_id = auth\.uid\(\)/.test(getBody), "cross-owner read denied: a claimed row is invisible to any other account");
  const delBody = sql.slice(sql.indexOf("FUNCTION innovation_state_del("));
  ok(/user_id IS NULL OR s\.user_id = auth\.uid\(\)/.test(delBody), "cross-owner delete denied: a claimed row cannot be deleted by another account");
  const putBody = sql.slice(sql.indexOf("FUNCTION innovation_state_put("), sql.indexOf("FUNCTION innovation_state_del("));
  ok(/claimed by another account/.test(putBody), "put() refuses to overwrite a row claimed by another auth.uid()");
  ok(/pg_column_size\(p_payload\) > \d+/.test(putBody), "put() caps payload size (one anon key cannot bloat the table)");

  // The owner-key shape guard.
  const guard = sql.slice(sql.indexOf("FUNCTION innovation_state_owner_ok("), sql.indexOf("CREATE OR REPLACE FUNCTION innovation_state_get("));
  ok(/length\(p_owner\) >= 32/.test(guard), "owner guard demands >= 32 chars (a UUID/hex, not a guess)");
  ok(/lower\(p_owner\) <> 'anon'/.test(guard), "owner guard bans the legacy shared 'anon' key outright");

  ok(/DELETE FROM innovation_state WHERE owner_key = 'anon'/.test(sql), "030 removes the shared-bucket rows the old client bug created");
}

// The store must go through the RPCs, and must never issue an unscoped table query.
{
  const src = read("frontend/lib/innovation-store.ts");
  ok(!/return "anon"/.test(src) && !/'anon'/.test(src.replace(/\/\*[\s\S]*?\*\//g, "")), "the store no longer contains an \"anon\" fallback");
  ok(!/Date\.now\(\)\.toString\(36\)/.test(src.slice(src.indexOf("function randomId"), src.indexOf("export function cloudEnabled"))),
     "randomId() no longer falls back to a millisecond-granular id");
  ok(/return null;\s*\n\}/.test(src.slice(src.indexOf("function randomId"))), "randomId() fails closed with null");
  for (const fn of ["saveState", "loadState", "loadAllState", "deleteState"]) {
    const body = src.slice(src.indexOf(`export async function ${fn}`));
    ok(/const owner = ownerKeyOrNull\(\);/.test(body.slice(0, 400)) && /if \(!owner\) return/.test(body.slice(0, 500)),
       `${fn}() resolves a durable owner key and bails before any network call`);
  }
  for (const rpc of ["innovation_state_get", "innovation_state_list", "innovation_state_put", "innovation_state_del"]) {
    ok(src.includes(`"${rpc}"`), `the store calls ${rpc}() (RPC-first, table only as the pre-030 fallback)`);
  }
  // Every legacy direct-table query still carries the owner filter.
  const froms = [...src.matchAll(/\.from\(TABLE\)/g)].map((m) => src.slice(m.index, m.index + 260));
  ok(froms.length > 0 && froms.every((s) => /owner_key/.test(s)), "every direct-table fallback query is owner-scoped");
  ok(/ownerKeyOrNull\(\) !== null/.test(src.slice(src.indexOf("export function cloudEnabled"), src.indexOf("export function cloudEnabled") + 220)),
     "cloudEnabled() is false when no durable key can be minted");
}

// ══ 4 · Thor 3c — no image/PII mirror to the shared table ════════════════════════════════════════════
{
  const img = read("frontend/lib/image-library.ts");
  ok(!/saveState/.test(img), "image-library.ts no longer mirrors base64 images + uploader names to the shared table");
  ok(/deleteState\("image-library"\)/.test(img), "…and purges the rows the old write-only mirror already left behind");
  const page = read("frontend/app/innovation/page.tsx");
  ok(!/"image-library"/.test(page), "nothing hydrates the image-library namespace — removing the mirror loses no consumer");
}

// ══ optional · live probe against the real database ══════════════════════════════════════════════════
const PROBE_URL = process.env.RLS_PROBE_URL, PROBE_KEY = process.env.RLS_PROBE_ANON_KEY;
if (PROBE_URL && PROBE_KEY) {
  const H = { apikey: PROBE_KEY, Authorization: `Bearer ${PROBE_KEY}`, "Content-Type": "application/json" };
  const rest = (p, init = {}) => fetch(`${PROBE_URL.replace(/\/$/, "")}/rest/v1/${p}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
  const mine = globalThis.crypto.randomUUID(), theirs = globalThis.crypto.randomUUID();
  await rest("rpc/innovation_state_put", { method: "POST", body: JSON.stringify({ p_owner: theirs, p_name: "probe", p_payload: { s: 1 } }) });
  const dump = await rest("innovation_state?select=*");
  const rows = dump.ok ? await dump.json() : [];
  ok(!dump.ok || rows.length === 0, "LIVE · `select *` with no owner filter returns nothing to the anon key");
  const cross = await (await rest("rpc/innovation_state_get", { method: "POST", body: JSON.stringify({ p_owner: mine, p_name: "probe" }) })).json();
  ok(cross === null, "LIVE · cross-owner read denied (another owner's key returns nothing)");
  const del = await (await rest("rpc/innovation_state_del", { method: "POST", body: JSON.stringify({ p_owner: mine, p_name: "probe" }) })).json();
  ok(del === 0, "LIVE · cross-owner delete denied (zero rows removed)");
  await rest("rpc/innovation_state_del", { method: "POST", body: JSON.stringify({ p_owner: theirs, p_name: "probe" }) });
} else {
  console.log("  (live RLS probe skipped — set RLS_PROBE_URL + RLS_PROBE_ANON_KEY to run it against the database)");
}

console.log(`\nINNOVATION-STORE-SECURITY ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
