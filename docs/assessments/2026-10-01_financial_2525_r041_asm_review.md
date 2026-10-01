# Financial-2525 r.041 — AsM review on the built page (2026-10-01)

Run after r.041 was pushed (addendum 79: the review must come first; it did not). Six reviewer lenses + one synthesis, read-only, against addenda 70–79.

## Synthesis

**AsM synthesis: Financial-2525 r.041**

All six reviewers checked the built `frontend/out` at 390 px. Screenshots are in `/tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/asm041/`. Code lines below are in `frontend/components/financial-2525/command-ux1.tsx` unless another file is named.

Verdict: not ready for HI sign-off. r.041 changed two titles and nothing else from addenda 76–78. It was pushed (daace84) before any AsM review, which addendum 79 forbids.

## A. Defects in what is shipped (most severe first)

1. **Build stamp shows the wrong SHA (the LIVE vs Cloudflare mismatch in ad. 79).**
   - The page says "v.000_r.041" but stamps 2ffb520, which is the r.040 bookkeeping commit.
   - The r.041 code is daace84 and HEAD is 9ca2a34.
   - `out/` was built before the r.041 commit; `lib/2525-core/version-stamp.ts:10` reads `NEXT_PUBLIC_GIT_SHA` at build time.
   - Result: HI cannot match the SHA on the page to a commit or to the Cloudflare deploy.
   - Found by Thor, Christo, Athena and Enki.
2. **Two different times on one page, both labelled "CST".**
   - The build stamp uses America/Chicago daylight time (`next.config.js:25-54`).
   - The year card uses standard CST (UTC−6).
   - So the page shows 10:53 and 10:04 "CST", an hour apart.
3. **The chart shows only the latest deposit.**
   - `focus = deposits[0]` (:175) and `MotChart` draws one deposit (:630).
   - "REAL-TIME FINANCIALS" charts $320 only. Its Released figure at NOW is about $6.28, while the card above says $77.
   - The $3,604.49 deposit is missing from the chart, and the page does not say so.
4. **The Accrual gear mixes scopes.** It shows "14:08:55 elapsed" for the $320 deposit only, next to "$0.0898/min" for both deposits combined (:364-365).
5. **The budget is the sample sheet, not his record.**
   - Income shows $2,941.41/mo, but $3,924.49 was deposited.
   - Net shows −$183.84 in red. On his record it would be about +$799.
   - It shows the sample figures even when the record is empty.
6. **Every rate and length is computed on 30.333 days, not 30.**
   - The rate is $5.3908/hr; on 30 days it would be $5.4507/hr.
   - The MoT span reads 298.3475 A; on 30 days it would be about 295.7 A.
7. **The Clock year card's month and day are wrong.** It uses `monthDays = 91/3` (:527-528, :547) and shows "Month 9 · 28/30.3̅". Under his law (3 × 30 + 1 down day), quarter-day 89 is month 9 · day 29/30.
8. **30.3̅ is still visible in six places:**
   - the budget unit option and column header (`fin.per_month`, `lexicon-data.ts:3017`)
   - the "Monthly (30.3̅ days)" length preset (`fin.rec.paymot`, :3182)
   - the chart top line
   - the record's Length column
   - the year card
   - code comments (:181-185, :526-533) and lexicon contexts (:2911, 2942, 3018)

   Signed out, the chart prints "30.333" instead, so the same value appears two ways.
9. **The settings gear opens the full Master "Moderator Settings"** (:600). It includes Cost Estimate (1,000 users), "Which AI writes", Voice-to-Text and Cube Architecture, plus "Applies to all participants in this session", which makes no sense on a personal finance page.
10. **Mars on Clock shows Earth's year.** Clock reads "Day 271/365". MoT on the same card reads 1419/3600 (about 39% vs about 74%). MoT also says "Revolution 2026", an Earth year number.
11. **The chart's date axis is cut at both ends.** It reads "026.10.01" on the left, and "2026.10.3" or "2026.10.31" spills past the right border.
12. **The date-angle default is broken.** `Number(localStorage.getItem("fin-date-angle"))` turns a missing value into 0, so labels render flat instead of at 30° (:160).
13. **The chart frame and gridlines do not draw.** They use `stroke="var(--border)"`, which is not a valid colour here (:683-684, :690).
14. **Console error on every load:** svg `height="auto"` (:682), plus one 404.
15. **The chart top line wraps:** two lines on Clock, three on MoT. The MoT axis labels stack three lines per tick, and the right-hand one is cut.
16. **The tapped-point readout in MoT** prints between the chart and the axis marks, so it reads as a sixth mark (:705).
17. **The 30.3̅ overline is misplaced in the mono font.** It sits over the space in "30.3̅ DAYS".
18. **Wrapping at 390 px:**
    - the top build strip leaves "CST" alone on a second line
    - the footer drops ◬♡웃 to its own line
    - the budget note wraps to three lines (:480)
19. **A bare ▸ sits under Sign out** with no label. It is the folded Trinity (:588-593).
20. **Edits and labels in the budget:**
    - "Rent / Mortg…" and "Electric / G…" are cut. The full name is only in a `title` attribute, which a phone never shows (:445).
    - The Field select cuts "Upside: … / Ot" with no "…".
    - Fitness shows "45.9596" while every other line shows two decimals.
21. **Mismatched heights on Accrual line 1:** gear 32 px, /hr select 36 px, + Transaction 36 px. The $5.3908 figure sits about 7 px below the title.
22. **Text that points at nothing:**
    - the budget footnote mentions a "Balance view" that does not exist
    - the chart legend shows "Withdrawal" when there are no withdrawals
    - "SOURCED" sits directly above "declared, not sourced"
    - the bottom bar reads "SECURITY-2525" on the Financial-2525 page
    - "EXAMPLE…" appears twice when signed out
23. **Layout at 390 px:**
    - The Accrual card is wider (`-mx-2`) than the other cards, so left edges do not line up.
    - The record table needs a sideways scroll to show Day/time, Length, Type and Hash, and nothing hints that it scrolls.
24. **Colour:** the header glyphs are multicolour and the R-CORE icon is cyan on a violet theme.
25. **Lexicon context for "Standard Month"** (:2952) still says "followed by the month name and its length". That contradicts his "no extra text" and will mislead the ×32 fill.
26. **The MoT perihelion reads "0.0000..0000"**; the plan says "0000.0000..0000" (:538-544).
27. **Disputed:** Enki says MoT still shows /min and /sec in the Accrual gear (:365); Athena says the gear switches cleanly. Recheck before fixing.

