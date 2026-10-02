# Financial-2525 · r.073 — the second pre-push review, verbatim

Four reviewer lenses walked the BUILT page of r.073 (frontend/out, stamp 2ea757e) after the first pre-push review was folded (88bec83,
27384f5, 2ea757e). Each lens ran read-only: no edit, commit or push in the repository. Their reports are kept here exactly as they came
back, before any fold touches the code. The scripts they cite lived in the session's scratch space and are not carried.

Tally: 2 blockers (Thor, Krishna) · 9 should-fix · nits · 2 questions for the operator (Enki, Krishna).

---

## Enki + Enlil

LENS Enki + Enlil · GRADE C+

Scope: the built page in frontend/out (its stamp reads SHA 2ea757e), walked through my copy of the harness at 390 px. Scripts are in the scratchpad at r073-review2/enki/ (form.mjs, budget.mjs, cards.mjs, editor.mjs, misc.mjs, pure.mjs), with screenshots in enki/cap/. The repository was not touched.

**What holds**

- **Form amount** (22 inputs typed, then a reload):
  - Recorded exactly as typed:
    - 1,234.56 → 123,456 ¢
    - $50 → 5,000 ¢
    - 999,999,999,999.99 → 99,999,999,999,999 ¢
    - 50. → 5,000 ¢
    - .55 → 55 ¢
    - Under BRL: R$ 12, R$12, R$ 1,234.56 and $ 5.
  - Refused with "Enter the amount in digits, like 1,234.56": Infinity, 1e400, 1e3, 0x10, 12,50, R$ 12 under USD, −50, +5, $-5, 50$, １２ (full-width), "1 234", 0.001, a trillion.
  - Refused with "Enter an amount above zero": blank, 0, 0.00.
  - All 15 ledger rows were identical after the reload.
- **Day and time:**
  - 2028.02.29, 2000.02.29, 1900.01.01 and 9999.12.31_23.59..59 were recorded and read back as typed.
  - "That day or time does not exist" for 2026.02.29, 2100.02.29, 2026.02.31, hour 24, hour 25, minute 61, second 60 and year 0050.
  - "2026.10.01 10:00" gets the format sentence.
- **Other length:**
  - Accepted: 0.125 days → 0.125, 2 years → 730, 1.5 hours → 0.0625.
  - Refused with "a number above zero": 1e3, Infinity, 0x10, 12,50, 1,000, −1, blank, 0.
  - Refused with "Enter a shorter length": a trillion days, a trillion years, 1,000,000 years.
- **No NaN or Infinity anywhere:** with these extremes on the record (999,999,999,999.99, a 6.9e-11-day length, 9999 and 1900 entries), I scanned the page in all 9 budget units and 4 rate units, and again after a reload. "NaN", "Infinity" and "undefined" each appeared 0 times.
- **Editor (addendum 164):**
  - Each kind opens on what it is: Monthly → paymot, Weekly → weekly, Quarterly → month91, Other → other / 0.125 / days, One time → once, the card purchase → paid from the card.
  - Done with nothing changed appended nothing on all 6 kinds (6 → 6 entries).
  - 11 one-field changes each moved exactly that field, one correction each. A length change moves motDays and recurrence together; Monthly → Weekly took effect.
  - 5 refusals appended nothing: Other 1e3, R$ 12 under USD, 0x10, 2026.02.31, a blank day.
  - All rows were identical after a reload.
- **Union renames the entry under an open pencil.** Setup: the same id on both copies, 100.00 mine and 200.00 theirs, with 150 typed before the union arrived.
  - Other copy kept its place: mine became ~2, the panel moved from #1 to #2, Done set ~2 to 150.00, theirs stayed 200.00.
  - My copy kept its place: Done edited mine, theirs (~2) stayed 200.00.
- **Cards:**
  - Adding 3,000 / 735.27 with the levels blank gave 300,000 / 73,527 / 150,000 / 200,000 ¢.
  - "$3,500" saved as 350,000 ¢.
  - 18 malformed figures were refused and left the card unchanged (12 in the gear, 6 in the add form).
  - The card read back the same after a reload: no Infinity card and no 0.
- **Budget:** 1,234.56, $50 and 0 apply exactly, as do R$ 12 and R$ 1,234.56 under BRL. Per second, 0.000386 is held as 1,000.512 per 30D.
- **Gates at the current HEAD 996d60e:** financial-accrual 137/0, financial-surface 221/0, financial-rate 22/0.

