# Financial-2525 · the 33-round programme (operator 2026-10-02, addendum 126)

> SSSES, 12 AsM AAR and UX TEST, and Spiral test forward and backward implementation of Financial-2525
>
> EACH ROUND YOU FIND GAPS; fix code .  go 33 rounds

Every round is one revision: **r.056 → r.088** (round N = revision 0.(055+N)). Each round runs four checks, fixes what they
find, ships, and waits for LIVE before the next round starts:
- **SSSES:** five pillar scores, 0–100 each.
- **The twelve reviewer lenses' AAR** (what was supposed to happen, what happened, why, what to change).
- **The UX test:** a headless walk of the built page at phone width, signed in.
- **The spiral, forward and backward:** lib → surface → record → cloud → gates → ledger, and back.

## Scope: Financial-2525 only
Files:
- `frontend/components/financial-2525/*`
- `frontend/lib/financial-2525/*`
- `frontend/lib/planet-ltu.ts`, plus the Admin-panel Planet LTU section only if a finding is there
- `frontend/tests/financial-*.test.mjs`, `frontend/tests/planet-ltu.test.mjs`
- `frontend/scripts/fin-*.mjs`
- `docs/financial-2525/*`, `docs/traceability/financial-2525.ledger.json`

The route is `/financial-2525`. Nothing outside Financial-2525 is changed: no shared component, no other app, and never the
sacred Trinity-Redundancy files.

## The operator's laws: never broken by a round
1. **HI first. Never assume a design.** A round fixes defects: wrong numbers, broken flows, data-loss risks, unreachable
   controls, overlap at 390 px, missing gates, machine language on the glass. It does NOT redesign anything, rename
   anything, move a widget, add a feature, or remove a control. A finding that needs a design choice goes to the round
   report under **"For the operator"**, unbuilt.
2. **"STOP WORKING BUDGET (I FIXED ALREADY)."** No round changes a budget figure he sees, a saved budget line, the sheet
   values, or the per-month conversion.
3. **No change ever deletes an entry** (FD-72). The record is append-only and chain-hashed. A saved copy that would not
   carry forward is kept, never dropped.
4. **Words.** No machine language on the person's screen: no database, vendor, RPC, schema, hash jargon in visible copy.
   New English keys are staged in `AFTER_FILL` in `tests/lexicon-coverage.test.mjs`. **No translation fill.**
5. **Fix the class, not the instance.** State the invariant first, list every member of the class, fix them together,
   and add a gate that fails if the guarantee is removed.
6. **No model or vendor names** in any repo file, commit or screen.
7. **One revision at a time.** The door waits for Verify Live before the round ends. The next round starts only on a
   LIVE HEAD.
8. Already known and open, for a round to take if it is small and has no design choice:
   - **Flush the account copy when the page is hidden or closed.** Today a change made in the last 1.5 s waits for the
     next visit. The e2e test found this.
   - The pending big items are **design work, not round work**: the new chart engine (r.056 plan, addenda 120–124) and
     editing a transaction (addendum 57 / r.057 plan). Rounds leave them to the operator unless a round report records
     his explicit go.

## The twelve lenses (reviewer lenses, each with its testing power)
| Lens | Power |
|---|---|
| Aset | consistency: the same number and word everywhere |
| Asar | outcome synthesis: does the page do its job (plan the month, watch spending by the minute, keep savings on track) |
| Athena | strategic flow: the stranger's first minute, order of widgets, one door |
| Christo | consensus with HI: every addendum honoured, nothing he rejected reintroduced |
| Enki | edge cases: zero, negative, huge, leap day, DST, perihelion boundary, empty record, many entries |
| Enlil | build and implementation: types, dead code, effects, re-renders, the 1 s clock |
| Krishna | integration: record ⇄ cloud ⇄ plan ⇄ chart ⇄ Admin LTU ⇄ R-CORE ledger |
| Odin | future-proofing: Mars and other planets, $/sec, a business tenant, scale of records |
| Pangu | cutting edge: what a best-in-class personal finance tool does that this one gets wrong (report only) |
| Sofia | multiple perspectives: phone portrait and landscape, both themes, keyboard, screen reader |
| Thoth | math and data: $/min accrual, MoT A.B..C, 30-day month law, rounding, cents, currency label |
| Thor | security and data safety: never losing info, sign-in and cloud copy, private tabs, storage full, other devices |

## Round report: `docs/financial-2525/rounds/rNNN.md` (written by the round's fixer)
Sections:
- **SSSES** (the fleet's mean per pillar)
- **Findings** (id · lens · severity · file:line · what · verdict)
- **Fixed** (what, the invariant, the gate added)
- **Deferred** (why)
- **For the operator** (design choices, each a one-line question)
- **Spiral forward / backward**
- **Gates**: the door's own lines

## Door
1. `node scripts/fin-round-record.mjs 0.NNN docs/financial-2525/rounds/rNNN.md "<why>"`
   Appends the revision and the ledger rows, and renders.
2. Write the commit message to `/tmp/fin-round/0.NNN.msg`. It ends with the two trailers:
   - `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
   - `Claude-Session: https://claude.ai/code/session_01GKmyWeWf1CfBrFKiFUHzGf`
3. `scripts/fin-round.sh ship 0.NNN /tmp/fin-round/0.NNN.msg`
   Runs tsc → render → full test:ci → build → commit → push both refs → Verify Live, in the background.
0. Before shipping: `scripts/fin-round.sh wait-live` until HEAD is LIVE (never outpace the deploy).
4. `scripts/fin-round.sh wait 0.NNN` repeatedly, until it exits 0 (LIVE) or 1 (RED). A RED gate means fix and run
   `ship` again. Nothing was pushed.