## B. His asks still not built

1. **The month law:**
   - two units only, "Standard Month (Gregorian)" and "Month · 30 day"
   - a quarter is 3 × 30 + 1 down day
   - no 30.3̅ anywhere
   - old entries switched to 30 (ad. 76)
2. **Accrual card layout (ad. 76, answer):**
   - line 1: ACCRUAL UNITS centred, + Transaction at the gear's height, then the gear
   - line 2: Available and Accrual Rate
   - $5.3908 on the title's line
3. **Header order:** globe first, settings to its right (ad. 76).
4. **A smaller header.** This is his third request; the header still fills about 250–290 of 844 px.
5. **Mini Trinity:**
   - replaces the ◬♡웃 row with the Trinity logo, no text, one-third size, in the selected colour
   - a tap opens the full labelled wheel
   - the ◬♡웃 in the footer goes too (ad. 76/78)
6. **Bottom Trinity removed** (ad. 76).
7. **Non-Master settings panel** with exactly three items (language/colour · Atlantis Accords · Vision-2525), used by Financial-2525 (ad. 76).
8. **Full name on press-and-hold** for cut budget lines on a phone, or short names (ad. 75).
9. **Clock-only rows when Clock is chosen, A.B..C-only when MoT is chosen**, everywhere on the page, including the Accrual gear (answer to ad. 73).
10. **A build stamp that matches the deployed commit**, and one time convention on the page (ad. 79).
11. **The r.041 release note with before/after images.** `docs/financial-2525/releases/` ends at r.040 (ad. 71). He said notes can wait, so this is owed but not blocking.
12. **An AsM review and simulation before the push** (ad. 79). r.041 shipped without one.

## C. Questions to put to him, not assume

1. "$/MoT is left of settings icon" (ad. 76, images 01/02): which bar does he mean?
2. Does he want the word "LIVE" in the footer?
3. For the mini Trinity: is "selected colour" the theme's primary colour, and where does the expanded view open (ad. 78 said "ask questions if ya have em")?
4. On Clock, the year card shows Gregorian 2026.10.01 next to perihelion counts "Quarter 3 · 89/91". He said "keep as is", but on 1 October he would read Gregorian Q4. Keep it?

## Thor

**Thor review of Financial-2525 r.041.** I checked the built `frontend/out` page at 390×844, signed in, with two deposits ($3,604.49 and $320, both "Monthly"). Screenshots are in `/tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/asm041/`. I edited nothing in the repo.

**Release risk:** r.041 changes two titles and nothing else. Most of the open complaints in addendum 76 are still on the page.

## 1. Where the page does not do what his words in addenda 70–79 say

1. **"remove all 33.3 mentions" / "Two month measurements are Standard Month (Gregorian) and Month • 30 day" / "switch to 30" (ad. 76).** The 30.3̅ figure is still in five places:
   - The budget's default unit reads "per month (30.3̅ days)", and so does the column header (`[data-fin-budget-unit]`; `command-ux1.tsx:184,187`). There is no "Month · 30 day" option.
   - The chart's top line reads "… · $320.00 · 30.3̅ · 14 h 10 min elapsed" (`:681`).
   - The record's Length column shows "30.3̅" on both deposits; they were not switched to 30 (`:515`).
   - The year card on Clock shows Month "9 · 28 / 30.3̅", because `monthDays = 91/3` (`:528`, `:547`). Under his law (quarter = 3 × 30 + 1 down day), quarter-day 89 is month 9 · day 29/30, so **the day shown is also wrong**.
   - The code comments still say 30.3̅ (`:181-183`, `:533`).
2. **"Line 1: Accrual Unit, +Transaction, Settings / Line 2: Available and accrual rate" and "switch Transaction button with Accrual rate and make same height as settings" (sent twice), plus "make ACCRUAL UNITS CENTERED".** None of this is built.
   - Line 1 is ACCRUAL UNITS on the left, then Accrual Rate, then the gear.
   - Line 2 is Available on the left and + Transaction on the right.
   - The title is left-aligned. The button is 36 px tall; the gear is 32 px.
   - Code: `[data-fin-accrual-top]` `:319-335`, `[data-fin-tx-open]` `:344`.
3. **"move globe first and settings to right" (ad. 76).** The page shows settings first, then the globe (`[data-fin-topbar]` `:298-299`).
4. **"get rid of ◬ ♡ 웃 … smaller version of trinity above … if clicked it will enlarge" (ad. 76) and "replace ◬ ♡ 웃 with trinity logo … 1/3rd size … same color as selected" (ad. 78).**
   - The ◬ ♡ 웃 row is still under the top bar, at text-3xl (`:302`).
   - There is no mini Trinity.
   - The Trinity at the bottom is still there as a bare "▶" (`[data-testid=fin-details-trinity]` `:588-593`).
   - The footer still prints ◬ ♡ 웃 (`:597`).
5. **"entire header needs to be overall smaller … this is my third request" (ad. 76).** The header is unchanged: pt-10 + glyph row + 2xl title + subtitle + mb-8. The Accrual card starts about 250 CSS px down a 844 px screen.
6. **Non-Master settings: "language / color / Atlantis Accords / Vision-2525 … Make sure Financial-2525 used non-Master settings wheel" (ad. 76).** The gear opens the full "Moderator Settings" panel (`:600`). It includes Cost Estimate (1,000 users), "Which AI writes", and "Applies to all participants in this session". There is no Atlantis Accords and no Vision-2525 item.
7. **"$5.3908 needs to be same line as text to left (ACCRUAL UNITS) and aligned with settings wheel" (ad. 76, image 09).** The figure sits under an "Accrual Rate" label, so it is lower than the title and the gear.
8. **"personal fotness should be fitness … make … or scroll" (ad. 75).** Item 76 promises the full name on hold/hover. "Rent / Mortga…" is cut, but the full name is only in a `title` attribute, and a phone never shows that on press-and-hold (`:445`).

## 2. Broken or ugly at 390 px, and money that could mislead

