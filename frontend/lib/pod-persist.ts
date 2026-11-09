/**
 * POD SERVER PERSISTENCE CONTRACT — fail-closed until authenticated membership exists.
 * ==================================================================================
 * Operator 2026-11-08 (t65u / t69u): ensure Supabase tracking for Trinity pods, but
 * NEVER open a service-role upsert that trusts client-supplied member identities or
 * arbitrary pod IDs.
 *
 * UI copy for persist statuses lives in the lexicon (`soi.pod.persist.*`) and is
 * rendered through `t()` on /soi-session. This module exports status → lexicon key
 * only — never a parallel English table for the screen.
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

export type ProvenSeat = {
  seat: number;
  subject: string;
  proof: "signed_seat_token" | "verified_owner_binding";
};

export type PodAuthContext = {
  ownerSubject: string | null;
  provenSeats: ProvenSeat[];
  projectId: string | null;
  claimedProjectId: string | null;
  podSize: number;
};

export type PersistRequest = {
  podCode: string;
  rev: number;
  knownServerRev: number | null;
  memberOutcomes: string[];
  auth: PodAuthContext;
};

/** Lexicon keys for every persist status — screens must `t(key)`, not hardcode English. */
export const PERSIST_STATUS_KEYS: Record<SharedPersistStatus | DevicePersistStatus, string> = {
  device_saved: "soi.pod.persist.device_saved",
  device_failed: "soi.pod.persist.device_failed",
  device_idle: "soi.pod.persist.device_idle",
  shared_blocked_no_membership: "soi.pod.persist.shared_blocked_no_membership",
  shared_blocked_no_owner: "soi.pod.persist.shared_blocked_no_owner",
  shared_blocked_project_mismatch: "soi.pod.persist.shared_blocked_project_mismatch",
  shared_idempotent_hit: "soi.pod.persist.shared_idempotent_hit",
  shared_saved: "soi.pod.persist.shared_saved",
  shared_unavailable: "soi.pod.persist.shared_unavailable",
};

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
  if (req.knownServerRev != null && req.knownServerRev === req.rev) {
    return { allow: true, reason: "shared_authorized", detail: "idempotent same rev" };
  }
  return { allow: true, reason: "shared_authorized", detail: "membership proven" };
}

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
    return { status: "shared_unavailable", serverRev: req.knownServerRev };
  }
  const res = transport(req);
  return res.ok
    ? { status: "shared_saved", serverRev: res.serverRev }
    : { status: "shared_unavailable", serverRev: req.knownServerRev };
}

export function combinePersistStatus(
  device: DevicePersistStatus,
  shared: SharedPersistStatus,
): { device: DevicePersistStatus; shared: SharedPersistStatus; sharedImpliesSaved: false } {
  return { device, shared, sharedImpliesSaved: false };
}

export function mergeOutcomeEvidence(prior: string, incoming: string): string {
  return incoming.trim() ? incoming : prior;
}

export function auth0PrefillIsMembershipProof(): false {
  return false;
}

export function anonymousJoinIsMembershipProof(): false {
  return false;
}
