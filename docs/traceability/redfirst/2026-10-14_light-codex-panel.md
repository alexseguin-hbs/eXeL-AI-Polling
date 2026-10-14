# /light-codex gets its own record — red first

Operator 2026-10-14 (DD-55): *"each innovation project gets its own rcore panel (drone, security, light codex,
Vision-2525, etc)"*; asked which Light Codex he meant, **"The /light-codex world"** — this route and its cube,
not the LIGHT CODEX comms module inside the Drone-2525 deck (that becomes COMM-2525 under DD-41).

## The premise this work was planned on was WRONG, and that is worth recording

The plan said: *"This clone is SHALLOW — 330 commits, grafted at 1d28c563a (2026-10-05)… Git cannot be the
source of history or of code locally."* On that premise an honest ledger would have had to be mined from the
sealed asks, which for Light Codex are mostly about the pixel signer **inside the PDF signer** rather than the
cube — a real risk of attributing one project's history to another.

Measured today: `git fetch --unshallow` succeeded. The clone now carries **4,446 commits back to the initial
commit of 2026-02-01**, so git IS available as a source in this container, and the ledger is built from it
rather than reconstructed from prose. This also reopens the per-revision **code record** (DD-53) on a much
firmer footing than the plan assumed.

## What the record is made of, and how a future reader checks it

**18 real commits**, scoped to this project's four files, oldest first:

```
git log --format='%H|%ad|%s' --date=short --reverse -- \
  frontend/lib/light-codex.ts frontend/components/light-codex-cube.tsx \
  frontend/app/light-codex/page.tsx frontend/lib/codex-pdf.ts
```

from `7a47f5fc1` 2026-07-05 *"Light Codex cube — encode/decode short messages hidden in shared images"*
(3 files, +557 −0) through `aab59e401` 2026-10-07 *"Put the newest boxes on the upper left of the picture."*

Every row carries its real commit sha and the measured file count and line delta **inside this project's own
paths**, so `git show <sha>` shows exactly what the row claims. Verified: **every cited commit resolves AND is
an ancestor of HEAD** — not merely that the object exists, which is the hole the existing
`traceability.test.mjs:19` has (`git cat-file -e` passes for an object on another ref).

Three honesty rules, all visible in the file:
- **rev 1 is a `decision` row that states the method first**, so nothing below is mistaken for a note taken at
  the time, and it prints the exact command to reproduce the reconstruction. The record is **forward-only**
  after it.
- **Eleven of the eighteen commits are Sign Doc waves** that touched the shared engine because the signer
  embeds Light Codex strips in a PDF. Each of those rows says so in its own text rather than claiming the
  change as a feature of the cube.
- **The one genuine design ask** (2026-09-18, Light Codex as the SYNC crypto-comms layer, six-digit key, SKL /
  Link-16 analogy, Atlantis L1–L7 wrapper) is appended **at the end, out of date order on purpose**, because
  the record is append-only and the row was written on 2026-10-14; back-dating it into the sequence would make
  it look contemporaneous. It is marked **NOT YET BUILT**.

## Red first

**The badge was removed from the page's JSX** and the two gates were re-run:

```
rcore-stage2:       FAIL: Light Codex: mounts <RCoreBadge>
                    FAIL: Light Codex: passes an accent to the badge
                    89 passed, 2 failed
projects-registry:  87 passed, 0 failed      ← IT DID NOT NOTICE
```

**My own gate had a hole.** It tested for the string `RCoreBadge`, which the surviving `import { RCoreBadge }`
line satisfies, so a page whose panel had been deleted still passed. Tightened to the opening tag
`/<RCoreBadge\b/`, and the sabotage re-run:

```
projects-registry:  FAIL: /light-codex MOUNTS the shared badge (<RCoreBadge …>) in app/light-codex/page.tsx
                    86 passed, 1 failed
```

Restored, both green.

## Where the badge sits, and why not inside the cube

`LightCodexCube` renders through `createPortal` into `document.body` as a full-screen modal
(`light-codex-cube.tsx:320`). A badge inside it would be an overlay on the tool — the one thing the shared rule
forbids (`rcore-revisions.test.mjs:107`, operator 2026-09-25). So the badge is mounted on the **page shell**,
in normal flow below the cube. Accent `#e879f9` is the colour this world already carries on the Vision-2525
worlds page; it was not newly chosen.

## Green

```
rcore-gen            every generated module matches its ledger (9 modules)
projects-registry    87 passed, 0 failed · 27 routes · 10 projects, 3 still owed · 11 ledgers, 0 orphans
rcore-revisions      49 passed, 0 failed
rcore-stage2         91 passed, 0 failed   (78 before: 13 new assertions for Light Codex)
traceability         82 passed, 0 failed
lexicon-coverage     129 passed, 0 failed
tsc                  clean
```

Owed drops from four to three: `/vision-2525`, `/encrypted-messaging`, and SensorFusion's hand-written
`ledger.ts` moving under the same law with a correction row.
