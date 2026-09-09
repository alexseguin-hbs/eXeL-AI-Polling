# AAR — one defect, found three times, sixteen hours (2026-09-09)

## What happened
The operator signed a document and could not download, text or e-mail it. Over sixteen hours he reported that same outcome
three times, in three different words, and each time a fix shipped that closed one door and left another open.

| His report | What was actually wrong | What shipped |
|---|---|---|
| 04:02 "After signing I can't download, text or email" | The create RPC failed inside itself (pgcrypto off its search path, migration 038 unpasted) and the flow dead-ended | 74862b8 — a fallback at **create** |
| 04:59 "this error comes up after signing" | The **save** RPC has the same fault and had no fallback; the catch called `setStep("draw")` and discarded `stampedBytes`, the finished PDF already in memory | 3f6ac5d — the catch keeps the file and lands on the panel |
| 09:14 "The quota has been exceeded" | The create fallback wrote the envelope to `localStorage`; a full phone threw `QuotaExceededError`, which is not a store error | 0687ebb — evict and retry, then continue from memory |

Three fixes. One bug: **nothing guaranteed that a finished signature survived a failure.**

## Why it took sixteen hours
Not the code. The method.

1. **Each fix answered the symptom in front of it.** The failure *class* was "anything that can throw between the bytes being
   stamped and the panel being rendered". It was never enumerated. Thoth: *"I patched one call site and never counted the others."*
2. **The proof mirrored the fix.** The live run mocked the create RPC failing because that is what had just been written. The
   save RPC was never mocked. A 98-step green run and a dead phone coexisted for hours. Athena: *"my test tested what I built."*
3. **The invariant was never stated.** Without *a completed signature is never discarded*, every failure mode needs its own
   patch, and the next one is always missed. Odin.
4. **The operator's environment was never reproduced.** He had 036 and 037 pasted without 038, on a phone with full storage.
   Every proof ran against a clean local Postgres and an empty browser.
5. **The AsM reviewed the diff, after the fact.** Twelve reviewers passed a change that still had a hole, because they were
   asked "is this change correct?" instead of "what else on this path can fail?"
6. **Defending the diff cost hours.** When he said features had been reverted, the answer was a control-by-control comparison
   proving nothing was removed. True, and useless: his outcome had regressed. Christo.

## What changes, permanently
Written into `CLAUDE.md` as an R-CORE law, **FIX THE CLASS, NEVER THE INSTANCE**:

1. State the invariant before the code, in the user's terms, in the file and in the plan.
2. Enumerate the whole class before fixing one member. A fix naming a single call site is refused at review.
3. Reproduce the operator's environment, not a mock of the theory.
4. Every invariant gets a gate in `test:ci`. An invariant defended by a comment is already lost.
5. The AsM review the journey before the ship; one reviewer always owns "what else on this path can fail?"
6. A second report of the same symptom stops the fixing and starts the enumerating.

## The gate this produced
`frontend/tests/sign-invariant.test.mjs` reads the shipped source and fails the build if the stamped bytes move back inside
the try, if `setSigned` stops preceding the store calls, if the catch loses its guard, if the download row becomes conditional,
or if the store throws where it could evict. Ten assertions, wired into `test:ci`.

## The measure of success
Not "the reported bug is fixed". **Every member of the class is closed and proven in one run.** The two-phone proof now covers
the create refusal, the save refusal for both signer roles, a full phone, one signer and several, and a database that answers
and one that does not.
