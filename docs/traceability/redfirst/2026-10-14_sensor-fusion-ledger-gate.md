# SensorFusion's record comes under the law — red first

The last project owed a record under DD-55. SensorFusion already **had** a panel and a record; what it did not
have was anything checking it.

## What was measured

`frontend/app/SensorFusion-2525/ledger.ts` — 76 rows of hand-written TypeScript, **outside**
`docs/traceability`, outside `gen-rcore-revisions.mjs`, outside `traceability.test.mjs`, outside every gate. So
nothing had ever read it, and:

- **Seven `release` rows carry no commit at all** — revs 4, 5, 6, 7, 8, 31, 75. A release row without a sha is a
  claim, not a record: there is nothing for a future reader to run `git show` on.
- The other **69 all resolve AND are ancestors of HEAD**. That includes `5141b16`, which an earlier note recorded
  as *"resolves — but `git merge-base --is-ancestor 5141b16 HEAD` is FALSE… it lives on another ref."* **That was
  an artefact of the shallow clone, not of the record.** On the full history it is a normal ancestor. The note is
  corrected here rather than left standing.

## The file is NOT moved, and that is the decision

It belongs to the SensorFusion rounds, and relocating another workflow's append point would break their process
to satisfy this one. So the law came to the file: `frontend/tests/sensor-fusion-ledger.test.mjs`.

- revisions consecutive from 1; kinds in the shared vocabulary; ISO dates
- every cited commit **resolves** AND is an **ancestor of HEAD** — not merely that the object exists, which is all
  `git cat-file -e` proves and is the hole `traceability.test.mjs:19` still has
- a `release` row **must** carry a commit, **except** the seven named **by number, on the record**, in the
  correction appended at **rev 77** — and the gate reads that list **out of the correction row itself**, so
  widening the exemption means writing a new correction a reader can see

**Nothing above rev 77 is edited.** His law: a new edition is an append, never an edit. The seven rows stay
exactly as written, so the history of the mistake survives too.

**One candidate offered, not filled in.** Rev 75 (*"A late CPU pass can no longer draw after CORAL is chosen"*)
matches `df1cd212` 2026-10-06 *"Stop a late CPU pass from drawing after CORAL is selected."* It is **not** written
into rev 75: this ledger belongs to another workflow, and filling their row on an inference is exactly the
plausible-but-unverified entry this whole record exists to prevent. That workflow already has the mechanism — its
own *"Point Sensor Fusion revision NN at &lt;sha&gt;"* commits — and can confirm or correct it.

## Red first — two sabotages

**An eighth release row with no commit:**

```
FAIL: r78 is a release with NO commit — a release without one is a claim, not a record;
      it must be named by the correction row
154 passed, 1 failed
```

**A cited commit that EXISTS but is not in this history** (the empty-tree object `4b825dc6`, which every git repo
has):

```
FAIL: r76: the cited commit 4b825dc6 resolves
FAIL: r76: 4b825dc6 is an ANCESTOR of HEAD — existing is not the same as being in this history
152 passed, 2 failed
```

That second one is the point: a gate built on `git cat-file -e` alone would have passed it.

Both reverted; green at **154 passed, 0 failed**.

## The gate is in `test:ci` but deliberately NOT in `prebuild`

It shells out to `git`, and the Cloudflare builder's clone depth is not ours to set. A gate that is green in CI
and red on the builder is worse than no gate. Every non-git gate added today is in **both**.

## Green, and the count that matters

```
projects-registry    94 passed, 0 failed · 27 routes · 10 projects, 0 STILL OWED · 13 ledgers, 0 orphans
sensor-fusion-ledger 154 passed, 0 failed · 77 rows · 69 commits resolved and proven ancestors · 7 exempt by name
rcore-gen            every generated module matches its ledger
rcore-stage2         117 passed, 0 failed      (78 this morning)
rcore-revisions      49 · traceability 92 · sf-r4a 26 · lexicon-coverage 129 · tsc clean
```

The registry gate also gained a rule while doing this: a project that keeps its record outside
`docs/traceability` must **name the gate** that holds it to the same law, that gate must exist, must prove
ancestry rather than existence, and must be wired into the build. An exception without a gate is just an
exception.
