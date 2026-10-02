# Financial-2525 · r.073 — the reviewer lenses' pre-push review, verbatim

Twelve reviewer lenses on r.073 before its push (commits 01defa4 + dc78cc7; the built page from 01defa4). Stopped early at the fixer's
request once the operator's addenda 163–165 changed r.073 (so a second, focused review runs on the final bytes). Kept here exactly as it
was returned, before any fold touches the code. The scripts it cites (`P/…`) lived in the session's scratch space and are not carried.

---

r.073 pre-push review, stopped early at the fixer's request. Scope: 01defa4 + dc78cc7. The built page in frontend/out is from 01defa4.
- I ran no browser walk, so frontend/out was not simulated: the stop came before it, and no screenshots were taken.
- What ran: the pure modules, both commits, in Node.
- Everything about the page itself comes from reading the code. Every lens that depends on the page is marked "partial".
- The repository was not touched.

Abbreviations:
- ux = frontend/components/financial-2525/command-ux1.tsx at 01defa4 (the cited lines are the same at dc78cc7)
- rec = frontend/lib/financial-2525/record.ts at 01defa4
- P = /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/r073-review/council12/pure

LENS Krishna · GRADE C
- holds: one shared union is used in all three places — saveRecord (rec:174), mergeRecords (cloud.ts:62) and the storage listener (ux:211).
- holds: fuzz with 2–3 devices and one account, syncing read → unite → write-if-lacking, every edit a new value, 400 runs × 2 seeds. Result: 0 non-converged, 0 missing, 0 doubled, 0 wrong values; every union verifies (P/fuzz.mjs unique). Same at HEAD aa9eca9.
- [blocker] The union drops a correction that repeats what an earlier correction of the same entry said (A→B→A). The older edit then wins and the money changes.
  · evidence (P/u2-amount.mjs; memo version P/u1-revert.mjs):
    - laptop alone, edits 100→120→150→120: reads 120.00, Available 120.00;
    - united with a phone copy that recorded a 5.00 withdrawal just before the first edit: 150.00, Available 145.00 (3 corrections → 2).
  · evidence (fuzz with a small set of values, P/fuzz.mjs reverts): 22 and 18 wrong final values per 400 runs; still 20 and 17 at HEAD.
  · cause: rec:117 `said` identifies a correction by its content only, never by when it was made (HEAD record.ts:120 is unchanged for corrections). The copy whose diverging entry is older keeps its place, so the editing copy's corrections are the ones appended. No gate covers this.
  · fix: put the entry's `at` into a correction's identity — `c:${corrects}|${e.at}|${stableJson({...tx,id:""})}`. The union keeps `at`, so true duplicates still match and uniting twice still changes nothing. Gate: A→B→A on the appended side, in both orders; the newest value wins.
- [suggestion-needs-HI] 2717716 (landed after 01defa4) treats one id with the same kind, amount and instant as ONE transaction, even when memo, field, length or payer differ.
  · It stops the "Put back my entries" double, but two different entries can now collapse into one, and the kept one's memo wins. Example: $50 "coffee" and $50 "lunch", same typed minute, same position.
  · In the fuzz's small value space, 118–127 distinct entries merged per 400 runs at HEAD.
  · ask him: which is worse, a doubled re-entry or a lost distinct entry? A middle road: merge only word-for-word copies, plus the two known restore ids.

LENS Thoth · GRADE B
- holds — BUDGET LAW: no figure moves on single-device data.
  · test: 500 random single-device histories (Weekly, Monthly, Quarterly, Other and One-time entries; several actions per second; amount and memo edits).
  · result: identical chains, and identical Available, In Escrow, Released, Withdrawn, record Income lines and Net ladder, across d8c7c36, 01defa4 and HEAD (P/budget-law.mjs → 0 differences).
- holds: amounts stay exact integers in cents up to 999,999,999,999.99, and every united record verifies (0 unverified in 1,600 fuzz runs).
- [nit] The first r.073 sign-in unites his phone with whatever the account row holds. r.072 wrote without reading, so that row may hold another device's entries, and Available may move — correctly · fix: say so in the release note.