1. **The chart's date axis is cut at both ends** in the default Clock view: "026.10.01" on the left and "2026.10.3" on the right (`[data-fin-date-axis]` `:700-701`).
2. **The chart's top line wraps to three lines** in MoT view: "$320.00 · 298.3475..1826 A-units of the revolution · 2664… → 2963…" (`:680`). In Clock view it wraps to two.
3. **Cards disagree about the money.**
   - The Accrual card adds up both deposits: rate $5.3908/hr, Released $76, In Escrow $3,848. The card titled "REAL-TIME FINANCIALS" charts only the latest $320 deposit (`focus = deposits[0]`, `:175`, `:485`). The $3,604.49 paycheck is missing from the chart and nothing on the page says so.
   - The Accrual gear shows "14:08:55 elapsed" (the $320 deposit only) next to "$0.0898 /min" (both deposits combined) (`:364-365`).
4. **The budget ignores what was recorded.** Income/Wages shows $2,941.41 per period from the example sheet, while about $3,924 was deposited in the same span. The Net of "−$183.84" in red therefore describes a sheet, not his record, and nothing says so.
5. **The chart's length has no unit:** "30.3̅" with no "days" after it.
6. **The colour panel misleads in this app:** "Applies to all participants in this session" on a personal finance page.
7. **The build stamp names the wrong commit.** The local build reads "v0.041 … · 2ffb520", but 2ffb520 is the r.040 bookkeeping commit. The r.041 code is daace84, and HEAD is 9ca2a34. If the live site is built this way, the version line will not match the Cloudflare deployment SHA. That is the "discrepancies in LIVE vs cloude flare" he named in ad. 79, and he cannot check it. (`lib/2525-core/version-stamp.ts:10`, `NEXT_PUBLIC_GIT_SHA` is read at build time.)

## 3. His asks still not built at all

- The 30-day month law: "Month · 30 day", a quarter of 3 × 30 + 1 down day, and old entries switched to 30.
- The Accrual Units card layout and the centred title (ad. 76 answer, item 78).
- Globe first, then settings.
- The mini Trinity logo replacing ◬ ♡ 웃, in the selected colour, enlarging on tap with its labels; the bottom Trinity removed (ad. 76 / 78).
- The smaller header.
- The non-Master settings panel with its three items (language/colour · Atlantis Accords · Vision-2525).
- "$/MoT is left of settings icon" (ad. 76, images 01/02) cannot be verified as built.
- A full name on press-and-hold for cut budget lines, on a phone.
- An AsM review and simulation before the push (ad. 79). r.041 shipped without one; this review comes after it.

## Christo

(1) Places where r.041 on the built page does not do what addenda 70–79 say

- **Accrual Units, line 1.** His answer (add. 76): "Line 1: Accrual Unit, +Transaction, Settings / Line 2: Available and accrual rate". Also "switch Transaction button with Accrual rate and make same height as settings" (he sent that twice) and "make ACCRUAL UNITS CENTERED".
  - The page shows: line 1 is ACCRUAL UNITS on the left, then Accrual Rate $5.3908 /hr, then the gear. Line 2 is Available on the left and + Transaction on the right.
  - The swap was never made. The title is not centred.
  - + Transaction is `min-h-[36px] px-3`, a large pink block much bigger than the 32 px gear (`h-8 w-9`).
  - Where: `[data-fin-accrual-top]` and `[data-fin-tx-open]`, command-ux1.tsx:323-345.
- **Header order.** His words: "move globe first and settings to right". The page shows the settings gear first, then the globe (`[data-fin-topbar]`, tsx:297-299).
- **Header glyphs and Trinity.**
  - His words (add. 76): "get rid of ◬ ♡ 웃 … place smaller version of trinity above … default is mini … cut Trinity icon way below".
  - His words (add. 78): "replace ◬ ♡ 웃 with trinity logo (without any text) … same color as selected … 1/3rd size … when clicked, expand Trinity to current size with text".
  - The page still shows the big three-colour `<TrinityGlyphs size="text-3xl">` row under the top bar (tsx:302). The Trinity wheel is still folded behind ▸ at the bottom of the card (tsx:588-593). There is no mini Trinity at the top.
- **Header size.** His words: "entire header needs to be overall smaller … focus is outcome". The page is unchanged: pt-10, a text-3xl glyph row, a text-2xl title and mb-8. The Accrual card does not start until about y=270 of 844.
- **The month law is not built.** His words: "remove all 33.3 mentions / quarter is 91 days where 30 day is month and 1 day is down day … Standard Month (Gregorian) / and Month • 30 day". His answer: "switch to 30". The page still shows 30.3̅ in all of these places:
  - Budget unit default: "per month (30.3̅ days)" (`[data-fin-budget-unit]`, tsx:181-191).
  - Budget column header: "PER MONTH (30.3̅ DAYS)".
  - Chart top line: "… $320.00 · 30.3̅ · 14 h 7 min elapsed".
  - Record, Length column: 30.3̅ for both deposits.
  - Year card on Clock: "Month 9 · 28 / 30.3̅" (`monthDays = 91 / 3`, tsx:527).
  - Old entries were not switched to 30. The label "Month · 30 day" does not exist.
- **Settings panel.** His words: "non-Master needs 3 items / language / color / Atlantis Accords / Vision-2525 … Make sure Financial-2525 used non-Master settings wheel".
  - The gear opens the full "Moderator Settings" panel (tsx:600, `<ModeratorSettings … isPollingUser={false}>`).
  - That panel shows: Language, Session colour, Cost Estimate (1,000 users), Which AI writes (4 vendors, "no key on this site"), Voice-to-Text Provider, Cube Architecture, Language Lexicon, Atlantis Accords, Vision 2525.
  - It also says "Applies to all participants in this session", which makes no sense on a personal finance page.
