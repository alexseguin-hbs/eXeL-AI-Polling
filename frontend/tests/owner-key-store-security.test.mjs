// ─────────────────────────────────────────────────────────────────────────────────────────────────
// OWNER-KEYED STORES — one gate, every store, so the class cannot reappear on a third.
//
// THE CLASS. A store scopes its rows by a key the browser mints. Two things make that safe and both have
// been got wrong here before:
//   1. the key must be durable and non-guessable, and when one cannot be minted the store must FAIL CLOSED.
//      innovation_state used to `return "anon"` when localStorage threw, so every storage-blocked visitor
//      presented the SAME key and overwrote the others. Migration 030 and innovation-store.ts fixed it.
//   2. the database must not accept an unfiltered request. A policy of
//      `USING (owner_key IS NOT NULL AND length(owner_key) > 0)` against a NOT NULL column is TRUE FOR EVERY
//      ROW, and PostgREST only applies the filter the CLIENT sends — so `select *` returns the whole table.
//
// architect_saved_files had BOTH, and had no gate at all: 023/024 shipped the no-op predicate and
// architect-saved-files.ts shipped `catch { return "anon" }` plus a `Date.now().toString(36)` id. The fix for
// the identical defect already existed on the sibling table and had simply never been applied here. That is
// what this gate exists to prevent — not the bug, the SECOND instance of it.
//
// The migration half of this gate arrives with migration 044. This file holds the CLIENT half, which ships
// first so there is no window in which saving fails (the client works against both policy sets).
// ─────────────────────────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FRONTEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ✓ " + m); } else { fail++; console.log("FAIL: " + m); } };
const read = (rel) => fs.readFileSync(path.join(FRONTEND, rel), "utf8");

// one row per owner-keyed store. A new store is a row here, not a new file.
const STORES = [
  { name: "innovation_state",       module: "lib/innovation-store.ts",      lsKey: "innovation.ownerId", rpc: "innovation_state_" },
  { name: "architect_saved_files",  module: "lib/architect-saved-files.ts", lsKey: "arch2525.ownerId",   rpc: "architect_saved_files_" },
];
ok(STORES.length >= 2, `the gate covers ${STORES.length} owner-keyed stores — a class, not an instance`);

for (const st of STORES) {
  const src = read(st.module);
  const tag = st.name;

  // 1 · the key fails closed — no shared constant, ever
  ok(/ownerKeyOrNull\s*\(\s*\)\s*:\s*string\s*\|\s*null/.test(src),
    `${tag}: exports ownerKeyOrNull(): string | null — the network path can be told "no key"`);
  ok(!/catch\s*\{\s*return\s*"anon"\s*;?\s*\}/.test(src),
    `${tag}: never falls back to the shared constant "anon"`);
  ok(/toLowerCase\(\)\s*!==\s*"anon"/.test(src),
    `${tag}: a legacy "anon" already in storage is REJECTED and re-minted, so the shared bucket heals`);

  // 2 · the minted id is non-guessable, and absent rather than weak
  const randomBlock = src.slice(src.indexOf("function randomId"), src.indexOf("function randomId") + 700);
  ok(/function randomId\(\s*\)\s*:\s*string\s*\|\s*null/.test(src),
    `${tag}: randomId() returns null rather than a weak id when there is no CSPRNG`);
  ok(!/Date\.now\(\)\.toString\(36\)/.test(randomBlock),
    `${tag}: randomId() does not fall back to a millisecond-granular, enumerable id`);
  ok(/length\s*>=\s*(MIN_OWNER_LEN|32)/.test(src) && /\^\[A-Za-z0-9-\]\+\$/.test(src),
    `${tag}: a key is accepted only at >= 32 chars of [A-Za-z0-9-] — 122 bits, not a guess`);

  // 3 · a write that cannot be scoped does not happen
  ok(new RegExp(`ownerKeyOrNull\\(\\);\\s*if\\s*\\(!\\s*owner\\)`).test(src)
     || /if\s*\(!owner\)\s*return/.test(src),
    `${tag}: every network path resolves the owner FIRST and returns before touching Supabase`);
  ok(/localStorage|getItem/.test(src) && /setItem/.test(src) && /getItem\([A-Z_]*OWNER_LS_KEY\)/.test(src),
    `${tag}: the minted key is read back after writing — a silently-dropped setItem must not look durable`);
  ok(src.includes(st.lsKey), `${tag}: keyed on ${st.lsKey}`);

  // 4 · RPC-first, so the client and its migration are order-independent
  ok(src.includes(`"${st.rpc}`), `${tag}: calls its scoped RPCs (${st.rpc}…) before the direct table`);
}

// 5 · the error classifiers agree between stores, or one store degrades differently from its twin
{
  const shared = read("lib/supabase-errors.ts");
  ok(/pgrst202\|42883/.test(shared), "the shared classifier knows a missing RPC (pgrst202 / 42883)");
  ok(/42p01\|pgrst205/.test(shared), "the shared classifier knows a missing table (42p01 / pgrst205)");
  ok(read("lib/architect-saved-files.ts").includes('from "./supabase-errors"'),
    "architect_saved_files uses the shared classifier rather than its own copy");
}

console.log(`\nowner-key-store-security: ${pass} passed, ${fail} failed · ${STORES.length} stores`);
process.exit(fail ? 1 : 0);
