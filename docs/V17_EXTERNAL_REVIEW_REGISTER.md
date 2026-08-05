# V17 — External Review Register

**Three independent reviews of `docs/SOI_VISION2525_LIVING_DOCUMENT.html` at release 75**
(DeepSeek · Grok · eXeL AI), handed to MoT on 2026-08-05, plus every item's decision and state.

> **Version 17 is NOT released.** The operator's instruction stands: *"do not release until all 33
> iterations optimize language, reduce errors, and address all 60 hrs of feedback."* Revisions keep
> shipping into the ledger; the **version** is only delivered when the passes are complete.
>
> `v.17` is on the document — masthead, upper right (`#vBadge`), and in the release readout as
> `v.17 r<n>`. Verified headlessly at r78.

---

## 0 · Where the three agree

The single most useful thing in sixty hours of feedback is a **convergence**: three readers who did
not see each other's work stopped at the same sentence.

| Reader | On *"The Unit. The Shield. The Replay."* |
|---|---|
| **DeepSeek** | Keep it — it is earned. But the line beneath does not carry enough weight; "The Replay" reads as a playback feature until you know replay **is** the governance model. |
| **Grok** | Replay is the weakest leg. Either elevate it to a first-class principle — the permanent, permissionless right to reconstruct and verify — or demote the triad. |
| **eXeL AI** | Four beats, not three. Unit measures · Shield protects · Ledger preserves · Replay compounds. *"Trying to compress them into three weakens the architecture."* |

**Decision (r78, shipped):** four beats, each with its own line, Replay elevated from document
property to civilizational claim — *truth that can be replayed does not require belief.*

**And the defect the review exposed, which none of the three found:** that doctrine line had been
**static HTML since v1**, outside the replay, so every rewording silently rewrote all 77 earlier
releases. That is **defect 20 again**, one line below the masthead defect 20 was about. Three
careful readers redesigned the line without noticing it was not replayed, because static and
replayed look identical from the outside. **Nobody audits what looks already audited.** Registered
as **defect 26**, fixed in the release that found it.

---

## 1 · DeepSeek — items and state

| # | Item | Decision | State |
|:-:|---|---|---|
| D1 | Masthead phrase: keep, strengthen the line beneath | Four beats + per-beat gloss | **Closed r78** |
| D2 | 33 passes should render at **every** release, not only at VMAX | Agreed — passes describe the document as it stands | Open |
| D3 | Defect register "State" must be **checkable** — publish a read-only `/verify/<sha>` endpoint | Agreed in principle; it is a build item in the engine, not the document. Until built, the register must say *unverifiable by you* rather than imply otherwise | Open · needs build |
| D4 | "We were wrong four times" is asserted, not itemised — name the four | Agreed | Open |
| D5 | §16's jurisdiction table deserves its own weight / pull quote | Agreed. **Note:** the review read r75, where the count said eleven; r76 corrected it to **ten** (Aset's finding) | Open |
| D6 | The word **"guaranteed"** in the five-year payout is the most dangerous word in the document → *"funded by a ring-fenced reserve published monthly. The guarantee is structural, not aspirational."* | Agreed, and it is the highest-value single sentence in this review | Open · next |
| D7 | §8 "Paths Considered" → **"Eight Roads Not Taken"**, with the cost of each refusal in the contents | Agreed | Open |
| D8 | Outline view and white-paper view compete for the same reader — make the outline the **promise above** the argument rather than a separate mode | Agreed in direction; the outline stays a view (it is an ORDER, and the four views must stay disjoint) but each §N gains its 111-word promise above the body | Open |

---

## 2 · Grok — items and state

| # | Item | Decision | State |
|:-:|---|---|---|
| G1 | Elevate or redefine **The Replay** so it is not the soft leg | Elevated: verification without permission | **Closed r78** |
| G2 | Tighten §7's voice — make the political claim land: *an institution that publishes its own death certificate in advance* | Agreed. §7 currently reads as a legal fix rather than a constitutional commitment | Open · next |
| G3 | Explicit **"What this is not"** listing the common misreadings: investment contract · governance token · appreciating asset · membership NFT with upside | Extended the existing *"What the token still is not"* notice rather than adding a rival block | **Closed r78** |
| G4 | A one-screen **cold open** readable in under 90 seconds: Unit + Shield + off-switch guarantee | Agreed | Open |
| G5 | Gate the next release on a **single-reader test**: can someone new explain (a) how the token is priced, (b) why it cannot appreciate, (c) what happens on shutdown | Adopted as a pass criterion, not a machine gate — it needs a human reader | Open |
| G6 | State *"price rises only because the statutory wage rises, never because of demand"* more bluntly and repeatedly | Agreed — it is stated once, in §15, and should recur wherever a price appears | Open |
| G7 | The document is extremely dense; the view machinery obscures the core argument for new readers | Agreed — this is the same finding as G4 and D8 | Open |