**Findings**

- [should-fix] **The budget field writes every keystroke that reads, so a refused final figure leaves its last readable prefix on the line, with no sentence.**
  - Code: ux:390 `typeAmount`, plus ux:856, where blur drops the draft.
  - Evidence (budget.mjs, Rent at 700.00 /30D, one key at a time after select-all):
    - 1e3 → 1.00
    - 0x10 → 0.00
    - 12,50 → 12.00
    - 1e400 → 1.00
    - a trillion → 100,000,000,000.00 (Net −99,999,997,825.90)
  - After backspacing the field instead: −50 → 7.00 and blank → 7.00, the old figure's first digit.
  - −50, Infinity, abc, a blank after select-all, and every paste: the field silently snaps back to 700.
  - "1e3" survived Done and a reload: the line stayed 1.00 and Net went from 1,474.10 to 2,173.10. The account sync sends that figure too (ux:374).
  - What is new: in r.072, 1e3 gave 1,000 and 0x10 gave 16. The 12,50 case and the cleared field behaved the same way before.
  - The gate (financial-accrual:399–400) tests whole strings only, so its claim "0x10, 1e3, 12,50, a sign, Infinity and one trillion never set a line" does not hold on the page.
  - Fix: remember the line's value when the field takes focus. When the draft does not read, write that value back and show `fin.reason_amount_form` under the field. On blur, keep an unreadable draft (or read a blank as 0). Gate each prefix of "1e3", "12,50" and "1000000000000".
- [should-fix] **Regression from this fold: a card with a credit balance can no longer be edited.**
  - Cause: the gear prefills the balance as `(bal/100).toFixed(2)` = "-264.73" (ux:1197). `parseCardCents` refuses the sign (typed.ts:60), so the value is NaN and no longer equals `bal`. `applyCardSettings` then re-bases the card at NaN and returns null (ux:1202, cards.ts:80).
  - Evidence (cards.mjs, cap/card-credit-gear-390.png): Pay card 1,000 on a 735.27 card gives Balance −$264.73.
    - Changing only the amber from 1,500 to 1,000 is refused.
    - Renaming to "Visa Gold" is refused.
    - Both show "Check the numbers: amber must be at or below red, and red at or below the limit."
  - pure.mjs: r.072's reader saved the same edit and kept the opening.
  - The pencil reaches the same state: a card purchase moved to Debit and set to pay the card gives −$25.00.
  - Fix: in save(), treat a balance left exactly as shown as unchanged: `draft.opening.trim() === (bal/100).toFixed(2) ? bal : cents(draft.opening)`. Gate it with a negative balance.
- [should-fix] **Card figures: every unreadable figure is reported as a levels problem, and the currency's own symbol is refused.**
  - Evidence: all 18 refusals showed the levels sentence ("amber must be at or below red…"), whatever the actual fault.
  - With BRL, a limit of "R$ 3,000" is refused with that same sentence, while the form and the budget accept it. pure.mjs: NaN without the symbol list, 300000 with ["R$"].
  - Cause: ux:1186 passes no currency symbols to `parseCardCents` (financial-accrual:426 pins that exact line), and ux:1211 knows only two refusals, "levels" and "name".
  - Fix: pass the currency symbols to `parseCardCents`. When any figure is NaN, show `fin.reason_amount_form` (already filled in 33 languages) instead of `fin.card_bad`. Update the pinned gate.
- [should-fix] **Per second, six decimals are kept but the edit field shows four.**
  - Code: `editFigure` rounds to 4 decimals below 100 (ux:393).
  - Evidence (budget.mjs, cap/budget-persec-000039-390.png):
    - Typing 0.000039 (= 101.09 per 30D) shows "0" in the field and "0.0000" outside edit mode.
    - The 89.73 Subscriptions line and the 100.00 Fun line show "0" at /sec.
    - Typing 0.000386 (= 1,000.51) shows back as "0.0004", which retyped becomes 1,036.80.
  - Fix: show six decimals when |v| < 0.01. This extends r.026's own rule that retyping the shown figure never moves the line.
