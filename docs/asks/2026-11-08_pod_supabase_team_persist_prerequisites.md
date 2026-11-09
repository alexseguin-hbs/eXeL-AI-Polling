# POD durable team save — prerequisites (blocker) · 2026-11-08

Operator (t65u/t69u): save the pod in Supabase or we are not a global source for traceability.
Authorized cross-device read and member provenance are required — localStorage and contract-only are not acceptance.

## Verified against deployed schema (read-only) and source

| Surface | State | Why it is not enough alone |
|---|---|---|
| `public.pod_sessions` | 0 rows; RLS **service_role only**; no `owner_user_id` | Anon/authenticated clients cannot write. A service-role upsert that trusts client-typed members or arbitrary pod codes is refused. |
| `innovation_state` + RPCs (mig 030) | Works for per-browser `owner_key` | Capability key in localStorage — **not** Auth0 seat membership for a trio; not authorized cross-member read. |
| `/soi-session` Auth0 | Prefills lead name/email only | Explicitly **not** membership proof (`auth0PrefillIsMembershipProof() === false`). |
| QR/code join | Anonymous seats | Explicitly **not** a signed seat token (`anonymousJoinIsMembershipProof() === false`). |

## Precise prerequisites before "save pod in Supabase" can be called complete

1. **Signed pod-scoped seat tokens** (mint at join; verify on write) — analogous to Cube 1 `participant_token`, but bound to `pod_code` + seat index + subject.
2. **Owner binding** — Auth0 (or synced Supabase auth) `sub` stored as `owner_user_id` on the pod row; lead create requires verified JWT.
3. **Migration applied to the live project** (review SQL only tonight — live apply blocked): add `owner_user_id`, append-only evidence / rev, authenticated RLS or backend-only writes after JWT+seat proof. See `supabase/migrations/036_pod_sessions_auth_membership.sql` (proposal).
4. **Deployed API path** that verifies JWT + seat proofs server-side before any upsert (no privileged browser trust).
5. **Cross-device reload test** for the authenticated lead and for each proven member — synthetic fixtures OK; no forged human identities; no public votes.

## What ships in this review PR without claiming complete

- Fail-closed persist contract + tests (`frontend/lib/pod-persist.ts`).
- Honest UI: device cache ≠ shared team save.
- Unlisted vs Private video proof copy (YouTube Help).
- R-CORE badge on `/soi-session` reading `pod-session.ledger.json` via the shared generator.
- Review-only migration proposal — **not applied** to the live database.

## Acceptance gate (H.I.)

A build may say "shared with the team" only after prerequisites 1–5 are green on a real authorized reload across devices.
