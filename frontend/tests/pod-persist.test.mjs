/**
 * Fail-closed shared persist contract + lexicon key wiring for /soi-session.
 * Run: node --experimental-strip-types tests/pod-persist.test.mjs
 */
import {
  decideSharedPersist,
  attemptSharedPersist,
  combinePersistStatus,
  mergeOutcomeEvidence,
  auth0PrefillIsMembershipProof,
  anonymousJoinIsMembershipProof,
  PERSIST_STATUS_KEYS,
} from "../lib/pod-persist.ts";
import { DEFAULT_ENGLISH_TRANSLATIONS } from "../lib/lexicon-data.ts";

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) {
    passed++;
    console.log(`  ok — ${msg}`);
  } else {
    failed++;
    console.error(`  FAIL — ${msg}`);
  }
}

function req(over = {}) {
  return {
    podCode: "ABC123",
    rev: 1,
    knownServerRev: null,
    memberOutcomes: ["", "", ""],
    auth: {
      ownerSubject: null,
      provenSeats: [],
      projectId: null,
      claimedProjectId: null,
      podSize: 3,
      ...((over.auth) || {}),
    },
    ...over,
  };
}

console.log("decideSharedPersist — refuse without membership");
ok(decideSharedPersist(req()).allow === false, "no owner → refuse");
ok(decideSharedPersist(req()).reason === "shared_blocked_no_owner", "reason no owner");
ok(
  decideSharedPersist(
    req({ auth: { ownerSubject: "lead@x", provenSeats: [], projectId: null, claimedProjectId: null, podSize: 3 } }),
  ).reason === "shared_blocked_no_membership",
  "owner alone without seats → no membership",
);

const seats = [0, 1, 2].map((seat) => ({
  seat,
  subject: `u${seat}`,
  proof: "signed_seat_token",
}));
ok(
  decideSharedPersist(
    req({
      auth: {
        ownerSubject: "lead@x",
        provenSeats: seats,
        projectId: "p1",
        claimedProjectId: "p2",
        podSize: 3,
      },
    }),
  ).reason === "shared_blocked_project_mismatch",
  "project mismatch → refuse",
);

const full = req({
  auth: {
    ownerSubject: "lead@x",
    provenSeats: seats,
    projectId: "p1",
    claimedProjectId: "p1",
    podSize: 3,
  },
});
ok(decideSharedPersist(full).allow === true, "full proven seats → allow");

console.log("attemptSharedPersist — no transport stays unavailable even when authorized");
ok(attemptSharedPersist(full, null).status === "shared_unavailable", "authorized + no transport → unavailable");
ok(
  attemptSharedPersist(full, () => ({ ok: true, serverRev: 1 })).status === "shared_saved",
  "authorized + transport ok → shared_saved",
);
ok(
  attemptSharedPersist({ ...full, knownServerRev: 1, rev: 1 }, () => ({ ok: true, serverRev: 1 })).status ===
    "shared_idempotent_hit",
  "same rev → idempotent hit",
);

console.log("combine / merge / membership proofs");
ok(combinePersistStatus("device_saved", "shared_unavailable").sharedImpliesSaved === false, "device save never implies shared");
ok(mergeOutcomeEvidence("old", "") === "old", "empty incoming keeps prior");
ok(mergeOutcomeEvidence("old", "new") === "new", "incoming replaces");
ok(auth0PrefillIsMembershipProof() === false, "Auth0 name prefill is NOT membership proof");
ok(anonymousJoinIsMembershipProof() === false, "QR/code join is NOT membership proof");

console.log("PERSIST_STATUS_KEYS — every status maps to a lexicon key present in English defaults");
for (const [status, key] of Object.entries(PERSIST_STATUS_KEYS)) {
  ok(typeof key === "string" && key.startsWith("soi.pod.persist."), `${status} → key prefix`);
  ok(key in DEFAULT_ENGLISH_TRANSLATIONS, `${key} in DEFAULT_ENGLISH_TRANSLATIONS`);
  ok(!!DEFAULT_ENGLISH_TRANSLATIONS[key]?.englishDefault?.trim(), `${key} has englishDefault`);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
