# Financial-2525 · Round 1 of 33 — THE TRANSACTION · the reviewer lenses' report, verbatim

The B-38 programme (addendum 126: "SSSES, 12 AsM AAR and UX TEST, and Spiral test … go 33 rounds") resumed on 2026-10-02 under
addendum 161 ("address backlog, make your own decisions MoT"). This is the read-only review of the BUILT page at 73dbcbf (r.072,
LIVE) — twelve reviewer lenses in one pass, every entry through the real form at 320 · 390 · 428 px. It is kept here exactly as it
was returned, before any fix touches the code (PERSIST FIRST); the fold is revision r.073 and its round record is `r073.md`.
The probe scripts and captures it cites (`R1/…`) lived in the session's scratch space and are not carried into the repo.

---

ROUND 1 — THE TRANSACTION · read-only review of the BUILT out/ (73dbcbf, r.072)
I simulated at 320, 390 and 428 px in exel-cyan, with touch, keyboard and the accessibility tree. Every entry went through the real form.
- Cloud: this build carries no Supabase URL, so "not configured" is what it runs. To test the configured path I served a scratch copy of chunk 3596 whose 4 `tP.supabase` calls go to an in-page mock; its rows live in Node.
- Every non-local request was aborted, and none was attempted. The repo is untouched (`git status` is empty).

Abbreviations used below:
- ux = /home/user/eXeL-AI-Polling/frontend/components/financial-2525/command-ux1.tsx
- rec = …/frontend/lib/financial-2525/record.ts
- cloud = …/frontend/lib/financial-2525/cloud.ts
- mot = …/frontend/lib/financial-2525/mot.ts
- ladder = …/frontend/lib/financial-2525/ladder.ts
- R1 = /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/round01 (scripts s1–s8, outputs s*.out.*, captures cap/)

LENS Athena · GRADE B−
- [should-fix] The pencil opens its panel out of sight. With 8 rows, tapping row 1's pencil leaves the panel off-screen at 320 px (top 670 in a 568 px viewport) and at 428 px (top 1225 in 926); only 36 px shows at 390. Done is out of view at all three widths and focus stays on the pencil, so on a phone nothing seems to happen · evidence: R1/s8.out.json, R1/cap/s8-428-after-pencil-tap.png, ux:399, ux:737 · fix: on open, scroll the panel into view and focus Amount (the goTo pattern, ux:412).
- [should-fix] After a save the form folds and focus drops to `<body>`, so keyboard and screen-reader users start again from the top of the page · evidence: R1/s1.out.json save.focusAfter "body" at all 3 widths; R1/s6.out.json keyboard · fix: foldForm (ux:343) returns focus to [data-fin-tx-open].
- [should-fix] In the edit panel, Day and time shows only "2026.09.3". The field is 95/130/149 px wide (320/390/428) against 178 px needed, so the time being edited is hidden · evidence: R1/s3.out.json geo.whenClipped, R1/cap/s3-320-edit-panel.png, ux:740-743 · fix: col-span-2 on that label.
- [nit] The form's close button is 24×24 px · ux:546 · fix: h-8 w-9 like the gears.
- [nit] Enter in Amount or Memo does not record anything; there is no `<form>` (s1 enterSubmits false) · fix: wrap the fields in `<form onSubmit>`.

LENS Christo · GRADE C+
- holds: the pencil sits on the right of every row (B-52). Every edit is appended and the original's hash is unchanged (B-45). A card payment counts once (B-53).
- [should-fix] "Put back my entries" shows while the account copy is still loading. Tapped in that window:
  - his 4 entries move to a hidden fin-record-kept row;
  - the new phone shows 2 entries (his −250.66 and −38.22 vanish);
  - the account row is overwritten from 4 entries to 2.
  · evidence: R1/s7.out.json restoreRace, R1/s7b-race-cloud.mjs → {"accountRowEntriesBefore":4,"accountRowEntriesAfter":2}, R1/cap/s7-390-restore-race.png, ux:589 · fix: add `cloudReady &&` to the panel's condition. Krishna's union fix also makes a tap harmless.
- [should-fix] Pressing Done with nothing changed appends a correction and marks the row "Edited" (3 → 4 entries) · evidence: R1/s7.out.json order.noOpEdit, ux:400-409 · fix: if no field changed, close the panel without appending.

LENS Aset · GRADE C+
- [should-fix] In the pencil, a length of "abc" or "-1" is refused with "Enter a shorter length", which is the wrong instruction · evidence: R1/s3.out.json E5, ux:404 · fix: split the check — non-finite keeps "shorter"; NaN or negative gets a new staged key.
- [should-fix] Three messages stay after they stop being true:
  - "failed its chain — shown empty" stays after the account copy restored the record;
  - "would not save … kept in memory only" stays after a later good save;
  - that same message says "memory only" while the cloud mark reads "Saved to your account".
  · evidence: R1/s7.out.json chainRescue, R1/s4.out.json full.warnAfterGoodSave, R1/s5.out.json e, ux:187-189, ux:349 · fix: setTampered(false) when the merge adopts a copy (ux:258); setSaveFailed(false) on the next good save.