- **The year card on MoT still mixes systems.** His words: "year position is either Gregorian or A.B..C, not a mix". The MoT view's last row is "Revolution 2026", a Gregorian year number. The perihelion row reads "0.0000..0000"; the plan said "0000.0000..0000" (tsx:540-544).
- **The year card on Clock still mixes systems.** It shows a Gregorian timestamp (2026.10.01) next to perihelion counts "Day 271 / 365" and "Quarter 3 · 89 / 91". On 1 October a person reads Gregorian Q4. This is exactly the mix his add. 72 screenshot complained about, even though his later answer said "keep as is". It is ambiguous, so it should be asked, not assumed.
- **"$/MoT is left of settings icon" (add. 76, images 01/02).** The MoT toggle is not left of any settings icon on the Accrual card. On the chart it sits left of the gear. It is unclear which bar he meant. This was not confirmed with him.
- **Footer "LIVE" (add. 76).** He wrote "LIVE / 000_r.037 · eXeL v0.037… · ◬ ♡ 웃" twice. The footer reads "v.000_r.041 · eXeL v0.041-2026.10.01-10.53CST · 2ffb520 · ◬♡웃", with no LIVE word, and still uses the glyphs instead of the Trinity logo. This may be a request for the word "LIVE"; it was never asked.
- **Discrepancy between the live site and Cloudflare (add. 79), two causes visible in the build:**
  - The page says r.041 but stamps SHA 2ffb520, the r.040 bookkeeping commit. The r.041 code is daace84, and HEAD is 9ca2a34. A local build stamps the parent commit, so the SHA on the glass will never match the Cloudflare deployment SHA for the same release.
  - The build stamp "10:53 CST" (top banner and footer) is America/Chicago daylight time (next.config.js:25-54, "handles CST/CDT automatically"). The page's own year card uses CST standard (UTC−6): its "Now" read 10:04 at 16:04 UTC. So the same page prints two different times both labelled "CST", one hour apart.

(2) Broken or ugly at 390 px

- **Top build banner wraps:** "Time: 10:53" then "CST" alone on a second line (`SHA: 2ffb520 | Date … | Time …`).
- **The 30.3̅ bar is misplaced:** in monospace the bar sits after the 3, over the space, in "PER MONTH (30.3̅ DAYS)", the chart top line and the record.
- **Chart top line wraps:** two lines on Clock, three lines on MoT ("$320.00 · 298.3475..1826 A-units of the revolution · 2664.2473..2955 → 2963.2349..1181").
- **The chart's MoT axis labels are three stacked lines per tick** (2664 / .2473 / ..2955). That is dense, and the right-hand label is cut to the card edge.
- **Widths do not match:** the Accrual card is wider (`-mx-2`) than the Budget, Chart, Record and Year sub-cards, so the left edges do not line up.
- **+ Transaction is oversized:** a pink block about twice the height of the gear and the rate select beside it.
- **Budget edit mode:**
  - Fitness shows "45.9596" (four decimals) while every other line shows two.
  - "Rent / Mortg…" and "Electric / G…" are still truncated rather than given short names (his example was "personal fitness should be fitness").
  - The Field select cuts "Upside: Overtime / Bonus / Gifts / Ot".
- **Wrong app name in the bottom bar:** it reads "SECURITY-2525" on the Financial-2525 page.
- **Stray content at the bottom:** a bare ▸ (the folded Trinity) and a separate R-CORE badge sit under the sign-in row. That is about 300 px of tail below the content he called the focus.
- **The record is cut off:** only Amount and Category are visible. Day and time, Length, Type and Hash need a sideways scroll, and nothing hints that the table scrolls.

(3) Items of his not built at all

