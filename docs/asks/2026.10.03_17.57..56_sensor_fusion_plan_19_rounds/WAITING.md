# Sensor Fusion plan — the server track that waits on decision 1

Moved verbatim out of `PLAN.md` in revision 0.17 (R4c, R4b). It starts only when the operator answers decision 1.
Shared queues, group naming blocks (R5 group half) and Upload (R7, decision 2) wait on the same answer.

**R4c · Seating, review sign-off, old rows (server track, waits on decision 1).** Extends 042, never a parallel table. One
`SECURITY DEFINER` RPC admits a person on a valid invite (R4b) and is the **only** path into `sensor_fusion_members`; no INSERT policy is
granted. **Columns first:** migration 043 adds `level`, `labeled_by uuid DEFAULT auth.uid()`, `reviewed_by`, `reviewed_at`, `review` and
`note` to 041, binds the label INSERT check to `labeled_by = auth.uid()` and membership, and retires `owner_key` for new rows. An UPDATE
policy covers only the Level 2 columns, with `reviewed_by = auth.uid()` and `reviewed_by <> labeled_by`. NULL-`project_id` rows are
quarantined to `?diag=1`, never lost. An unseated person reads "Ask your project owner for an invite", never an empty list.
*Tests (SQL parse in `sensor-fusion-r4a.test.mjs`):* every label INSERT policy binds `auth.uid()`; the UPDATE policy names only columns
that exist after 043; a non-owner cannot seat anyone; no INSERT policy on `sensor_fusion_members`; a labeler cannot review their own box;
a NULL-project row is never readable; the unseated sentence shows.

**R4b · Group projects and roles.** Owner, contributor, reviewer, viewer; optional **teacher** (sees time and progress, never a race).
Live invite codes come from `randomPodCode` fed **crypto-random bytes**; the seeded `inviteCode` (`si-pod.ts:119`) stays for replay only.
Codes expire (as `INVITE_TTL_MS` does). Admission is checked **on the server** (the R4c seat RPC), not only by `admits` (`si-pod.ts:149`).
Sign-in required; a member id, never a name. Warn when faces appear; minors' consent is decision 3. **Waits for decision 1.**
*Tests:* a guest cannot join; an expired code is refused; one seed in live mode never repeats a code; a browser-only admission is refused.
