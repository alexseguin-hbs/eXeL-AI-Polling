# Financial-2525 — the Shared-Intent review (B-59)

Addendum 161: *"address backlog, make your own decisions MoT"*. Addendum 162: *"and we can review if SI was reached later"*.

This page is that review, ready for you. It lists every decision Master of Thought took on your behalf (marked **DECLARED** in the
decision register — `DECISIONS_REGISTER.md`), and every question still waiting for your word. Nothing here is final until you have read
it: answer with the number and **keep** or **change** (and how). Decisions you made yourself (**OPERATOR**) are not repeated here.

The page grows with every round: each new DECLARED decision and each new question is appended, never rewritten.

## A · Decisions taken on your behalf

| # | Decision (short) | Why it was taken | Your word |
|---|---|---|---|
| FD-91 | The three questions r.071 left open: the Accrual Rate stays what escrow releases (never netted against bills — bills show in the chart's Net); the chart's $ view keeps the re-spread picture; no "Released early" line on the card | Your r.066 answer "Spread over rest", addendum 96 and the gear's definition of Released | keep / change |
| FD-92 | A save, an account sync and another tab's save **unite** the copies: every transaction either copy holds is kept; the edit made last wins; two different entries sharing an id are both kept. A copy whose chain is broken is kept whole, never merged | Round 1: two tabs or two devices buried each other's entries (5 of 10 visible); your addendum 106 "no changes should delete entries" | keep / change |
| FD-93 | When the phone will not keep an entry, the entry stays on the record on the page and goes to the account; the form stays open with what was typed and offers "Try saving again" — never a second copy | Round 1 (a full phone folded the form over an entry it had not kept) | keep / change |
| FD-94 | One reader for every typed amount: digits with up to two decimals, thousands commas only where they group thousands, the currency mark in front allowed; never an exponent, hex, Infinity, a sign or a stray comma (12,50 is refused); a typed date must read back as typed | Round 1: Infinity and 1e400 were recorded as money, 0x10 as $16, 1,234.56 and $50 refused, 2026.02.31 recorded as 2026.03.03 | keep / change |
| FD-97 | A correction counts by what it says **and when it was made**, so an edit back to an earlier value is a new correction and the newest edit still wins after a union; a new entry is always stamped after the record's latest (a clock moved back never makes a later edit lose); an account budget or card list reverted by r.072's old 12-hour push is repaired | The pre-push review of r.073: 100 → 120 → 150 → 120 read 150.00 after a union | keep / change |
| FD-98 | After a failed save, a change in the form corrects that same entry (never a second one), and "saved to your account" shows only after a sync that really holds it | The pre-push review of r.073 (a typo fixed after the failure recorded two entries) | keep / change |
| FD-103 | Your budget and your cards: the copy edited later wins on every device; a copy is dated only once your phone has really kept it; two copies that differ only in the order the account stores them are the same copy; a phone whose clock runs behind never dates an edit before the copy it just took | The second pre-push review of r.073: a full phone sent its old budget over your newer one (22222 → 111 everywhere), and identical cards were re-sent on every sync, losing a newer rename | keep / change |
| FD-104 | The green "saved to your account" cloud shows only while your account holds exactly what the page shows; any change turns it grey at once | The same review: it stayed green over a new entry, and for 12.5 s while a budget line was being typed | keep / change |
| FD-105 | A budget box that does not read as a figure leaves the line as it was and says why; per second it shows every decimal the line needs | The same review: "1e3" set a line to 1.00 (and a cleared box to its first digit) and that survived a reload | keep / change |

## B · Questions waiting for your word

| # | Question | Master of Thought's recommendation | Your word |
|---|---|---|---|
| Q1 | Your phone may hold copies the old save (before r.073) set aside. Show them and offer to put their entries back on your record? | Yes — a "Put back" list, append-only | yes / no |
| Q2 | A mistaken entry cannot be deleted (the record is append-only). Allow a correction to $0.00 that keeps the original on the record? | Yes — it is the append-only way to cancel | yes / no |
| Q3 | A full phone reads "This device would not save it … try again" with a "Try saving again" button. Keep those words? | Keep | keep / change |
| Q4 | Two entries with the same id, type, amount and minute are taken as one (so a re-entered deposit is not doubled) — even when the memo differs, so a $50 coffee and a $50 lunch typed in the same minute could merge. Merge only word-for-word copies instead? | Merge only word-for-word copies | yes / no |
| Q5 | Two devices writing in the same instant are covered by a read-back 4 seconds later. A version check on the account store would make every write safe, but needs a database change. Do it? | Yes, in its own revision | yes / no |
| Q6 | Boxes under 16 px make an iPhone zoom the page in when tapped (the cause of addendum 165). Make the form's boxes 16 px so it never zooms? It changes how the forms look | Yes | yes / no |
| Q7 | A budget line typed per Standard Month is stored on the 30-day month, so 1,000 typed in October reads 967.74 in November and 903.23 in February. Should a figure typed per calendar month stay the same every month? | Yes — keep what you typed per calendar month | yes / no |
| Q8 | Two devices change different fields of one entry before they sync (the phone the memo, the laptop the amount): the newest correction restates every field, so the phone's memo disappears from the screen (both corrections stay on the record). Keep "the newest correction wins whole", or merge field by field? | Merge field by field | whole / by field |

Rounds that add decisions or questions append here, under the same two headings.
