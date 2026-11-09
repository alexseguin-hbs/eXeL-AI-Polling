/**
 * POD SERVER PERSISTENCE CONTRACT — fail-closed until authenticated membership exists.
 * ==================================================================================
 * Operator 2026-11-08 (t65u / t66u): ensure Supabase tracking for Trinity pods, but
 * NEVER open a service-role upsert that trusts client-supplied member identities or
 * arbitrary pod IDs.
 *
 * What exists today (verified against source):
 *   • Auth0 on /soi-session only prefills the lead's name/email — it does not bind seats.
 *   • Join is anonymous via QR/code; no signed membership token for pod seats.
 *   • `pod_sessions` table exists (migration 035) with service_role-only RLS and 0 rows.
 *   • Device half is append-only localStorage (`pod-store.ts`); that is NOT a shared save.
 *
 * This module is pure: it decides whether a shared write is allowed, and what status a
 * person may be told. It never invents a save. A future authenticated path plugs in by
 * satisfying `PodAuthContext` — until then every shared write is refused.
 */

export type DevicePersistStatus = "device_saved" | "device_failed" | "device_idle";
export type SharedPersistStatus =
  | "shared_blocked_no_membership"
  | "shared_blocked_no_owner"
  | "shared_blocked_project_mismatch"
  | "shared_idempotent_hit"
  | "shared_saved"
  | "shared_unavailable";

export type PersistDecision =
  | { allow: false; reason: SharedPersistStatus; detail: string }
  | { allow: true; reason: "shared_authorized"; detail: string };

/**
 * Proven membership for ONE seat. A client-asserted name/email is never enough.
 * Until the product issues a signed, pod-scoped seat token (or equivalent), this
 * shape cannot be satisfied from the browser alone.
 */
export type ProvenSeat = {
  seat: number;
  subject: string;          // Auth0 sub / verified subject — never a free-typed name
  proof: "signed_seat_token" | "verified_owner_binding";
};

export type PodAuthContext = {
  /** Authenticated subject that owns/created the pod, if any. */
  ownerSubject: string | null;
  /** Seats with cryptographic or server-issued proof — not client-typed identities. */
  provenSeats: ProvenSeat[];
  /** Project id locked for this pod (one project per pod). */
  projectId: string | null;
  /** Caller-claimed project — must equal the locked project when both are set. */
  claimedProjectId: string | null;
  /** Expected pod size (Trinity = 3). */
  podSize: number;
};

export type PersistRequest = {
  podCode: string;
  rev: number;
  /** Prior server rev for this code, if known. Same rev → idempotent hit, never rewrite. */
  knownServerRev: number | null;
  /** Own-seat outcome texts — corrections APPEND; never overwrite earlier evidence. */
  memberOutcomes: string[];
  auth: PodAuthContext;
};

/** Human-facing status lines — no vendor, table, or migration names (operator voice rule). */
export const PERSIST_STATUS_COPY: Record<SharedPersistStatus | DevicePersistStatus, string> = {
  device_saved: "Kept on this device.",
  device_failed: "This device would not keep a copy of the pod.",
  device_idle: "Nothing to keep yet.",
  shared_blocked_no_membership: "Kept on this device only — a shared team copy needs verified membership first.",
  shared_blocked_no_owner: "Kept on this device only — a shared team copy needs a verified lead first.",
  shared_blocked_project_mismatch: "Kept on this device only — this pod is locked to a different project.",
  shared_idempotent_hit: "Shared copy already holds this revision — nothing was rewritten.",
  shared_saved: "Shared with the team.",
  shared_unavailable: "Kept on this device only — a shared team copy is not available yet.",
};

/**
 * Fail-closed gate. Returns allow:true ONLY when:
 *   • an owner subject is bound,
 *   • every seat 0..podSize-1 has a proven subject (signed seat token or owner binding),
 *   • project ids agree when a lock exists,
 *   • pod code is non-empty.
 * Client-typed names never satisfy provenSeats.
 */
export function decideSharedPersist(req: PersistRequest): PersistDecision {
  if (!req.podCode.trim()) {
    return { allow: false, reason: "shared_unavailable", detail: "empty pod code" };
  }
  if (!req.auth.ownerSubject) {
    return { allow: false, reason: "shared_blocked_no_owner", detail: "no verified owner subject" };
  }
  if (req.auth.projectId && req.auth.claimedProjectId && req.auth.projectId !== req.auth.claimedProjectId) {
    return { allow: false, reason: "shared_blocked_project_mismatch", detail: "project isolation" };
  }
  const need = req.auth.podSize;
  const bySeat = new Map<number, ProvenSeat>();
  for (const s of req.auth.provenSeats) {
    if (s.seat < 0 || s.seat >= need) continue;
    if (!s.subject.trim()) continue;
    if (s.proof !== "signed_seat_token" && s.proof !== "verified_owner_binding") continue;
    bySeat.set(s.seat, s);
  }
  if (bySeat.size < need) {
    return {
      allow: false,
      reason: "shared_blocked_no_membership",
      detail: `proven seats ${bySeat.size}/${need}`,
    };
  }
  for (let i = 0; i < need; i++) {
    if (!bySeat.has(i)) {
      return { allow: false, reason: "shared_blocked_no_membership", detail: `missing seat ${i}` };
    }
  }
  // Idempotency: a known equal rev is a hit, not a rewrite — still "allowed" as a no-op.
  if (req.knownServerRev != null && req.knownServerRev === req.rev) {
    return { allow: true, reason: "shared_authorized", detail: "idempotent same rev" };
  }
  return { allow: true, reason: "shared_authorized", detail: "membership proven" };
}

/**
 * Attempt a shared write. TODAY this always returns a blocked/unavailable status unless
 * decideSharedPersist allows — and even then, without a bound transport it stays unavailable.
 * No network call is made from this pure module; a future adapter receives the decision.
 */
export function attemptSharedPersist(
  req: PersistRequest,
  transport: null | ((r: PersistRequest) => { ok: boolean; serverRev: number }),
): { status: SharedPersistStatus; serverRev: number | null } {
  const d = decideSharedPersist(req);
  if (!d.allow) return { status: d.reason, serverRev: req.knownServerRev };
  if (req.knownServerRev != null && req.knownServerRev === req.rev) {
    return { status: "shared_idempotent_hit", serverRev: req.knownServerRev };
  }
  if (!transport) {
    // Authorized by membership shape, but no safe transport is wired yet — still fail closed.
    return { status: "shared_unavailable", serverRev: req.knownServerRev };
  }
  const res = transport(req);
  return res.ok
    ? { status: "shared_saved", serverRev: res.serverRev }
    : { status: "shared_unavailable", serverRev: req.knownServerRev };
}

/** Device cache status must never be reported as a shared save. */
export function combinePersistStatus(
  device: DevicePersistStatus,
  shared: SharedPersistStatus,
): { device: DevicePersistStatus; shared: SharedPersistStatus; sharedImpliesSaved: false } {
  return { device, shared, sharedImpliesSaved: false };
}

/**
 * Own-seat outcomes are append-evidence: a later blank must not erase a filled outcome
 * (mirrors mergeMember in pod-roster.ts). Corrections add; they do not rewrite.
 */
export function mergeOutcomeEvidence(prior: string, incoming: string): string {
  return incoming.trim() ? incoming : prior;
}

/** Today's Auth0 prefill is NOT membership proof. */
export function auth0PrefillIsMembershipProof(): false {
  return false;
}

/** Anonymous QR/code join is NOT a signed seat token. */
export function anonymousJoinIsMembershipProof(): false {
  return false;
}