- [nit] Small inconsistencies in wording and order:
  - the pencil's refusals lack the "Refused ·" prefix (ux:408 vs 386);
  - a withdrawal names the stamp before the amount; a deposit checks the amount first (ux:377-384 vs 365-368);
  - a withdrawal's refusal stays on screen after switching the type to Deposit (s6 backward; chooseType ux:337 doesn't clear it);
  - an empty record says "No deposits on the record yet" (ux:713);
  - the form's "Amount, $" ignores the picked currency (ux:556);
  - the broken-chain title is a five-line technical sentence at 320 px (cap/s6-320-chain-broken.png).

LENS Asar · GRADE C
- holds, Spiral forward and backward at all three widths:
  - the door focuses Type; Type is blank and "Record it" disabled until a type is picked;
  - a save folds the form and moves the figures (+3,604.49 → Available $187.13, In Escrow $3,417.36);
  - the Record is chronological and re-sorts after a date edit; amounts are signed and coloured; the hash shows 8 hex characters; ✎ names the correction's revision;
  - a refused edit appends nothing; reload keeps rows, hashes and figures; nothing can be deleted;
  - no page-level sideways scroll in any state measured.
- [suggestion-needs-HI] A corrected row cannot show what it used to say; the ✎ title lists only revision numbers (ux:725). Show the original values on tap?

LENS Enki · GRADE C
- [should-fix] The amount parser accepts things it shouldn't and refuses things it should accept:
  - "Infinity" and "1e400" are accepted, in the form and in the pencil. The card shows $∞ and In Escrow $NaN; the row reads +∞, then +0.00 after a reload, so the record changes meaning.
  - "0x10" records $16.00.
  - "1,234.56" and "$50" are refused with "Enter an amount above zero".
  · evidence: R1/s2.out.txt, R1/s3.out.json E6, R1/s1.out.json refusals, R1/cap/s2-390-infinity-card.png, ux:365-367, 384, 402-403 · fix: one parser for form and pencil — strip "," and the currency symbol, require /^\d+(\.\d{1,2})?$/, finite and under a ceiling.
- [should-fix] Impossible dates are moved silently: "2026.02.31_07.00..00" records 2026.03.03, and "0050.01.01" records 1950 · evidence: R1/s2.out.txt, mot:204-210 · fix: refuse unless cstParts(result) gives back the typed year, month and day.
- [should-fix] Length "Other" with a blank, negative or non-numeric number silently saves as One time, so the whole amount lands at once · evidence: R1/s2.out.txt other-*, ux:370, 379, ladder:187 · fix: refuse when rec==="other" && !(Number(otherN)>0).
- [nit] At 320 px an absurd amount wraps Released onto three lines (cap/s2-320-huge-card.png).

LENS Enlil · GRADE D
- [blocker] The pencil's Length has no effect on a Monthly entry, and can leave the Record contradicting the figures. Monthly is the deposit default, so this covers most of his entries.
  - 30 → 7 appends correction ✎5, but the row still reads 30 and no figure moves.
  - 30 → blank makes the row read One time, while the figures keep spreading it over 30 days.
  - Afterwards the panel shows 7 while the row shows 30.
  · evidence: R1/s3.out.json E1/E2 at all three widths, R1/cap/s3-320-edit-panel.png · cause: the correction inherits recurrence "paymot" (rec:55), and withMonthLaw forces paymot to 30 days (ladder:180) on every read (ux:192, ux:723) · fix: in saveEdit (ux:406), add `recurrence: days>0 ? "other" : "once"` when the typed length differs from withMonthLaw(cur).motDays (TxEdit already allows it, rec:50); openEdit (ux:399) shows the effective length; add a gate.

LENS Krishna · GRADE D
- [blocker] With two tabs or two devices, a finished entry disappears from the Record and from the figures.
  - Two tabs: 10 entries recorded alternately → 5 visible after reload. Tab A's 5 exist only in 8 hidden exel-fin-kept copies that no screen reads.
  - Two devices (mock cloud): each shows only its own entry; the other's goes into a hidden fin-record-kept row.
  - An open tab never sees the other tab's entry (A shows $100 Available, B shows $200).
  · evidence: R1/s4.out.json twoTabs, R1/cap/s4-390-two-tabs-after.png, R1/s5.out.json c.
  The whole class:
  - rec:110 — saveRecord keeps the stored copy aside instead of merging it in;
  - cloud:53 — mergeRecords keeps the cloud copy aside on divergence;
  - ux:271 — pushAll puts without reading first;
  - ux:189 — no storage listener for the record;
  - keptRecords is never read by any screen.
  · fix: one pure unionRecords(base, other) in record.ts that appends every transaction of `other` whose id `base` lacks, in order (new links, so the chain stays valid). Correction ids `c-<id>-n` (rec:54) can collide across tabs and need a re-id. Use it in saveRecord, in mergeRecords, and in pushAll (get → union → put), and add a `storage` listener. Gate: two tabs × 5 alternations → 10 entries visible.

