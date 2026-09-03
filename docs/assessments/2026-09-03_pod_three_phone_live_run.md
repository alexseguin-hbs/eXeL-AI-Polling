# SoI Pod — three real phones, one pod, end to end (live run, 2026-09-03)

**Question asked (operator, 11:16 CST):** *is the SoI Pod ready? have you simulated live inputs and
logins for 3 users first, before the complexity of more users? Outcome and proof of outcome is key.*

**Answer.** Until this run: **no.** The night's 66-assertion simulation drove the pure protocol over
an in-memory bus; no browser, no login, no wire. This run drives **three real Chromium phones
(375×812, touch)** through the whole pod on the app's own code path — the page, the app's own
supabase-js client and the SACRED `use-session-broadcast` hook, unmodified — over a local relay
that speaks the Supabase Realtime v2 wire (`frontend/scripts/realtime-relay.mjs`). Three users, first.
More than three (ruling R-A: the group behind three leads) is **not** exercised here and is not
claimed.

**What it does not prove.** The hosted Supabase service, Auth0 login, a real network, or a real
handset. The sandbox cannot reach any external host, so the hosted path stays **UNVERIFIED** until
the operator runs the same script against the live site (`POD_BASE=https://…/soi-session/`).

## Outcome — 45 steps, 0 failures

```
  1971ms  lead   OK  login/open /soi-session
  2185ms  lead   OK  open button enabled
  2280ms  lead   OK  pod code issued  X9U2J8
  2285ms  lead   OK  live channel subscribed (relay)
  3969ms  ana    OK  opened join link ?pod=X9U2J8
  6402ms  bo     OK  typed the code and joined
  6413ms  ana    OK  assigned seat 2 by the lead roster
  6421ms  bo     OK  assigned seat 3 by the lead roster
  6425ms  lead   OK  lead sees 3 in the pod
  6451ms  ana    OK  entered own name
  6503ms  bo     OK  entered own name
  6561ms  lead   OK  agreed (own checkbox)
  8024ms  ana    OK  agreed (own checkbox)
  8072ms  bo     OK  agreed (own checkbox)
  8077ms  lead   OK  roster shows Bo (name replicated)
  8079ms  ana    OK  roster shows Bo (peer replicated)
  8085ms  lead   OK  all three agreed → sync unlocked
  8231ms  lead   OK  reached SYNC
  8234ms  ana    OK  reached SYNC
  8237ms  bo     OK  reached SYNC
  8270ms  lead   OK  pressed Start (own seat only)
  8322ms  ana    OK  pressed Start (own seat only)
  8373ms  bo     OK  pressed Start (own seat only)
  9162ms  lead   OK  ACTIVE — all three started together
  9165ms  ana    OK  ACTIVE — all three started together
  9169ms  bo     OK  ACTIVE — all three started together
  9370ms  ana    OK  joiner pressed Stop
  9374ms  lead   OK  reached RECORD
  9382ms  ana    OK  reached RECORD
  9385ms  bo     OK  reached RECORD
  9458ms  ana    OK  recorded outcome (words) → audit
  9461ms  lead   OK  reached AUDIT
  9465ms  ana    OK  reached AUDIT
  9468ms  bo     OK  reached AUDIT
  9600ms  lead   OK  self-audit (hours + what you did)
  9636ms  ana    OK  self-audit (hours + what you did)
  9688ms  bo     OK  self-audit (hours + what you did)
 10807ms  lead   OK  witnessed the other two  clicked 2 of 2
 11927ms  ana    OK  witnessed the other two  clicked 2 of 2
 13049ms  bo     OK  witnessed the other two  clicked 2 of 2
 13053ms  lead   OK  all witnessed + all self-audited → settle unlocked
 13218ms  lead   OK  CLOSED — receipt on this phone
 13222ms  ana    OK  CLOSED — receipt on this phone
 13227ms  bo     OK  CLOSED — receipt on this phone
 13349ms  lead   OK  receipt text  Recorded (written): Three phones, one pod: the receipt below is the outcome.
```

Reproduce: `cd frontend && npm run pod:relay` · `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:4999 NEXT_PUBLIC_SUPABASE_ANON_KEY=local npx next dev -p 3210` · `npm run test:soi-pod-live`.
Screenshots (every phone, every phase) in `pod-live-run/` beside this file.

## What the live run found that the simulation could not

| # | Finding | Effect on a real user | Fix (this commit) |
|---|---|---|---|
| 1 | A page mounts as **lead** (the URL is read in an effect), so a joiner pinned **its own id as lead** and rejected every roster from the real lead as an impostor. | Joiners stayed at *"waiting for the lead to seat you"* forever. **The pod never formed.** | Joiner unpins the lead when it learns it joined by code; trusts the first roster (`app/soi-session/page.tsx`). |
| 2 | The lead's **intent and outcome never reached the joiners** — the roster carries members only. | Joiners were asked to *approve the intent & outcome* while reading two empty boxes. | The lead's brief rides beside every roster (`brief` next to `pod` — additive envelope). |
| 3 | An unseated joiner showed the **"you" badge on the Lead row**. | A joiner believed it was the lead. | Badge only once seated. |
| 4 | The outcome recorded on one phone **never reached the other two receipts** — *Recorded (written):* was empty on the lead. | The receipt, the pod's proof of outcome, disagreed across phones. | The record rides with the recorder's phase move and the lead's rosters carry it on (`record` beside `pod`). |
| 5 | React hydration warning on every page drawing the Seed of Life (`cy` 32.67949192431123 on the server vs …236 in the browser). | Console noise on every phone; a real mismatch risk on the mark. | Petal centres rounded to three decimals (`components/seed-of-life-logo.tsx`; the Trinity mark's ring centres likewise). |

Three of the five (1, 2, 4) are the difference between a pod that forms and settles on three phones
and one that does not. None of them were visible to the pure-protocol simulation, which is why the
operator's order — three live users first — was the right one.

## Test-side lessons (not app defects)
- Names render as text for other seats and as an input for one's own; a text matcher first hit the
  hidden logo glyph. Assertions now check the DOM value/text explicitly.
- The receipt's label and value are siblings; match the paragraph, not the label.

## SSSES
Stability +30 (the pod forms and converges on three real phones) · Security +0 (no protocol change;
envelope fields are additive and ignored by the poll) · Succinctness +5 (one reproducible script
replaces "trust me"). Spiral: forward pod → 5 → 8 → 6 → 9 unchanged; backward — Cube 10 can replay
this run from its log.
