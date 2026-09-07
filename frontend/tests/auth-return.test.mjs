// Login return — a same-origin path survives the Auth0 round trip; anything else falls back.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/auth-return.test.mjs
import { resolveReturnTo, stashReturnTo, takeReturnTo, DEFAULT_RETURN } from "../lib/auth-return.ts";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
ok(resolveReturnTo("/soi-session/sign/?e=abc&s=def") === "/soi-session/sign/?e=abc&s=def", "same-origin path with query kept verbatim");
ok(resolveReturnTo(undefined) === DEFAULT_RETURN, "undefined → workspace");
ok(resolveReturnTo("") === DEFAULT_RETURN, "empty → workspace");
ok(resolveReturnTo("https://evil.example/x") === DEFAULT_RETURN, "absolute URL refused");
ok(resolveReturnTo("//evil.example/x") === DEFAULT_RETURN, "protocol-relative refused");
ok(resolveReturnTo("/ok/path?u=http://x") === DEFAULT_RETURN, "embedded scheme refused");
ok(resolveReturnTo("/a b") === DEFAULT_RETURN, "whitespace refused");
ok(resolveReturnTo("javascript:alert(1)") === DEFAULT_RETURN, "javascript: refused");
ok(resolveReturnTo(undefined, "/here/") === "/here/", "custom fallback honoured");
// storage round trip with a minimal sessionStorage shim
const store = new Map();
globalThis.sessionStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
stashReturnTo("/soi-session/sign/?e=t1&s=s1"); ok(takeReturnTo() === "/soi-session/sign/?e=t1&s=s1", "stash → take returns the path");
ok(takeReturnTo() === DEFAULT_RETURN, "take is read-once");
stashReturnTo("https://evil.example/"); ok(takeReturnTo() === DEFAULT_RETURN, "stash refuses off-site");
console.log(`auth-return: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