LENS Odin · GRADE F
- [blocker] A page left open for 12 hours writes the account back to how it was when the page opened: record, budget and cards.
  - Record: 2 entries were pushed; after fastForward(12 h) the push carried 0, and a second device signs in to an empty record.
  - Budget: his edit Rent 700 → 777 reached the account. After 12 h the account held 700 again, under the 777 edit's timestamp, and a second device shows 700.00 (his addendum 114, "STOP WORKING BUDGET").
  · evidence: R1/s5.out.json d (putsAfterJump [2,0], secondDevice []), R1/s6.out.json budget, R1/cap/s6-390-second-device-budget.png · cause: the [cloudReady] effect keeps that render's pushAll for setInterval and due() (ux:282-289), and pushAll reads record, plan and cards from that old closure (ux:267-278) · fix: store the latest pushAll in a ref each render and call it from the interval and from due(). Gate: after fastForward 12 h, the pushed record and plan equal the device's.
- [should-fix] Kept copies grow without bound: every save from a stale tab writes another whole copy (8 after five alternations) · evidence: s4 twoTabs.seq, rec:110 · fix: goes away with Krishna's union.
- [nit] A push that failed offline is not retried when the network returns · fix: retry on window 'online'.

LENS Thor · GRADE C
- [should-fix] When device storage is full or failing, the entry exists only in memory, the form folds and clears, and a reload loses it if the account copy is off: full went 2 → 1 entries, failing 1 → 0. With the account on, the reload restores it · evidence: R1/s4.out.json fullReload/failing, R1/s5.out.json e, R1/cap/s4-320-storage-failing.png, ux:349, 373, 387 · fix: when saveRecord returns false, keep the form open with its values, announce with role="alert", and clear on the next good save.
- [nit] mergeRecords adopts the cloud copy without running verify() (cloud:47-53).

LENS Thoth · GRADE B+
- holds: the figures add up to the cent in every state measured, his own record included: In Escrow + Released = Deposited (1,404.66 + 2,519.83 = 3,924.49) and Released − Spent = Available (2,519.83 − 2,488.22 = 31.61). On cards: a purchase raises the balance and lowers Available once; Pay card lowers the balance without touching Available again; an overpayment counts only the part no purchase covers (R1/s3.out.json cards). Only Infinity breaks these identities.
- [nit] The Length column shows days with no unit, so 3 hours reads "0.125" (ux:723).

LENS Sofia · GRADE C−
- [should-fix] The Record's summary is announced only as "Show or hide the record". Its title, the cloud state and the broken-chain warning are never read out · evidence: R1/s6.out.json a11y.summary and chain.summaryAx, ux:698, 702 · fix: drop the summary's aria-label; give the cloud mark role="img".
- [should-fix] Every pencil is named "Edit transaction", so no row can be told apart · ux:728 · fix: add the revision number, amount and date to the label.
- [should-fix] The Other unit picker has no accessible name · R1/s6.out.json a11y.otherUnit, ux:109 · fix: add an aria-label.
- [should-fix] Refusals and the save warning are not announced (no role or aria-live) · ux:541, 583, 750 · fix: role="alert".
- [nit] The edit panel's labels reach the accessibility tree in capitals ("AMOUNT, $") (ux:741-744).

LENS Pangu · GRADE B
- [suggestion-needs-HI] A mistaken entry cannot be neutralised: the record is append-only and the pencil refuses 0, so a duplicate deposit inflates Available for good (ux:403). A zero-amount correction would keep the original on the record.
- [suggestion-needs-HI] The category cannot be corrected. A withdrawal starts on Rent / Mortgage (ux:337), and the pencil offers no Field even though TxEdit allows one (rec:50).
- [nit] Seen in passing, for the chart round: the boxed day label covers the y-axis "$0.0000" label — the same thing he flagged for the x-axis in addendum 149 (R1/cap/s8-428-after-pencil-tap.png).

VERDICT: FIX — the form, the refusals, the Record and the figures hold, but three paths break "a finished entry is never lost": the Monthly length edit, the two-tab and two-device write paths, and the 12-hour stale push (which also reverts his budget); COUNT: 3 blockers / 16 should-fix.
