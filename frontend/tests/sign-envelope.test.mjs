// Sign Doc — the pure envelope model: turn order, per-signer secrets, contacts, tokens, hashes.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/sign-envelope.test.mjs
import {
  secretFromLocation, MAX_ENVELOPE_BYTES,
  normalizeContact, contactMatches, contactKind, maskContact, whoseTurn, canSign, applySignature, partyIndex,
  randomToken, newToken, sha256Hex, shortHash, chainHash, signLink, recordLink, fileFromLocation, handoffMessage, newEnvelope, ENVELOPE_TTL_DAYS,
} from "../lib/sign-envelope.ts";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const file = (name, sha) => ({ name, page_count: 1, pdf_base64: "JVBERi0=", sha256: sha, version: 0 });

// contacts
ok(normalizeContact("  Alex@Example.COM ") === "alex@example.com", "email lower-cased + trimmed");
ok(normalizeContact("(512) 212-1250") === "5122121250", "phone → digits only");
ok(normalizeContact("+1 512 212 1250") === "15122121250", "no leading-1 guessing (Sofia)");
ok(contactMatches("Alex@x.com", "alex@X.COM"), "email match is case-insensitive");
ok(contactMatches("512-212-1250", "5122121250"), "phone match ignores punctuation");
ok(!contactMatches("", ""), "empty never matches");
ok(contactKind("a@b.c") === "email" && contactKind("555") === "phone" && contactKind("") === "", "contact kinds");
ok(maskContact("alex@example.com") === "al***@example.com" && maskContact("5122121250") === "***1250", "masks");

// envelope + turn order keyed by secret
const env = newEnvelope({ title: " Promissory Note ", created_by: "Alex@x.com", signers: [{ name: "Alex", contact: "alex@x.com" }, { name: "Danny", contact: "alex@x.com" }], files: [file("note.pdf", "aa"), file("addendum.pdf", "bb")] });
ok(env.title === "Promissory Note" && env.created_by === "alex@x.com" && env.status === "awaiting", "envelope built");
ok(env.signers[0].secret !== env.signers[1].secret && env.signers[0].secret.length === 22, "distinct 22-char secrets per signer");
ok(whoseTurn(env).name === "Alex", "first signer's turn");
const A = env.signers[0].secret, D = env.signers[1].secret;
ok(canSign(env, 0, A).ok === true, "Alex may sign with his secret");
ok(canSign(env, 1, D).ok === false && canSign(env, 1, D).reason === "not_your_turn", "Danny must wait (same contact does not help — Enki)");
ok(canSign(env, 0, D).ok === false && canSign(env, 0, D).reason === "bad_secret", "Danny cannot sign as Alex even on Alex's turn");
ok(canSign(env, 0, "").ok === false, "empty secret refused");
let threw = ""; try { applySignature(env, 0, A, "2026-09-07T00:00:00Z", [file("note.pdf", "aa2")], "c1"); } catch (e) { threw = e.message; }
ok(threw === "file_count_mismatch", "file count must match");
const e1 = applySignature(env, 0, A, "2026-09-07T00:00:00Z", [file("note.pdf", "aa2"), file("addendum.pdf", "bb2")], "chain1");
ok(e1.status === "awaiting" && e1.current_signer_idx === 1 && e1.signers[0].signed_at && !e1.signers[1].signed_at, "advanced to Danny");
ok(e1.files.every((f) => f.version === 1) && e1.chain === "chain1", "files versioned, chain recorded");
ok(canSign(e1, 0, A).ok === false && canSign(e1, 0, A).reason === "not_your_turn", "Alex cannot sign twice");
const e2 = applySignature(e1, 1, D, "2026-09-07T01:00:00Z", [file("note.pdf", "aa3"), file("addendum.pdf", "bb3")], "chain2");
ok(e2.status === "complete" && e2.files.every((f) => f.version === 2), "last signer completes");
ok(canSign(e2, 1, D).ok === false && canSign(e2, 1, D).reason === "complete", "complete envelope refuses");
ok(partyIndex(e2, D) === 1 && partyIndex(e2, "nope") === -1, "party lookup by secret");
const expired = { ...env, expires_at: "2000-01-01T00:00:00Z" };
ok(canSign(expired, 0, A).ok === false && canSign(expired, 0, A).reason === "expired", "expired envelope refuses");
ok(canSign({ ...env, status: "revoked" }, 0, A).reason === "revoked", "revoked envelope refuses");
ok(Math.round((Date.parse(env.expires_at) - Date.now()) / 86_400_000) === ENVELOPE_TTL_DAYS, "30-day expiry");

// tokens + hashes
const t = randomToken(new Uint8Array(16).fill(255)); ok(t.length === 22 && /^[A-Za-z0-9_-]+$/.test(t), "22-char base64url token");
ok(randomToken(new Uint8Array(16)) === "AAAAAAAAAAAAAAAAAAAAAA", "zero bytes → all A");
ok(newToken() !== newToken(), "fresh tokens differ");
const h = await sha256Hex(new TextEncoder().encode("abc"));
ok(h === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", "sha256 matches the known vector");
ok(shortHash(h) === "ba7816bf", "short hash = first 8");
ok((await chainHash("", ["aa"])) === (await chainHash("", ["aa"])) && (await chainHash("", ["aa"])) !== (await chainHash("x", ["aa"])), "chain hash stable and prefix-sensitive");

// hand-off
const link = signLink("https://exel.example", "tok", "sec");
ok(link === "https://exel.example/soi-session/sign/?e=tok#s=sec", "sign link: token in the query, secret in the fragment");
ok(handoffMessage("Alex", "Promissory Note", link).startsWith('Alex asks you to sign "Promissory Note"'), "hand-off names sender and document");

ok(secretFromLocation("?e=tok", "#s=sec") === "sec" && secretFromLocation("?e=tok&s=old", "") === "old" && secretFromLocation("?e=tok", "") === "", "secret read from the fragment, legacy query, or none");
// the saved link to ONE file (operator 2026-09-09): sha8 in the fragment, malformed keys ignored, the record link carries no secret
ok(signLink("https://exel.example", "tok", "sec", "ab12CD34") === "https://exel.example/soi-session/sign/?e=tok#s=sec&file=ab12cd34", "signLink with a file → &file=<sha8> in the fragment, lower-cased");
ok(signLink("https://exel.example", "tok", "sec", "not-a-hash") === link && signLink("https://exel.example", "tok", "sec", "") === link, "a malformed or empty file key adds nothing");
ok(fileFromLocation("#s=sec&file=AB12CD34") === "ab12cd34" && fileFromLocation("#s=sec") === "" && fileFromLocation("#s=sec&file=zz") === "" && fileFromLocation("") === "", "fileFromLocation reads only a valid sha8");
ok(recordLink("https://exel.example", "tok") === "https://exel.example/soi-session/sign/?e=tok" && !recordLink("https://exel.example", "tok").includes("#"), "recordLink has no fragment, no secret");
let big = ""; try { newEnvelope({ title: "x", created_by: "a@x.com", signers: [{ name: "A", contact: "a@x.com" }], files: [{ ...file("big.pdf", "aa"), pdf_base64: "A".repeat(MAX_ENVELOPE_BYTES * 4 / 3 + 10) }] }); } catch (e) { big = e.message; }
ok(big === "envelope_too_large", "aggregate envelope cap enforced in newEnvelope");
console.log(`sign-envelope: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