- [nit] **A trillion is refused with the wrong reason.** The form and pencil say "Enter the amount in digits, like 1,234.56", but he did type digits. `amountProblem` has no "too large" case (typed.ts:28). Fix: add "Enter an amount below one trillion", staged in AFTER_FILL.
- [nit] **The Other length refuses 1,000 and 12,50 with "a number above zero",** while the amount field accepts 1,000 (typed.ts:34). Fix: accept thousands commas there too, or name the expected form in the sentence.
- [nit] **A blank Amber in the card gear saves 0.00,** so "⚠ Amber Alert · Visa $735.27" sits at the top of the cockpit permanently. The add form reads the same blank as half the limit (ux:1193 vs ux:1202). Fix: read a blank level in the gear the way the add form does.
- [nit] **A 0.5-minute Other length reads "0".** The record's Length column shows 0, and the pencil opens it as Other "0" days (ux:562 rounds to 3 decimals). Changing only its unit is then refused with "a number above zero" (misc.mjs).
- [nit] **The pushed bytes are not the reviewed bytes.** e295436 (addendum 171, chart marks) landed at 17:40, after the build I walked; frontend/out (17:27) does not include it. My lens's files (command-ux1.tsx, typed.ts, cards.ts, record.ts) are identical from 39c0c78 to 996d60e, so these findings hold at HEAD. I did not walk the chart change: rebuild and walk it before the push.
- [suggestion-needs-HI] **A line typed per Standard Month (/1M) is stored on the 30-day month, so its figure changes with the month.** 1,000 typed in October reads 967.74 in November and 903.23 in February (pure.mjs). Ask him: should a figure typed per calendar month stay the same every month?

VERDICT: FIX-FIRST — the form, the date box, the Other length, the editor and the union rename all hold. But the budget field still silently sets a wrong figure (1e3 → 1.00, 0x10 → 0.00, a cleared field → the first digit) that survives a reload, and this fold made a card with a credit balance impossible to edit. All four should-fixes are a few lines each. COUNT: 0 blockers / 4 should-fix.

---

## Thor

LENS Thor · GRADE C

How this was run:
- Every run used the BUILT page (frontend/out, stamp 2ea757e; it did not change during the runs).
- The harness is my own copy of lib.mjs. It adds: refused account writes, read and write delays on the server, the entries each write carried, a full-phone rule that survives a reload, and the page's own Auth0 reducer to sign out or switch person in page.
- ux = frontend/components/financial-2525/command-ux1.tsx. The file is identical at 2ea757e and at HEAD 996d60e (the newer commits touch only rcore-chart.tsx).
- T = /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/r073-review2/thor
- The repository was not touched (git status is clean).

**Holds**
- holds — full phone, every "exel-fin:" write refused (T/t1-fullphone.mjs, 21/21, with and without the account store):
  - 250 recorded → the form stays open on "Try saving again".
  - Amount changed to 260, retried while still full → 1 row, +260.00 (never 250 plus 260).
  - Changed again to 270 and 09.30 → still 1 row, carrying both changes. The device copy holds none of it while full.
  - Storage freed, retried → the form folds and no warning is left.
  - Reload → 2 rows (first +100.00, while full +270.00). Available reads $370.00 before and after.
  - The device and the account each hold the original plus 2 corrections: one transaction.
- holds — budget, the brief's model (every "fin-plan-" write refused):
  - The budget shows its own sentence; data-fin-save-failed is absent.
  - A deposit that saved fine leaves that sentence standing.
  - With room again, the next change clears it.