---

## 3 · eXeL AI — items and state

| # | Item | Decision | State |
|:-:|---|---|---|
| X1 | **The Constitution** — an actual constitutional chapter, ten principles, not governance and not ethics | Agreed. This is the largest single ask in sixty hours of feedback and it is correct: the document has doctrine scattered across nineteen sections and no root | Open · largest |
| X2 | Four beats: Unit · Shield · Ledger · Replay | Shipped | **Closed r78** |
| X3 | Stop calling them "Sections" — lean into the geometry: **Circle I–XIX** | Adopted as an **eyebrow**, not a rename. `§N` stays the machine identity (every cross-reference, the gate, the ToC and the replay depend on it); the section eyebrow gains `CIRCLE N` so the geometry is visible without breaking the record | Open |
| X4 | Hierarchy: **§1 = the immutable constitution** · §2–§7 doctrine (WHY) · §8–§19 operational (HOW) | Agreed; expressed as three bands in the contents | Open |
| X5 | **Constitutional verbs** — prefer *shall · must · cannot · requires · preserves · guarantees* over *supports · helps · encourages · allows* | Agreed with one carve-out: `guarantees` is the word D6 asks us to qualify. Everywhere else, adopt | Open |
| X6 | Every section ends **operationally**, not philosophically — an Operational Outcome block | Agreed. Folds into the existing NOSE close rather than adding a fifth movement | Open |
| X7 | **Constitutional markers** per section: Purpose · Authority · Evidence · Replay · Qualification · Inheritance | Agreed in reduced form — six markers on nineteen sections is 114 new fields; start with the three that are load-bearing and unbuilt today (Authority · Replay · Inheritance) | Open |
| X8 | **Cross references**: Depends on · Extends · Verified by · Replayed through · Qualified by | Extends already exists on every section. Add *Depends on* and *Verified by* | Open |
| X9 | Four questions every section answers without being asked: **What does this protect? How is it proven? How is it preserved? How does it improve?** | Agreed — this is the cleanest statement of the whole review and it doubles as a pass criterion | Open |
| X10 | Identity: treat this not as a book but as **a replayable constitutional operating system** | Agreed; it is the frame X1–X9 all serve | Open |

---

## 4 · What is already true, and was scored

Recorded because a register that lists only work is not honest about the reviews.

- **Replay engine as architecture** — DeepSeek 10/10, eXeL AI 10/10, Grok "the most distinctive
  technical achievement."
- **Defect register is not performative** — all three. It publishes corrections to corrections.
- **The 33 passes are the right review model** — DeepSeek: *"the single most effective anti-rambling
  device I've seen in governance prose."*
- **ALVAR and the MoT seal are load-bearing**, not decoration.
- **The Cambodian family is the moral centre.**
- **The off switch is the honesty test.**
- **The "We" correction at r18** — DeepSeek calls it the most important single edit in the document.
- **Three views over one record cannot drift apart.**
- **Region, not country** — Grok: the right resolution, dissolves the earlier failure cases.
- **Operator corrections recorded in public** — Grok: *"rare and valuable."*

---

## 5 · Order of work — the remaining passes

Sequenced by value, not by reviewer.

1. **D6** — the word *guaranteed*. One sentence, highest risk in the document.
2. **G2** — §7 as a constitutional commitment.
3. **X1** — the Constitution chapter.
4. **X3 · X4 · X8** — Circle numerals, the three bands, cross-references.
5. **X6 · X7 · X9** — operational close, markers, the four questions on all nineteen.
6. **G4 · D8** — the cold open, and the outline as the promise above the argument.
7. **D4 · D5 · D7** — the four corrections named, §16's weight, §8 renamed.
8. **X5 · G6** — the verb sweep and the price-cannot-move refrain.
9. **D2** — passes at every release.
10. **The reading band** — thirteen sections above the ceiling, §19 below the floor at 9.2.
11. **The 228 readings** — each of the twelve reading every section in succession.
12. **D3** — `/verify/<sha>`; a build item, and the only one that leaves the document.
13. **G5** — the single-reader test, as the release gate for Version 17.

---

## 6 · Still blocking, and only the operator can answer

Unchanged from `docs/V17_OPEN_QUESTIONS_REGISTER.md`: Tier-2 selection · the Global Agreed Standard
(now including the Agreed Wage) · band criteria · the principal floor · the five shutdown thresholds
· the reserve fork (pre-fund vs duration-match) · Accords caps · **defect 22** · membership tier
delineation · **rotate the master credential**.