LENS Odin · GRADE C+
- holds: the 12-hour interval, the return-to-page check and `online` all call syncRef.current, which reads the latest values (ux:343-347).
- [should-fix] Choosing the edit by recorded time is a regression on a single device when its clock moves back.
  · evidence (P/clockback.mjs): two edits in one tab, clock set back 1 minute between them. r.072 shows 300 (his last word); r.073 shows 200.
  · The same happens across devices: a later edit from a device whose clock lags loses to an older one.
  · fix: stamp each correction and entry with max(now, the record's latest `at` + 1). An edit made after seeing another then always wins.
- [should-fix] Account rows already reverted by r.072's stale 12-hour push are never repaired.
  · r.072 wrote the opening lines under the latest fin-plan-at; the round measured 700 under the 777 edit's timestamp.
  · On equal timestamps the sync does nothing (ux:311, ux:318). The account and any second device keep 700, and reverted cards stay reverted.
  · fix: on a tie with different lines or cards, send this device's copy. Add a gate.
- [nit] A Financial tab opened before the deploy keeps running r.072's stale push, and r.073 now takes a newer account budget mid-session · fix: release note — reload every open Financial tab on every device.
- [nit] "Sent at once on page close" is overstated. The flush reads 3 rows before writing (ux:345), so on a close it rarely finishes before the page unloads · fix: say "on hide", or write the record with keepalive.

LENS Christo · GRADE C+ (partial)
- holds (code): Done with nothing changed appends nothing (ux:511). The restore panel waits for cloudReady (ux:699).
- [should-fix] "Put back my entries" can still show without the account having been read.
  · cause: cloudReady turns true after the first sync whether its read succeeded or failed (ux:333). Also, cloudRead reports "offline" both when no account is set up and when it is unreachable (cloud.ts:44).
  · scenario: a phone that is offline at sign-in, with an empty record, shows the button. If he taps it and records the prefilled −250.66, a later good read unites both copies.
  · At 01defa4 the merge needs every field and the id to match, so his two deposits can double.
  · At HEAD the ids must still match, and an original recorded at "now" has milliseconds in its id, so they can still double.
  · fix: cloudRead returns "off" when no account is set up; set cloudReady only on "ok" or "off"; hide the panel and retry the read while offline or on error; gate it with a failing read.

LENS Thor · GRADE C (partial)
- holds (code): when the phone refuses a save, the entry stays on the page and goes out with the next sync (ux:201-205). An unchanged retry writes the same record — the fixer's probe measured this (46/0); I did not re-run it.
- [should-fix] Full phone: changing any field after the failure turns the button back into "Record it" and hides the note (ux:446-447).
  · The first entry is still on the record, in memory and in the account. Fixing a typo then records a second entry, and both count.
  · fix: while an unsaved entry exists, keep "Try saving again" and send changes through the pencil after it saves — or apply the changed fields as a correction of that entry.
- [should-fix] The note can say "it is saved to your account" before that is true.
  · ux:650 picks save_failed_cloud whenever cloudState is "saved", and that is still the previous sync's result. The new entry waits 1.5 s, then a read, then a write — and that sync may fail.
  · fix: mark the cloud not-saved as soon as the record changes; show save_failed_cloud only after a sync that started after the failed save has succeeded.
- [should-fix] Set-aside copies grow without bound in the account.
  · When the account copy fails its chain and this device's record is empty, every sync — each budget edit, every 12 hours, each return to the page — writes another whole fin-record-kept-<time> row.
  · cause: mergeRecords keeps the bad copy (cloud.ts:61), and since the device has nothing to write (lacks is false, ux:299) the bad copy is never replaced (ux:296). This is exactly the new-phone case.
  · fix: keep a given bad copy only once (store its last hash on the device and skip it when unchanged).
- [nit] dc78cc7 re-checks the sign-in only after the read (ux:292). After the record and budget writes, the budget and cards stages read planRef/cardsRef with no check. Not reachable today, because auth0-react 2.14's logout navigates away · fix: re-check the sign-in after every await.
- [nit] A budget save failure shares the record's warning flag, shows the record's words, and is cleared by the next good record save (ux:268 vs ux:203) · fix: a separate flag for the budget.

LENS Enki · GRADE C+
- holds (pure):
  · amounts: 1,234.56, $50, .55 and 50. are accepted; Infinity, 1e400, 0x10, 12,50, negatives and one trillion are refused.
  · dates: 2026.02.31 and year 0050 are refused. CST is a fixed offset, so a date always reads back as typed.
- [should-fix] "One reader for every amount" does not cover the whole class. Found by reading; not run.
  · budget line (ux:352) uses Number(text): "0x10" sets a line to 16.00, "1e3" to 1,000.00, and "1,234.56" is silently not applied.
  · card settings (ux:1082) use Number(v). validCard only checks openingCents >= 0 (cards.ts:59), so an opening balance of "1e400" makes an Infinity card. JSON stores that as null, which reads as 0 after a reload — the same change of meaning Enki found on the record.
  · the gate (financial-surface.test.mjs:432) only checks Number(amt|ed.amt|ed.days|otherN).
  · fix: send both through parseAmountCents (the budget field keeps its draft and applies only what parses); add Number.isFinite to validCard; widen the gate to every Number() of typed text.
- [nit] An hour of 25 or a minute of 61 gets "That day is not on the calendar" (mot.ts:205 calls any well-shaped stamp a bad day; mot.ts:210 is what refuses the time) · fix: "That day or time does not exist".

LENS Enlil · GRADE B (partial)
- holds (code): the editor opens on the length the entry is counted at:
  · Monthly 30, Weekly 7, Quarterly 91, Other its own (for example 0.125), One time blank.
  · a changed length takes the entry off its preset (Other, or One time when cleared); an untouched length is never rewritten.
  · Done keeps another tab's change to fields this tab did not touch.
  · the fixer measured 30 → 7 moving the rate at 3 widths; I did not re-run it.
- [nit] If a union renames the entry whose editor is open (an id collision makes it X~2), editId then names the other entry and Done edits that one (ux:848) · fix: remember the entry's hash when the editor opens; close the editor if it no longer matches.

LENS Athena · GRADE B (partial)
- holds (code):
  · closing the form returns focus to + Transaction;
  · the editor scrolls to the centre and focuses Amount;
  · Day and time spans both columns; the close button is 32×36 px.
  The fixer measured these at 320/390/428 px; I did not run the browser walk. No new finding.

LENS Aset · GRADE B (partial)
- holds (code):
  · "failed its chain" clears when the account fills an empty record (ux:297);
  · a good device save clears "would not save" (ux:203);
  · changing the type clears the refusal;
  · the editor's refusals start with "Refused ·".
- [nit] The three save-failure notes name the hardware three ways: "This device would not save the record", "This phone would not save it", "This phone would not keep a copy" · fix: one word throughout.
- [nit] The message for an impossible hour (see Enki).

LENS Sofia · GRADE B (partial)
- holds (code):
  · the Record's summary is read as its text: title, a broken chain, and the cloud (role="img" with its label);
  · every pencil names its number, amount and day;
  · the Other unit picker has a name;
  · refusals and save notes have role="alert".
  Not checked with a screen reader.
- [nit] The Other unit picker reuses fin.unit, whose context describes the budget's per-period toggle (ux:112 vs ux:1272), so translators will word it as a period · fix: its own key, staged in AFTER_FILL.
- [nit] role="alert" on an element that stays mounted is not announced again when the same refusal repeats (ux:693) · fix: give the element a key that changes on each refusal.

LENS Pangu · GRADE B
- holds: the rule for which copy keeps its place is the same everywhere, so devices converge (0 non-converged in 1,600 runs).
- [suggestion-needs-HI] The account store has no compare-and-set, so two devices writing at once are covered only by one read-back 4 seconds later. A version column checked by innovation_state_put would make every write safe, but it needs a migration — ask him.
- [nit] Addendum 164 ("every field editable") will widen TxEdit · fix: fold the blocker's `at` fix in before it lands.

LENS Asar · GRADE C+
- holds: the design is right, and no budget figure moves on single-device data:
  · the account is read before it is written;
  · a failed read writes nothing;
  · every timer goes through the latest sync.
- Still open on the journey:
  · the union can drop a repeated correction and change a figure (blocker);
  · the clock decides which edit wins;
  · the full-phone retry can double an entry;
  · "Put back my entries" can still show after a failed read;
  · account rows r.072 reverted stay reverted;
  · "one reader" leaves the budget and the cards out.

VERDICT: FIX-FIRST — the union that r.073 adds can drop a correction and change a figure (measured: 120.00 → 150.00, Available 120.00 → 145.00), which breaks the revision's own invariant; the fix is small (put `at` into a correction's identity) and needs a gate, and the walk on the page has still not been run; COUNT: 1 blocker / 7 should-fix
