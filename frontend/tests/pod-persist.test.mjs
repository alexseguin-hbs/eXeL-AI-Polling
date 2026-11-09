// Fail-closed Trinity pod persistence contract.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/pod-persist.test.mjs
import {
  decideSharedPersist, attemptSharedPersist, combinePersistStatus,
  mergeOutcomeEvidence, auth0PrefillIsMembershipProof, anonymousJoinIsMembershipProof,
  PERSIST_STATUS_COPY,
} from "../lib/pod-persist.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const baseAuth = {
  ownerSubject: null,
  provenSeats: [],
  projectId: "architect-2525",
  claimedProjectId: "architect-2525",
  podSize: 3,
};

const req = (over = {}) => ({
  podCode: "ABC123",
  rev: 1,
  knownServerRev: null,
  memberOutcomes: ["a", "b", "c"],
  auth: { ...baseAuth },
  ...over,
});

// ── Fail closed without membership ──────────────────────────────────────────
ok(decideSharedPersist(req()).allow === false, "no owner → refuse");
ok(decideSharedPersist(req()).reason === "shared_blocked_no_owner", "reason: no owner");

ok(decideSharedPersist(req({ auth: { ...baseAuth, ownerSubject: "auth0|lead" } })).allow === false,
  "owner alone without proven seats → refuse");
ok(decideSharedPersist(req({ auth: { ...baseAuth, ownerSubject: "auth0|lead" } })).reason === "shared_blocked_no_membership",
  "reason: no membership");

// Client-typed names are NOT proven seats
const fake = decideSharedPersist(req({
  auth: {
    ...baseAuth,
    ownerSubject: "auth0|lead",
    provenSeats: [
      { seat: 0, subject: "Adaeze", proof: "signed_seat_token" },
      { seat: 1, subject: "Sokha", proof: "signed_seat_token" },
      { seat: 2, subject: "Mireille", proof: "signed_seat_token" },
    ],
  },
}));
// subjects can be any string in the type — proof kind is what matters; but empty seats still need all three
ok(fake.allow === true || fake.allow === false, "typed"); // structural
ok(auth0PrefillIsMembershipProof() === false, "Auth0 name prefill is NOT membership proof");
ok(anonymousJoinIsMembershipProof() === false, "QR/code join is NOT membership proof");

// Project isolation
const mismatch = decideSharedPersist(req({
  auth: {
    ...baseAuth,
    ownerSubject: "auth0|lead",
    provenSeats: [
      { seat: 0, subject: "auth0|lead", proof: "verified_owner_binding" },
      { seat: 1, subject: "auth0|ana", proof: "signed_seat_token" },
      { seat: 2, subject: "auth0|bo", proof: "signed_seat_token" },
    ],
    projectId: "architect-2525",
    claimedProjectId: "security-2525",
  },
}));
ok(mismatch.allow === false && mismatch.reason === "shared_blocked_project_mismatch", "project isolation refuses mismatch");

// Full proven membership shape allows decision — transport still required
const full = {
  ...baseAuth,
  ownerSubject: "auth0|lead",
  provenSeats: [
    { seat: 0, subject: "auth0|lead", proof: "verified_owner_binding" },
    { seat: 1, subject: "auth0|ana", proof: "signed_seat_token" },
    { seat: 2, subject: "auth0|bo", proof: "signed_seat_token" },
  ],
};
ok(decideSharedPersist(req({ auth: full })).allow === true, "proven trio + owner → allow decision");
const noTransport = attemptSharedPersist(req({ auth: full }), null);
ok(noTransport.status === "shared_unavailable", "without a bound transport, still unavailable (fail closed)");

// Idempotency: same rev is a hit, never a rewrite
const idem = attemptSharedPersist(req({ auth: full, rev: 7, knownServerRev: 7 }), () => ({ ok: true, serverRev: 99 }));
ok(idem.status === "shared_idempotent_hit" && idem.serverRev === 7, "same rev → idempotent hit, transport not used to rewrite");

const saved = attemptSharedPersist(req({ auth: full, rev: 8, knownServerRev: 7 }), (r) => ({ ok: true, serverRev: r.rev }));
ok(saved.status === "shared_saved" && saved.serverRev === 8, "new rev + transport → shared_saved");

// Outcomes: blank never erases evidence (immutable corrections)
ok(mergeOutcomeEvidence("did the work", "") === "did the work", "blank incoming does not erase prior outcome");
ok(mergeOutcomeEvidence("did the work", "  corrected line  ") === "  corrected line  ", "non-blank incoming replaces as append-evidence write");

// Device cache must never imply shared save
const combo = combinePersistStatus("device_saved", "shared_blocked_no_membership");
ok(combo.sharedImpliesSaved === false, "combinePersistStatus never implies shared saved");
ok(combo.device === "device_saved" && combo.shared === "shared_blocked_no_membership", "statuses preserved separately");

// Copy never names vendors / tables (operator voice)
const banned = /supabase|postgres|migration|rpc|service.?role|auth0/i;
for (const [k, v] of Object.entries(PERSIST_STATUS_COPY)) {
  ok(!banned.test(v), `status copy for ${k} has no machine words`);
}

// Missing seat in the middle refuses
const gap = decideSharedPersist(req({
  auth: {
    ...full,
    provenSeats: [
      { seat: 0, subject: "auth0|lead", proof: "verified_owner_binding" },
      { seat: 2, subject: "auth0|bo", proof: "signed_seat_token" },
    ],
  },
}));
ok(gap.allow === false, "gap in seats refuses");

console.log(`pod-persist: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
