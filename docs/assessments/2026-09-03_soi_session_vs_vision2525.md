# /soi-session versus Vision • 2525 — assessment and the dial-in fix
### For the Thought Master, from the Master of Thought — 2026.09.03

**Ask.** Assess the ◬ ♡ 웃 Session (`/soi-session`) against Vision • 2525, and ensure a pod can
have **any topic**, as the **default option for people to log in and test**, the way the polling
engine lets multiple people dial in.

**Method.** Read against the *winning* ledger blocks, not the summary tables: `unit.witness`
(v272, locked white-paper doctrine), the r182 `open.proposed` pod entry (a proposal, target
`frame.pod`, never locked), D4/D5/D12/D13. Live URL not reachable from the sandbox (proxy
403s every host); the page was assessed from source at `09e7b3d`.

---

## What the pod gets right (doctrine honoured)

| Doctrine | Where the code honours it |
|---|---|
| Witness floor — no one settles their own hours; both others attest (`unit.witness`, TOK-17, D5) | `isWitnessed = witnessedCount ≥ 2`; un-witnessed hours settle nothing (tested) |
| 웃 = M × hours, 9,999/yr boundary with rollforward (`unit.ceiling`) | settlement line + receipt; M = 1 wage-floor in the prototype |
| ◬ = delta against a frozen baseline only, never a profit metric (D4, `unit.accel`) | `accelDelta = baseline − witnessed`, conflict-excluded signer (D11) |
| AI authority Advisory only; Sovereign closed to machines (D13, `gov.aidoor`) | governance artefact states it; Cube 6 only *writes the synthesis* |
| Seed = one-seventh of a local minimum-wage hour, mints nothing (`coin.seed`) | SeedMembership panel, region-priced |
| "Mints nothing new — a gate on ♡/웃/◬" (r182) | stated in the receipt and footer; nothing is created |
| 333-word (3 × 111) synthesis on close (r182) | deterministic local synthesis + Cube 6 path, tested ~333 |

The tokenomics core is faithful and locked by `soi-pod-flow.test.mjs` (26/26).

## Findings

### 1. HIGH — "three or more" versus "exactly three": the code followed the proposal, not the doctrine
`unit.witness` (locked, winning at v272): *"A pod is **three or more** verified people working
together on the same session on the same problem: the smallest number capable of forcing a
witness instead of accomplices."* Three is the **floor**.
The r182 proposal says *"pod of exactly three"*; `lib/pod-projects.ts` hard-codes
`POD_SIZE = 3` and the page copy says *"A pod is exactly three."* The unlocked proposal won
over the locked white paper.
**Not changed** (rule 6 — you did not ask for a larger pod). What changed: a fourth phone that
dials in now gets *"This pod already has three"* instead of silently corrupting a seat, and the
code comment names the conflict. **Ruling needed:** promote `frame.pod` as *three-or-more* (Trinity
of three leads + optional members) or amend `unit.witness`. The dial-in mechanics below already
seat by roster, so widening later is a constant, not a rewrite.

### 2. HIGH — multi-person dial-in was illusory  → FIXED
Before: only the *phase* travelled over the channel; `members` was per-phone React state. A
joiner's name and approval never reached the lead's phone, so *"accepted by all three"* could
only be satisfied on one device; joiners could enter only via a scanned QR (`?pod=`); the copy
said *"any member stops the session for everyone"* but `drive()` was lead-only.
Now (additive, no SACRED file touched — `session_update` already carries an index signature):
- **Join by code** panel is the first thing on the landing — the poll's dial-in, verbatim in
  spirit: type the code, or scan; `?code=` is accepted alongside `?pod=`.
- **One roster across the pod:** `hello` (joiner → lead) · `roster` (lead → all) · `member`
  (any → all). The lead seats newcomers and re-publishes after every change; each phone edits
  only its own seat; a fourth phone is told the pod is full.
- The **15-second synchronized start is now measured across three real devices** — each phone
  presses its own seat and every phone checks the spread.
- **Any member can stop** and move the pod to record/audit/close, as the copy always claimed.
- Degrades exactly as before: with no Supabase the page is the single-phone prototype.

### 3. MEDIUM — the topic was framed as a Domain-Play choice  → FIXED
Intent + outcome were free text, so any topic was *possible*, but the UI presented
"Projects — pick 1 to 3" from three Domain Plays as the framing. Now **Open topic is the
first card and pre-selected**; the label reads *"Topic — open by default; tag up to 3 Domain
Plays if you like"*; a **Use a sample topic** button fills a ready intent + outcome so a
first-time trio can dial in and run the whole flow in a minute — the pod's equivalent of the
poll's demo sessions. Locked by four new assertions.

### 4. MEDIUM — Manta-2525 is offered as a live project and does not exist
`DEFAULT_PROJECTS` lists Manta-2525 with three tasks. The Level-3 assessment (2026-09-02)
found no Manta artefact anywhere in the repository. Not removed (rule 6). Recommend marking it
*specified, unbuilt* or replacing it.

### 5. Remaining gaps against the white paper (not in this ask)
- **No durable record.** `unit.witness` step 1: *"The clock is an event, not a claim: nothing
  backdated"* — true within a session, but the pod record lives only in phone state; nothing
  reaches a ledger or MoT. The r182 proposal's *"documented by that pod, audited by that pod"*
  needs persistence (a `pod_sessions` table + the Cube 5 time-tracking hook) to be real.
- **No budget-approval gate before 웃.** The canonical invariant (plan, 2026-08-19): 웃 issues
  only on witnessed work under a scoped, budget-approved task; before approval it is planning.
  The pod settles 웃 straight from witnessed hours with no approval step.
- **Lexicon.** The page had zero `t()` calls. The eleven new strings go through `t()`
  (`soi.pod.*`, 1,321 keys now); roughly sixty legacy strings remain hardcoded — already on the
  gap assessment's list.
- **Placement.** r182 says the working session *"lands in the polling tool's settings menu"*;
  it is in the navbar under the Sol Framework, not in Settings.

## Verified
`tsc` 0 errors in touched files · `test:soi-pod` 26/26 · lexicon 1,310 → 1,321 (never decreases)
· every roster path routes through `commit`/`setMember` so state and broadcast cannot diverge.
**Not verifiable here:** three real devices over Supabase Realtime (no Supabase in the sandbox);
the protocol is exercised statically and by type, the tokenomics core by test.