1. The Accrual Units card layout from his answer: line 1 = ACCRUAL UNITS, + Transaction and gear at equal height with the title centred; line 2 = Available and Accrual Rate.
2. Globe first, settings to its right.
3. The ◬ ♡ 웃 header row removed, replaced by a mini Trinity logo: no text, in the selected colour, one-third size, opening to full size with its labels when tapped. The bottom Trinity removed.
4. A smaller header overall.
5. The month law: 30-day month, 91-day quarter = 3 × 30 + 1 down day, "Standard Month" and "Month · 30 day", no 30.3̅ anywhere, old entries switched to 30.
6. The Master / non-Master settings split, with the 3-item non-Master panel used by Financial-2525.
7. The "LIVE" word in the footer, if that is what he meant (needs asking).
8. A build stamp SHA that matches the deployed commit, and one time convention on the page.
9. Add. 78 "ask questions if ya have em": no record of questions asked about the Trinity logo (whether the colour is the theme's `primary`, and where the expanded view opens).

Flow order on the page matches add. 73: Accrual (with the entry below it), Budget, Real-Time Financials, Transaction Record, Year Position (folded), sign-in, Trinity. Both titles from add. 76–77 ("TRANSACTION RECORD", "REAL-TIME FINANCIALS") are correct.

Screenshots are in `/tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/asm041/` (r.999-after*.png, part0-2.png).

## Sofia

**Sofia (words lens), r.041 (2ffb520) at 390 px.** I captured the built `/financial-2525/` with the harness: the full page, Budget with all groups open, the Year card opened (Clock view), Transaction Record opened, Settings, and the Accrual gear plus the transaction form. Screenshots are in the scratchpad (`r.992`–`r.999-after.png`). I edited nothing.

**What is right now:** the record reads "TRANSACTION RECORD", the chart reads "REAL-TIME FINANCIALS", the subtitle reads "Measure of Time: A Universal Standard" on one line, and "Standard Month" appears as a unit option with no extra text.

## (1) Where the page does not do what his words say

1. **"remove all 33.3 mentions … Month • 30 day"** and **"switch to 30"** (addendum 76). 30.3̅ is still visible in six places, and "Month · 30 day" does not exist anywhere:
   - The Unit dropdown option and its selected value read "per month (30.3̅ days)" (`[data-fin-budget-unit]`; lexicon `fin.per_month`, `lib/lexicon-data.ts:3017`).
   - The budget table header reads "PER MONTH (30.3̅ DAYS)".
   - The chart's top line reads "2026.09.30_19.56..04 · $320.00 · 30.3̅ · 14 h 10 min elapsed" (`[data-fin-chart]`).
   - The Transaction Record LENGTH (MOT) column shows "30.3̅" on both deposits (`[data-fin-ledger-table]`). He answered "switch to 30".
   - The Year card Month row reads "9 · 28 / 30.3̅" (`[data-fin-year-table]`).
   - The length preset is "Monthly (30.3̅ days)" (`fin.rec.paymot`, `lexicon-data.ts:3182`).
   - Lexicon contexts still say 30.333 (`lexicon-data.ts:2911`, `2942`, `3018`).
2. **"get rid of ◬ ♡ 웃 … replace ◬ ♡ 웃 with trinity logo (without any text) that is same color as selected color … 1/3rd size … when clicked, expand Trinity"** (addenda 76, 78).
   - The header still renders the three big glyphs (`command-ux1.tsx:302` `<TrinityGlyphs size="text-3xl">`). They show in cyan, yellow and violet, not the selected violet.
   - There is no mini Trinity logo and no tap-to-expand.
   - The footer stamp still ends in ◬ ♡ 웃 (`command-ux1.tsx:597`).
3. **"cut Trinity icon way below"** (addendum 76). The folded Trinity wheel is still at the bottom of the card. It shows as a bare "▶" under Sign out (`command-ux1.tsx:587-593`, `[data-testid=fin-details-trinity]`).
4. **"move globe first and settings to right"** (addendum 76). The order is still settings gear, then globe (`command-ux1.tsx:298-299`, `[data-fin-topbar]`).
5. **"entire header needs to be overall smaller"** and **"Change top header to single line"** (addenda 74, 76). The header is about 290 CSS px tall before the Accrual card starts. It has four rows: top bar, glyphs, "FINANCIAL · 2525" (text-2xl), subtitle.
6. **"Line 1: Accrual Unit, +Transaction, Settings / Line 2: Available and accrual rate"** and **"make ACCRUAL UNITS CENTERED"** (addendum 76).
   - Line 1 is ACCRUAL UNITS, then Accrual Rate with its unit picker, then the gear.
   - Line 2 is Available, then "+ Transaction". This is the reverse of his answer (`command-ux1.tsx:325-345`).
   - The title is left-aligned, not centred.
   - "+ Transaction" is 36 px tall, not the gear's height.
7. **Settings: "non-Master needs 3 items / language / color / Atlantis Accords / Vision-2525 … Make sure Financial-2525 used non-Master"** (addendum 76). Settings opens the full Master "Moderator Settings" (`command-ux1.tsx:600`, `ModeratorSettings`). It lists Session Color Scheme ("Applies to all participants in this session"), Cost Estimate, Which AI writes, Voice-to-Text, Cube Architecture, Language Lexicon, and more.
8. **"for instance personal fitness should be fitness" / short names** (addendum 75). "Rent / Mortga…" is cut with "…". A short name such as "Rent" would fit on the row.
9. **"quarter is 91 days where 30 day is month and 1 day is down day"** (addendum 76). The Year card (Clock) still divides the quarter into 30.3̅-day months. There is no down-day month law.
10. **"Measure of Time: A Universal Standard"** (addendum 74). This one is correct. The Standard Month option is also correct, but its lexicon context (`lexicon-data.ts:2952`) still says "followed by the month name and its length". That contradicts "no extra text" and will mislead the ×32 fill.

## (2) Broken or ugly at 390 px

- **Misplaced overline.** In the mono font the combining overline on 30.3̅ floats right of the 3: over the space in "30.3̅ DAYS" in the table header, and offset in the Year card row.
- **Chart date overflow.** The last date, "2026.10.31", runs past the chart box's right border.
- **Legend for nothing.** The chart legend shows "| Withdrawal" when there are no withdrawals.
- **Wrong colour.** The header glyphs are multicolour on a violet theme. The R-CORE badge icon renders cyan, not the selected violet.
- **Machine words in the Year card.** It ends with the word "SOURCED".
- **Card reference to nothing.** The budget footnote reads "…live on the Balance view — never per minute", but there is no Balance view on the page.
- **Accrual card line 1 is crowded.** The "Accrual Rate" label is stacked over the figure, which makes line 1 two rows tall. The title then sits off-centre against it.

## (3) Not built at all

- The mini Trinity logo in the selected colour, at one-third size, expanding to the full wheel with "웃 HI · ◬ AI · ♡ SI".
- The non-Master Settings panel with exactly three items.
- The "Month · 30 day" unit, and the 30-day month plus 1-day quarterly down day across the budget, Year card and record.
- Old entries switched to 30.
- Globe before settings.
- The smaller header.
- The Accrual card in the line 1 / line 2 layout he chose.

## Athena

**Athena: Financial-2525 r.041 checked on the built page (`frontend/out`, 390×844) against addenda 70–79**

Of the 18 asks below, 8 are done, 2 are done in part and 8 are not done. Every addendum 76 header and month-law item the operator called his "third request" is still missing. Only the two titles and the step-rail/order work shipped.

Screenshots are in `/tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/asm041/` (`r.999-after-athena-full.png` and the `r.999-after-ath-*.png` files).

### (1) Backlog: DONE or NOT DONE, with evidence

| # | His words | State | What the built page shows |
|---|---|---|---|
| 70 | "remove big pink transaction button" | DONE | No full-width button. |
| 70 | "place smaller transaction button in box with accrual units" | DONE, but in the wrong place now (see 76d) | `[data-fin-tx-open]` sits inside `[data-fin-balance]`, on the Available row. |
| 71 | "show whats been changed in images … release notes" | NOT DONE for r.041 | `docs/financial-2525/releases/` ends at `r.040.md`. There is no `r.041.md` and no images. Addendum 79 said notes can come later, so this is owed, not blocking. |
| 72 | "year position is either Gregorian or A.B..C · not a mix" | DONE | Clock shows "Now 2026.10.01_10.08..08 CST · Day 271/365 · Quarter 3 · 89/91 · Month 9 · 28/30.3̅". MoT shows A.B..C only: "Perihelion 0.0000..0000 · Now 2670.1889..1268/3600 · Quarter …/900 · Month …/300". The chart's top line and the Accrual gear also switch cleanly (`command-ux1.tsx:365`). |
| 73 | "get rid of this [step rail]" | DONE | No rail on the page. |
| 73 | "Accrual / Budget / Charts" order | DONE | The page order is balance, budget, chart, record, year. |
| 73 | "move year section to end, defaulted just title" | DONE | `[data-fin-year]` is a closed `<details>` showing only its title. |
| 74 | "Measure of Time: A Universal Standard" on one line | DONE | `[data-fin-subtitle]`. |
| 74 | "Say: Standard Month (no extra text)" | DONE | "Standard Month" is a Unit option. |
| 75 | "one row per entry … personal fitness should be fitness … use …" | DONE | Each row is one line: "Fitness", "Rent / Mortg…", "Electric / G…" (seen in edit mode). |
| 76a | "move globe first and settings to right" | NOT DONE | The page shows the gear first, then the globe (`command-ux1.tsx:298-299`). |
| 76b | "we will also get rid of ◬ ♡ 웃" (and addendum 78: replace it with the Trinity logo, one-third size, no text, in the selected colour; a tap expands it to today's size with labels) | NOT DONE | The full-colour `TrinityGlyphs` row still sits under the top bar (`:302`). The footer stamp still prints the glyphs (`:597`). There is no mini Trinity. |
| 76c | "cut Trinity icon way below" | NOT DONE | The folded Trinity wheel is still at the bottom of the card, shown as a bare ▶ (`:588-593`, `[data-testid=fin-details-trinity]`). Opened, it reads "웃 HI ♡ SI ◬ AI". |
| 76d | "entire header needs to be overall smaller" | NOT DONE | The header is about 270 of 844 px (32% of the screen): `pt-10`, `text-3xl` glyphs, `text-2xl` h1, `mb-8`. |
| 76e | His answer: "Line 1: Accrual Unit, +Transaction, Settings / Line 2: Available and accrual rate", and "switch Transaction button with Accrual rate" (asked twice) | NOT DONE | Line 1 is ACCRUAL UNITS · Accrual Rate $5.3908 /hr · gear. Line 2 is Available $76.61 · + Transaction (`:321-344`). |
| 76f | "make [Transaction] same height as settings" | NOT DONE | Button is `min-h-[36px]`, gear is `h-8` (32 px). The /hr select is also 36 px. |
| 76g | "make ACCRUAL UNITS CENTERED" | NOT DONE | The title is left-aligned (`justify-between`, `:321`). |
| 76h | "remove all 33.3 mentions … Two month measurements are Standard Month (Gregorian) and Month • 30 day" | NOT DONE | The Unit select shows "per month (30.3̅ days)". The column header reads "PER MONTH (30.3̅ DAYS)". The Clock year card reads "Month 9 · 28 / 30.3̅". The chart top line reads "· 30.3̅ ·". The record's LENGTH column reads "30.3̅". Comments at `:181-185` and `:526-533` still use 30.3̅. |
| 76i | His answer: "switch to 30" (old 30.333-day entries) | NOT DONE | Both seeded deposits still show length 30.3̅. In MoT the span is "298.3475..1826 A-units", which is the 30.333-day span. |
| 76j | "non-Master needs 3 items / language / color / Atlantis Accords / Vision-2525 … Financial-2525 used non-Master settings wheel" | NOT DONE | The header gear opens the full Master "Moderator Settings": language, colour, Cost Estimate (1,000 users), Which AI writes, Voice-to-Text Provider, Cube Architecture, Language Lexicon, Atlantis Accords, Vision 2525 (`:600`). `moderator-settings.tsx` has no Master / non-Master variant. |
| 76/77 | "TRANSACTION RECORD" | DONE | `[data-fin-ledger]` summary. |
| 76 | "REAL-TIME FINANCIALS" | DONE | `[data-fin-chart]` header. |
| 76/79 | Directive: never outpace the deploy; AsM review before every push | DONE | `CLAUDE.md` lines 4-18. |
| 79 | "see discrepancies in LIVE vs cloude flare" | Related defect | The local build stamps "SHA 2ffb520" (r.040 bookkeeping) next to "v.000_r.041", but the r.041 code is commit `daace84`. The page names a SHA that does not hold its own code, so the operator cannot match the stamp to a commit. Cloudflare builds from the commit itself, so this may only happen locally; worth confirming. |

### (2) Broken or ugly at 390 px
- **Top status strip:** "Time: 10:53 CST" wraps, leaving "CST" alone on a second line (`ath0.png`, top).
- **Chart top line wraps:** two lines in Clock mode, three in MoT ("$320.00 · 298.3475..1826 A-units of the revolution · 2664.2473..2955 → 2963.2349..1181").
- **Chart date labels spill out:** the Clock-mode x-axis label "2026.10.31" ends at about 360 px, past the card's right border at about 352 px.
- **Rate is not level with the title:** the "Accrual Rate" label above $5.3908 pushes the figure about 7 px below "ACCRUAL UNITS" (image 09 asked for them on the same line).
- **Three heights on one row:** gear 32 px, /hr select 36 px, + Transaction 36 px.
- **Footer stamp wraps:** "v.000_r.041 · … · 2ffb520 ·" breaks, and the ◬♡웃 glyphs drop alone to a second line.
- **Stray ▶ at the bottom:** the folded Trinity is a ▶ with no label (`:589`), which looks like debris.
- **Budget Field picker is cut:** in edit mode it reads "Upside: Overtime / Bonus / Gifts / Ot" with no "…".
- **Overline drawn badly:** the overline on "30.3̅" sits misaligned in the mono column header and the chart top line.

### (3) Still not built at all
1. Header: globe first, settings to the right of it.
2. The mini Trinity logo (one-third size, no text, selected colour) replacing ◬ ♡ 웃, expanding to the full labelled wheel on tap.
3. The bottom Trinity removed.
4. A smaller header overall.
5. Accrual card line 1 = ACCRUAL UNITS (centred) · + Transaction (gear height) · gear; line 2 = Available · Accrual Rate.
6. The month law: 30-day "Month · 30 day" plus "Standard Month (Gregorian)", no 30.3̅ anywhere, old entries switched to 30, quarter = 3 × 30 + 1 down day.
7. Non-Master settings with exactly language/colour · Atlantis Accords · Vision-2525, used by Financial-2525.
8. The r.041 release note with before/after images.

## Enki

I ran the built `frontend/out` as-is: signed out, empty record, Earth and Mars, MoT on, the year card opened, the settings panel, and landscape at 844×390. Screenshots are in `/tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/asm041/`.

**(1) Where r.041 does not do what his words say** (lines are in `frontend/components/financial-2525/command-ux1.tsx`)

1. **Accrual Units card is laid out the other way round.**
   - His words: "switch Transaction button with Accrual rate and make same height as settings" (asked twice), "Line 1: Accrual Unit, +Transaction, Settings / Line 2: Available and accrual rate", and "make ACCRUAL UNITS CENTERED".
   - The page shows line 1 as the title on the left, then "Accrual Rate $5.3908 /hr", then the gear. Line 2 has Available on the left and + Transaction on the right, 36 px tall against the gear's 32 px.
   - The title is not centred.
   - Where: `[data-fin-accrual-top]` L319–336 and `[data-fin-tx-open]` L344.
2. **Header still has ◬ ♡ 웃 and settings is in the wrong place.**
   - His words: "replace ◬ ♡ 웃 with trinity logo (eithout any text) that is same color as selected color… 1/3rd size… when clicked, expand".
   - The page still shows the three glyphs, each a different colour (cyan, yellow, violet), whatever theme is chosen (L302 `<TrinityGlyphs>`).
   - His words: "move globe first and settings to right". The page shows the gear first, then the globe (L298–299).
   - His words: "the top takes up too much space; this is my third request". The header is unchanged in size: about 250 px at 390 px wide, and about 260 of the 390 px screen height in landscape, so the Accrual card barely appears before scrolling.
3. **The Trinity at the bottom is still there.**
   - His words: "cut Trinity icon way below".
   - A bare "▸" fold still sits above the footer (L578–584, `data-testid="fin-details-trinity"`). The footer line also still ends in ◬ ♡ 웃 (L588).
4. **30.3̅ is still on the page in many places.**
   - His words: "remove all 33.3 mentions / quarter is 91 days where 30 day is month… Two month measurements are Standard Month (Gregorian) and Month • 30 day", and "switch to 30".
   - Budget unit: the default option and the table column read "per month (30.3̅ days)" (lexicon key `fin.per_month`).
   - Year card on Clock: "Month 9 · 28 / 30.3̅". The month is still worked out as `monthDays = 91 / 3` (L530).
   - Chart top line: "· 30.3̅ ·" signed in, "· 30.333 ·" signed out, so the same value prints two different ways.
   - Record: the Length column reads "30.3̅" on both deposits (L519).
   - Length preset: "Monthly (30.3̅ days)" (`fin.rec.paymot`).
   - Nowhere does the page offer "Month • 30 day".
5. **MoT on still shows clock units.**
   - His answer: "Yes, everywhere on the page", i.e. MoT on means A.B..C only.
   - With MoT on, the Accrual gear menu still prints "$0.0898 /min · $0.0015 /sec" (L365), and the rate stays "$5.3908 /hr".
6. **Year card on MoT: the perihelion is written wrong.**
   - The plan (item 74) says "perihelion first as 0000.0000..0000". The page shows "0.0000..0000" (L538).
7. **Settings is the Master panel, not the non-Master one.**
   - His words: "non-Master needs 3 items / language / color / Atlantis Accords / Vision-2525. Make sure Financial-2525 used non-Master settings wheel".
   - The gear opens "Moderator Settings" with Language, Session Color Scheme, Cost Estimate (1,000 users) and Which AI writes (L594 `<ModeratorSettings>`). There is no Atlantis Accords and no Vision-2525.

**(2) Broken or ugly at 390 px, and other edge cases**

1. **Mars on Clock shows Earth's year.**
   - With Earth or Mars selected, the Clock rows read the same: "Day 271 / 365 · Quarter 3 · 89/91 · Year 2026 · SOURCED".
   - On Mars, MoT for the same card reads "1419/3600", about 39% through the year, while Clock says about 74%. The two views of one card contradict each other.
   - "SOURCED" sits directly above the note "declared, not sourced".
   - MoT on Mars also says "Revolution 2026", which is an Earth year number.
2. **Chart with MoT on is crowded.**
   - The tapped-point readout ("2812.1405..0621") prints between the chart and the five axis marks, so it reads as a sixth mark (L705).
   - The top line wraps to three lines.
3. **Text wraps and cuts at 390 px.**
   - The build strip at the top ("SHA … | Time: 10:53 CST") wraps, leaving "CST" alone on a second line.
   - The footer version line wraps, so ◬ ♡ 웃 drops to its own line, multicoloured and tiny.
4. **Signed out:**
   - There is no + Transaction button, so the top line is title, rate and gear only. That is acceptable, but it is a different layout from signed in.
   - "EXAMPLE · the operator's paycheck as data — sign in to record your own" appears twice, at the top and again in the sign-in box (L310 and L576).
   - The page is in cyan, not violet. That is expected under the theme auth guard, but captures of signed-out and signed-in pages will not match.
5. **Empty record:**
   - The chart is hidden, so the order runs Accrual, Budget, Record, Year with no "REAL-TIME FINANCIALS" section at all.
   - The budget still shows the sheet's example figures (Net −$183.84) as if they were this person's.
6. **Console errors on every load:** `<svg> attribute height: Expected length, "auto"` (L682, `height="auto"`) and one 404.
7. **Version stamp in the local build is not the r.041 commit.** The built page reads "v.000_r.041 · … · 2ffb520", but 2ffb520 is the r.040 bookkeeping commit; r.041 is daace84. `out/` was built at 15:58, before that commit. Any r.041 release image taken from this build carries the wrong SHA, which is exactly the kind of LIVE-vs-Cloudflare mismatch he is pointing at.
8. **No horizontal overflow** in any of the cases above (390 and 844 wide).

**(3) Still not built at all**

- The mini Trinity logo: one-third size, no text, in the selected colour, enlarging with labels on tap (addendum 78).
- A smaller header with globe first and settings on its right (addendum 76).
- The Accrual card's two-line layout with the title centred (addendum 76 and his answer).
- The month law: a month is 30 days, a quarter is 3 × 30 + 1 down day, "Standard Month" and "Month • 30 day" as the two months, and old entries switched to 30 (addendum 76).
- Removing the bottom Trinity (addendum 76).
- The non-Master settings panel with exactly three items (addendum 76).
- Clock-only rows in the Accrual gear (the either/or rule in his answer to addendum 73).
- The per-release notes and images for r.041 (addendum 71). I did not check whether they exist for r.041.

## Thoth

I checked the page against addenda 70–79. **r.041 is not ready for him to sign off.** Only the two header renames he asked for in addenda 76–77 are done. The card layout and header he asked for in addenda 76 and 78 are not built, and the 30-day month law is broken in every place that shows a time length. I captured the page at 390×844 with both seeded deposits through `frontend/scripts/fin-release-shots.mjs`. The screenshots are in `/tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/asm041/` (`r.999-after-{full,header,card,budget,chart,chartmot,ledger,yearclock,yearmot,gear}.png`).

**Data check (Thoth)**

The figures agree with each other, but on the wrong month length and with the chart showing only one deposit:
- **Card adds up.** In Escrow $3,847.46 + Released $77.03 = $3,924.49, which is $3,604.49 + $320. Available equals Released because Spent is $0. The gear's "$0.0898 /min · $0.0015 /sec" matches $5.3908/hr.
- **Rate uses 30.333 days, not 30.** $5.3908/hr = $3,924.49 ÷ (30.333 d × 24). He said "switch to 30"; on 30 days it would be **$5.4507/hr**. `fin.rec.paymot` is still "Monthly (30.3̅ days)" (`lib/lexicon-data.ts:3182`).
- **Budget is not his money.** It shows the sheet's sample plan: Income $2,941.41/month (the sheet's $3,200 per 33 days rescaled to 30.333 days), Fixed $2,527.78, Variable $597.47, **Net −$183.84** in red. His own deposits are $3,924.49 per month, which would make Net about **+$799**. The page says he is short when his record says he is not.
- **Chart shows only the $320 deposit.** Its top line reads "$320.00 · 30.3̅" and the curve is scaled to $320. Its Released curve at NOW is about $6.28, while the card above says $77. Cause: `focus = deposits[0]` (line 175) and `MotChart` draws one deposit (line 630).
- **MoT readings follow the same error.** The chart in MoT mode reads "298.3475..1826 A-units" because it uses 30.333 days. On 30 days it would be about 295.7 A.

**1. Where the page does not do what he said**

| His words | What the page shows | Where |
|---|---|---|
| 76: "move globe first and settings to right" | Settings is on the left, globe on the right | `command-ux1.tsx:298-299`, `[data-fin-topbar]` |
| 76: "get rid of ◬ ♡ 웃 … place smaller version of trinity above", and 78: "replace ◬ ♡ 웃 with trinity logo … 1/3rd size … when clicked, expand Trinity" | The ◬ ♡ 웃 row is still in the header at text-3xl. There is no mini Trinity and no tap to expand. | `:302` |
| 76: "cut Trinity icon way below" | The folded Trinity is still at the bottom, shown as a lone ▶ arrow | `:588-593`, `[data-testid=fin-details-trinity]` |
| 76: "entire header needs to be overall smaller" | Header is still about 160 px tall, unchanged | `header` |
| 76: "switch Transaction button with Accrual rate and make same height as settings" (said twice) | Accrual Rate is still on line 1 and + Transaction on line 2. The button is h-36, the gear h-32. | `:321-345` |
| 76 answer: "Line 1: Accrual Unit, +Transaction, Settings / Line 2: Available and accrual rate" | Line 1: ACCRUAL UNITS · Accrual Rate · gear. Line 2: Available · + Transaction. | `[data-fin-accrual-top]` |
| 76: "make ACCRUAL UNITS CENTERED" | The title is left-aligned (`justify-between`) | `:319-320` |
| 76: "$5.3908 needs to be same line as text to left (ACCRUAL UNITS)" | The figure sits under its "Accrual Rate" label and is not on the title's line | `[data-fin-rate-block]` |
| 76: "remove all 33.3 mentions … Month • 30 day" | "per month (30.3̅ days)" in the unit picker and column head; "30.3̅" in the chart line and the record's Length column; the year card shows "Month 9 · 28 / 30.3̅" | `lexicon-data.ts:3017`, `:3182`, `command-ux1.tsx:528,547`, `[data-fin-ledger]` |
| 76: "Two month measurements are Standard Month (Gregorian) and Month • 30 day" | "Standard Month" is there; the second option still reads "per month (30.3̅ days)" | `[data-fin-budget-unit]` |
| 76 answer: "switch to 30" (old entries) | Both seeded deposits record 30.3̅ | ledger, `fmtDays(motDays)` |
| 76: "non-Master needs 3 items … Financial-2525 used non-Master" | The full ModeratorSettings opens (`isPollingUser={false}`); there is no Master/non-Master variant | `:600` |
| 79: "test simulate and get feedback from AsM before … pushing" | r.041 (daace84) was pushed before this review | git log |

The year card's MoT mode is clean A.B..C. Its Clock mode has no A.B..C. Addendum 72 is met apart from the 30.3̅ month row.

**2. Broken or ugly at 390 px**
- **Chart dates clipped and flat.** The first date reads "026.10.01" and the last "2026.10.3", cut at both edges of the chart box. They also render flat (0°) instead of the 30° default, which is a bug: `Number(localStorage.getItem("fin-date-angle"))` turns an empty value into `0`, a valid angle, so the default is overwritten. Code at `:160`; see `r.999-after-chart.png`.
- **Chart frame and gridlines missing.** They use `stroke="var(--border)"`, which is not a valid colour here, so they don't draw (`:683-684,690`). The plot floats with no box.
- **Chart top line wraps** to two lines ("…· 30.3̅ ·" / "14 h 17 min elapsed"), `[data-fin-chart-line]`.
- **Footer wraps.** "◬ ♡ 웃" drops to its own second line (`:597`). The glyphs he asked to remove are still in the footer.
- **Orphan arrow.** The bare ▶ for the Trinity sits alone under Sign out with no label (`:589`).
- **Rate block is cramped.** "Accrual Rate" stacked over "$5.3908 [/hr ▾]" makes line 1 two rows tall. The /hr select (h-36) and the gear (h-32) don't line up.
- **Budget note wraps to three lines** ("Cash, investments, debts…") in the section he wants focused (`:480`).

**3. Not built at all**
1. The Trinity logo in the theme colour, one-third size, no text, tap to expand with labels (addendum 78).
2. Globe-first header order and a smaller header (addendum 76).
3. The 76-answer card layout: + Transaction on line 1 at the gear's height, title centred, Available and Accrual Rate on line 2.
4. The 30-day month everywhere, with old entries switched to 30. The quarter as 91 days = 3 × 30 + 1 down day: the year card still divides 91 by 3 (`:528`).
5. The non-Master settings with exactly three items: language/colour · Atlantis Accords · Vision-2525.
6. Removal of the bottom Trinity and the ◬ ♡ 웃 in the footer.
7. A chart and budget that use his record: all deposits, and Income from his deposits rather than the sample sheet.