- holds — the note against the account (device refusing; account read 2 s, write 1.5 s; T/t3-saved-claim.mjs 3a/3a'):
  - 490 samples, one every 40 ms. In none did the note or the cloud mark claim the account before the write that held the entry.
  - That includes an entry recorded while a write was in flight: it reads "saving" until the next sync sends it.
- holds — offline at sign-in, cloud.failReads (T/t4-offline.mjs, 7/7):
  - Put back my entries stays hidden and 0 writes are made.
  - 'online' while reads still fail → still hidden, still 0 writes.
  - Reads restored + 'online' → it shows.
  - An entry recorded while unreadable → 0 writes; once reads return, the account is read first and then the entry goes up.
  - With no 'online' event at all, the 30-second retry (fake clock) reads, and then the button shows.
- holds — sign-out or switch while a sync is reading (T/t5-switch.mjs 5a/5b):
  - LOGOUT during the read → 0 writes after it.
  - Switch to person B during A's read → A's account holds [A-private], B's account [B-private], B's device copy [B-private].
- holds — gates at HEAD: financial-accrual 137/0, financial-surface 221/0.

**Findings**

- [blocker] On a really full phone, the new tie repair (FD-97) sends the device's OLD budget or cards over the account's newer copy. The typed budget line or card is lost on every device, and in the two-device case nothing is said.
  - Why a real full phone does this: a browser at its quota refuses a write that makes storage grow, but takes a rewrite of the same size.
    - The budget or cards data is refused; the 13-character time key (fin-plan-at: / fin-cards-at:) is still written. The refused-key list showed only fin-plan-<owner> / fin-cards:<owner>.
    - The device then holds old content under a new time, and the next sync takes "same time, other lines" for the r.072 revert and pushes the old copy.
    - His phone hit "The quota has been exceeded" on this origin (AAR 2026-09-09), and the sign store keeps PDFs here.
  - Evidence (T/t2b-budget-realfull.mjs, rule: refuse only what grows):
    - One phone: a budget line 111 → 99999. The device refused it and said so, and the 99999 reached the account. One reload → account 111, page 111.
    - Two devices: the laptop types 22222 later; the full phone only opens the page twice. Open 1 shows 22222 with no sentence, while its device keeps 111 under the laptop's time. Open 2 → account 111; the laptop reads 111 after its reload.
  - Evidence (T/t7-cards.mjs):
    - Card Beta added on the full phone: no alert.
    - The account held [Alpha, Beta]; the device held [Alpha] stamped with the account's time.
    - One reload → the account holds [Alpha].
  - Under the brief's model (every "fin-plan-" write refused, the time included) it holds. The loss needs the time to fit, which a real full phone allows.
  - Cause: a time is stamped for content the device did not keep, and a tied time sends this device's copy.
    - ux:272 — writePlan writes the time even when savePlan returned false.
    - ux:328 — taking the account's budget ignores savePlan's false.
    - ux:334 and ux:346 — the tie branches write only the time.
    - ux:329-333 and ux:343-345 — on a tie, this device's copy goes up.
    - r.072 wrote nothing on a tie (6927bb1, ux:310). The gate (financial-accrual:428) only reads the source line.
  - Fix:
    - Stamp the time only together with content the device kept: writePlan `if (kept)`; adopting `if (savePlan(…)) stamp; else setPlanFailed(true)`; tie branches write the content and its time in one try.
    - Give the cards their own "would not keep" sentence, like the budget.
    - Behaviour gate: savePlan returns false while the time write succeeds; reload; the account keeps the newer lines.

- [should-fix] The cloud mark still says "Saved to your account" for an entry the account does not hold. Fold #5 / FD-98 covers only the refused save.
  - Evidence (T/t3-saved-claim.mjs 3b):
    - Device saving fine, then a new entry → green "Saved to your account" for 1,179 ms (29 samples) while the account lacked it.
  - Evidence (T/t3c-check.mjs):
    - Typing a budget line once a second → green for 12.5 s (12 of 12 samples) while the account lacked the entry just recorded. It arrives once the typing stops.
  - Cause:
    - ux:205 switches the mark from saved to saving only when the device refused.
    - writePlan (ux:272) and saveCards (ux:262) never switch it.
    - The 1.5 s pause (ux:374) restarts on every change.
    - The gate (financial-accrual:418) checks only the refused path.
  - Fix: on every change to the record, budget or cards, run `setCloudState((c) => (c === "saved" ? "saving" : c))`.

- [nit] The panel says LESS than happened, and keeps saying it (T/t3 3d and 3a).
  - Pressing "Try saving again" with nothing changed while still full flips the mark to "Not saved to your account yet". Once the form is folded, the note reads "the entry is kept in memory only" while the account holds it. Measured 20 s with no recovery.
    - Cause: persist runs ux:205 even when the record has not changed. No sync follows: the record is the same object and nothing marks it unsent.
  - Every later sync (the read-back, the 12-hour sync, the return to the page, 'online') flips the note from "saved to your account" to "kept in memory only" while it runs. Measured: 2 s with a 2 s read.
    - Cause: the note keys off the passing cloud state (ux:742, ux:296).
  - Fix: switch the mark only when the record changed, and choose the note from "the last sync held this record", not from the cloud state.

- [nit] "Kept once per copy" fails on a full phone (T/t6-kept.mjs).
  - Setup: an account copy that fails its chain, an empty record, and a fingerprint key the phone cannot store.
  - Result: 3 copies set aside in the account at open, 9 after 5 more syncs (1 with room).
  - Cause: the fingerprint lives only in device storage (ux:309-310).
  - Fix: also keep it in memory (a ref), so it is at most once per page load.

- [nit] A switch to another person, caught at the exact moment of the switch, writes each person's data under the other (T/t5-switch.mjs 5c).
  - Setup: a sync starts between the render that names B and the effect that drops A's account key ('online' fired at that commit).
  - Result: A's account holds [B-private, A-private]; B's device copy and B's account hold [B-private, A-private].
  - Cause:
    - The account key is captured from the previous person (ux:292).
    - here() checks only the person (ux:295), and passes once B's record has loaded; the key is cleared one effect later (ux:285).
  - Not reachable from this page today: auth0-react 2.14's logout navigates away and never changes the person in page.
  - Fix: keep the key together with its owner and require that owner to match, or add `cloudKeyRef.current === key` to here().

VERDICT: FIX-FIRST — on his full phone the new tie repair overwrites the account's newer budget or card with the device's older copy, without a word in the two-device case (measured: 22222 → 111 on every device; card Beta gone after one reload); the fix is small and needs one behaviour gate; COUNT: 1 blocker / 1 should-fix.

---

## Krishna

LENS Krishna · GRADE C+

Scripts are in K = /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/r073-review2/krishna. ux = frontend/components/financial-2525/command-ux1.tsx. Nothing in the repo was touched; the reviewed files are unchanged at HEAD 996d60e.

- holds: The first review's blocker is fixed.
  · Pure (K/b1-blocker.mjs): the laptop alone, 100 → 120 → 150 → 120, reads 120.00, Available 120.00.
  · United with the phone's 5.00 withdrawal (recorded just before the first edit), both orders: 120.00, Available 115.00, 3 corrections kept, verify ok, the same chain either way, and uniting again adds nothing.
  · Also 120.00 / 115.00 when the three edits fall inside one clock tick (nextAt stamps +0/+1/+2 ms), with the phone's clock 10 min ahead, and when the phone also edits in between (the newest edit wins).
- holds: The same story on the BUILT page, two browsers, one account. The mock returns rows in jsonb key order. (K/walk-blocker.mjs)
  · Both orders: phone and laptop each show +120.00 and −5.00, Available $115.00.
  · The account holds 5 entries (3 corrections). 0 page errors.
- holds: Fuzz (K/fuzz.mjs), 6,400 runs, all zero.
  · Setup: 2–3 devices and one account with no compare-and-set. Edits pick from 3 values, so A→B→A reverts are common; some edits change the kind.
  · Also: racing syncs, including 3-way races where some read-backs never run; tab unions; clocks up to ±30 days apart and clocks moved back.
  · Ids: the app's own ids, plus a forced-collision pool that produces about 1,200–1,500 x→x~k renames per 400–500 runs.
  · Results: 0 non-converged, 0 missing or doubled transactions, 0 missing corrections, 0 wrong final values, 0 causality violations, 0 unverified copies, 0 re-unions that added anything.
  · The oracle catches regressions. Putting back the old `said` (no `at`): 48–50 wrong values and 226–230 missing corrections per 400 runs. Removing nextAt from correctTx: 152–155 causality violations per 400.
  · Identical corrections at the same `at` on two lagging-clock devices (both get nextAt = L+1): 4–7 per 500 runs, merged harmlessly. Different contents tied at the newest `at`: 5–8 per 500, they converge.
- holds: followId on the glass (K/walk-follow.mjs, K/walk-retry.mjs).
  · The pencil stays on MINE while another tab's save renames it to id~2. Done edits MINE (100 → 150); OTHER stays 200.00.
  · Full phone: the union renames the unsaved entry; the memo fix becomes a correction of id~2 and saves once there is room. Nothing doubled; the chain verifies.
  · Pure: x → x~2 → x~4 across two renames, still the 100 entry.
- holds: Checked against the real account store: migrations 028–030 on a throwaway PostgreSQL 16.13 in K.
  · The budget's tie repair writes once, then stays stable; the second device takes 777 (K/plan-tie-pg.mjs).
  · Today's plan lines come back with their keys in the same order. The record still verifies after the jsonb round trip.
  · Gates: financial-accrual 137/0, financial-surface 221/0.
- [blocker] The cards' tie repair rewrites the cards row on every sync and has overwritten a newer card edit made on another device.
  · cause: ux:343 compares JSON.stringify(cc.cards) with JSON.stringify(cardsRef.current). The store keeps payloads as jsonb (030:134), and jsonb hands keys back shortest-first.
    – Sent (newCard, cards.ts:65, also r.067's seed): {id, name, limitCents, openingCents, openingAtMs, amberCents, redCents}
    – Read back (measured on PG): {id, name, redCents, amberCents, limitCents, openingAtMs, openingCents}
  · So identical cards read as "same time, different cards", and ux:344 re-sends them under Date.now(). This happens on every sync of the device whose cards are still in its own key order; mergeCards keeps objects as they are (cards.ts:84).
  · That breaks the rule at ux:288 ("the cards from the account only when they were edited later"): a re-stamp that is not an edit beats one that is.
  · evidence (K/cards-pg.mjs: the branch verbatim against the real innovation_state_put/get):
    – 5 phone syncs → 5 card writes (control store: 1).
    – The laptop renames the card offline; the phone syncs; the laptop comes back online. Laptop, phone and account all read "Capital One". Control: "Capital One Quicksilver" on all three.
  · evidence (K/walk-cards.mjs, built page; the mock's jsonb emulation matched PG on the record, cards and plan payloads, K/jb-check.mjs):
    – Card added, then 2 transactions → 6 card writes (control: 2).
    – The laptop's offline rename is lost once it reconnects: it shows "Capital One", and so does the account. The control keeps the rename.
  · By the code (inferred, not measured on his phone): his cards are in that key order and his phone pushed them, so after the deploy every phone sync rewrites them. That is 2 writes per recorded entry, counting the read-back.
  · Why nothing caught it: the only gate is a regex (financial-accrual.test.mjs:428), and lib.mjs's mock keeps keys as sent.
  · Same class on the budget: a plan line still carrying r.021's keys (amount, rec, otherN, otherUnit — plan.ts:26/35 keep them) also comes back reordered (measured) and would trip ux:329.
  · fix: compare without regard to key order — export record.ts's stableJson and use it at ux:343 and ux:329. Add a gate: a row whose keys come back shortest-first causes no write. Make the mock return keys in jsonb order.
- [should-fix] The clock fix (nextAt) covers the record only. The budget and cards still stamp raw Date.now() (ux:272 writePlan, ux:262 saveCards, ux:332/344 the repairs).
  · On a lagging clock, an edit made after seeing the account copy is replaced by that device's own next sync (ux:328/342). Unlike a correction, the lost edit is kept nowhere.
  · evidence (K/plan-clock.mjs, the branch verbatim): laptop clock 5 min behind. The phone sets rent to 1,500; the laptop takes it, then types 1,550. The laptop's sync adopts 1,500, and laptop, phone and account all read 1,500.
  · fix: use nextAt's rule here too — stamp max(Date.now(), the stored "-at" + 1) in writePlan and saveCards, and max(Date.now(), cp.at + 1) or (cc.at + 1) in the repairs.
- [suggestion-needs-HI] Two devices editing different fields of one entry before syncing: the newer correction re-states every field, so the other device's change disappears from the screen. Both corrections stay on the record.
  · evidence (K/follow.mjs): phone sets memo "Rent — October" at 10:01; laptop sets amount 1,550.00 at 10:02. United, both orders: 1,550.00 · "Rent".
  · ask him: keep "the newest correction wins whole", or record which fields each correction changed and merge field by field?

VERDICT: FIX-FIRST — the record's union is now right (blocker reproduced fixed, both orders on the built page, 6,400 clean fuzz runs), but the fold's card tie repair, run against the real store's jsonb key order, rewrites the cards on every sync and overwrote a newer card edit in the walk; the fix is one order-insensitive comparison plus a behavioural gate; COUNT: 1 blocker / 1 should-fix.

---

## Athena + Sofia

LENS Athena + Sofia (the glass, addendum 165 and 168, how it reads) · GRADE B

A = /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/r073-review2/athena. Screenshots are in A/cap.

Partial:
- iOS was emulated: the focus zoom is a CDP page scale plus panning, and the keyboard was not emulated.
- No real VoiceOver. Announcements were measured by counting new [role=alert] elements entering the DOM, and names were read from Chromium's accessibility tree.

**Holds — the full screen, addendum 165 (A/fs2.mjs → A/fs2.all.out.json)**
- Cases run: 5 screens (320×568, 375×667, 390×844, 428×926, 844×390) × zoom 1 / 1.14 / 1.33 / 1.6, in a mobile context. Three positions of the visible screen in each:
  - top-left;
  - panned right by a real tap path;
  - the iOS cause: the editor's Amount box focused (measured 14 px), page zoomed and panned to it, then scrolled back up to the chart.
- 54 of 54 opened cases: the layer equals window.visualViewport within 1 px, with offsets up to L=316, and T=209/213 when panned down (A/fs6.mjs).
- 0 controls outside the visible screen sideways. The layer's scrollWidth equals its clientWidth, so overflow-x-hidden clips nothing. The document's scrollWidth equals innerWidth.
- The ✕ is inside the screen and wins the hit test in 54/54. On screen it measures 36×32 px at rest and 57.6×51.2 px at ×1.6. A real touch tap on it closed the layer 4/4.
- One forced-click flake at 375×667 ×1.14 (edit placement): the layer did not open. The re-run opened and fit.
- The controls row wraps at 320 ×1.33/×1.6, 375 ×1.6 and 390 ×1.6. Clock · MoT and the gear move to line 2, right-aligned, 12 px from the edge. No control overlaps another (0 of 54).
- Canvas labels, read with a fillText spy that keeps the full transform: every label of the last paint is inside the canvas, 54/54.
- Rotating portrait → landscape → portrait while open, at 390 and 320 × zoom 1 and 1.33, and panning while open: the layer followed every change (A/fs3.mjs, A/cap/rot-*.png).
- Escape and ✕ both close it. body overflow returns to "" every time and the page scrolls again (+87 px).
- Gates, run read-only:
  - financial-surface: 221 passed, 0 failed;
  - financial-accrual: 137 passed, 0 failed;
  - fin-layout-smoke: 55 passed, 0 failed (FIN_SMOKE_PORT=47391).

**Holds — Sofia (A/s1.mjs, A/s2.mjs, A/s3.mjs)**
- Repeated refusals are announced again:
  - form: the same refusal twice gave 2 new alert elements;
  - editor: 2 of 2;
  - a different refusal gave a new element.
- The budget's save warning (A/cap/sofia-budget-warning-320.png):
  - has role=alert and the budget's own words;
  - the record's warning does not show with it;
  - fits at 320 (box 50–270);
  - disappears after a good save.
- Try saving again:
  - the first failure is announced and focus stays on the button;
  - after the device frees space, the form folds, focus goes to + Transaction, and there are 2 rows (no double).
- The unit picker's accessible name is "Length unit" (from aria-label), in the form and in the editor. The number box reads "Other Days".
- Tab order matches the visual order:
  - form: Type → Amount → Day and time → Section → Field → Length → Other → Length unit → Memo → Record it;
  - editor: Type → Amount → Memo → Day and time → … → Done → Cancel;
  - the editor opens with focus on Amount.

**Holds — addendum 168 (A/tri.mjs → A/tri.out.json)**
- The opened Trinity is drawn exactly like the home page's at 320 and 390, in cyan and violet:
  - both 240×240 px, scale 0.7453;
  - font-size 11, rendered 8.2 px, bold, black, system-ui;
  - same ring colours: #00FFFF ≡ hsl(180 100% 50%) and #FF00FF ≡ hsl(300 100% 50%).
- Every label sits inside its ring's coloured band:
  - glyph radii 57.9–68.9 (웃 HI), 54.5–64.7 (♡ SI), 54.5–65.7 (◬ AI), against the band at 52.5–70.5;
  - no label touches another ring.
- Contrast of the black labels: 16.7:1 on cyan, 6.7:1 on violet. No sideways scroll at 320.
- Screenshots: A/cap/tri-fin-violet-320.png, tri-fin-exel-cyan-390.png, tri-home-violet-390-crop.png.
- The legend reads "— Expenses" in rgb(255,0,0). "Spending" appears nowhere on the page. fin.spending is in AFTER_FILL, so no other language carries the old word.

**[should-fix] In landscape, and on small portrait screens zoomed in, the full screen still does not fit: the bottom is cut.**
- What is measured: the layer is the visible screen, but its content runs below the visible bottom in 20 of 54 cases.
  - 844×390 at rest: the canvas spans 136–436 px of a 390 px screen. The tilted dates are cut (only their tops show). The legend (Income / Expenses / Net) and the MoT unit picker are entirely off-screen (A/cap/fs-844x390-x1-top.png).
  - Landscape amount hidden below the screen: 94 px at rest, 142 px at ×1.14, 191 px at ×1.33, 240 px at ×1.6. At ×1.6 only the top third of the chart shows (A/cap/fs-844x390-x1.6-right.png).
  - The same after rotating while open (A/cap/rot-390x844-x1.33-landscape.png).
  - Portrait: 110 px hidden at 320 ×1.33, 182 px at 320 ×1.6, 120 px at 375 ×1.6.
  - The hidden part is reachable only by scrolling inside the full screen. It is his "not all is legible" in another orientation.
- Cause: command-ux1.tsx:1442 sizes the chart as `Math.max(300, vh - 260)`. The 300 px floor dates from r.064. fin-layout-smoke.mjs:70-92 checks only left/right edges, on 844 px-tall portrait screens.
- Fix: in full screen, give the chart the height left in the visible screen. Measure the layer's other rows; floor around 140 px. Add 844×390 and 568×320, plus a top/bottom check, to the smoke.

**[should-fix] "Try saving again" pressed while the phone still refuses gives no new announcement and no visible change.**
- Measured: 0 new alert elements. command-ux1.tsx:784 keeps the same element mounted.
- This is the class just fixed for refusals (refusalN key), left open for this alert.
- Fix: give data-fin-save-retry a key that changes on each failed attempt.

**[should-fix] Focus is lost when the editor closes (pre-existing since r.062).**
- Cancel, Done with nothing changed, and Done with a change all leave focus on BODY: 3 of 3 (ux:963, ux:600, ux:604).
- The form already returns focus to + Transaction.
- Fix: after the editor closes, focus that row's pencil `[data-fin-edit="<rev>"]` (the doorRef pattern).

**[nit] In full screen, "$0.0000" is hidden under the selected day's date box.**
- 39 of 54 full-screen cases: 320 at every zoom, 375 from ×1.14, 390 from ×1.33, 428 at ×1.6, landscape at every zoom (A/cap/fs-320x568-x1-top.png).
- Also in the in-page chart, 68–76 % covered at 320/390/428 (A/card.mjs).
- This was deferred to the chart round (r073.md:108), but in full screen it is "not all is legible".
- Fix: rcore-chart.tsx:244 — clamp the box's left edge to x0 (the plot's left edge) instead of 0.

**[nit] The page jumps after the full screen closes when the chart was near the top.**
- The fixed layer takes the chart out of the page, the document shrinks by about 520 px, and scrollY is clamped and never put back.
- Measured with the chart at the top: 390: 709 → 444, the chart comes back 273 px lower; 428: −347/−353 px; 375: −38/−88 px (A/fs4.mjs).
- Fix: save scrollY on open and restore it in the cleanup of the effect at ux:1389-1398.

**[nit] The $ view in full screen, zoomed: the first date is cut and the $ scale overprints the plot.**
- The first date label runs 6 px past the left edge at 320 ×1.33/×1.6 and 390 ×1.6.
- "$3,924" and "$1,962" print over the start of the plot (A/cap/fs5-320x568@1.6-usd.png).
- Cause: PL is in viewBox units (ux:1313); dates use translateX(-100%) rotate (ux:1474) and are never skipped the way the canvas skips them.

**[nit] The Trinity toggle drops focus on open and on close.**
- Opening or closing by keyboard leaves focus on BODY, because two different buttons swap (ux:627-645, pre-existing since r.042).
- Fix: keep one button mounted, or focus the new one.

**[nit] The full screen is not a dialog (pre-existing since r.064).**
- Tab from its last control goes to Transaction Record, Credit cards and others hidden behind it (4 of 4 invisible).
- The layer has no role="dialog" or aria-modal (ux:1401).
- The ✕ is announced "Close full screen, pressed" (ux:1405).
- The Clock · MoT group has no name (ux:130).
- The canvas is named by an instruction, and its figures have no text alternative.

**[nit] The editor and the form are hard to tell apart for a screen reader.**
- The editor's field order differs from the form's: Memo is 2nd in the editor (ux:948-963), last in the form (ux:750-781).
- With both open, a screen reader's form-controls list reads two unnamed sets: Type, Amount, Day and time, Section, Field, Length, Memo, twice. "Edit transaction · #n" is only a paragraph (ux:945).
- Fix: role="group" with aria-label on each.

VERDICT: FIX-FIRST — the zoom fix holds in every portrait and panned case measured (54/54 inside the visible screen sideways, the ✕ always reachable, the Trinity identical to Main's, Expenses in red), but his complaint comes back in landscape at rest (dates and legend below the visible bottom), and both that and the retry alert are small fixes; COUNT: 0 blockers / 3 should-fix.
