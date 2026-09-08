# Sign Doc — two real phones, one document, no fees (live run, 2026-09-07)

**Ask (operator, 2026-09-07):** *before going into session, allow for 3 options … Sign Doc: user
uploads 1+ docs, places a signature, signs with the phone or uploads a signature, no fees; provides
email or phone for the next person, so after the first signature it goes to the next person.*

**What this run proves.** Two Chromium phones (375×812, touch). Phone A opens the ◬ ♡ 웃 landing,
taps **Sign Doc**, uploads a two-page promissory note (synthetic names), names itself and a second
signer (one e-mail, one phone), taps the page to place the box, draws a stroke, stamps, saves — and
is handed the second signer's link, prefilled into the phone's own text composer. Phone B opens
that link **with no account and no login**, sees that it is its turn, places, draws, stamps; the
envelope completes; the downloaded PDF carries **exactly two** signature images, **each on page 1 at
the tapped spot** (read back from the PDF). A vertical swipe over the page places nothing. A wrong
secret sees the masked roster and no file bytes. Alex reopens with **his own kept link** and finds the
completed document.

**On real SQL.** The relay serves migration `036_sign_envelopes.sql` from a real Postgres (PGlite),
so the RPCs — not a mock — decided every step: create · get · sign · the baton (each signer's secret
minted at hand-off) · every file's sha256 and the chain computed server-side from the stored bytes · `not_your_turn` · `bad_secret` · stranger → masked, no files · replay refused ·
complete · revoke-after-complete refused. The hosted Supabase project still has to apply 036;
Auth0 login on the creator path is bypassed locally (`NEXT_PUBLIC_SIGN_NO_AUTH=1`) and is
**UNVERIFIED** until the operator signs in on the live site.

## Outcome — 33 steps, 0 failures

```
  3408ms  alex  OK  landing → Sign Doc
  3447ms  alex  OK  PDF uploaded, hashed, page-counted
  3545ms  alex  OK  two signers named (email + phone)
  3934ms  alex  OK  PDF page rendered (pdfjs)
  3993ms  alex  OK  misplaced signature removed
  4010ms  alex  OK  signature box placed by tap
  4013ms  alex  OK  toolbar names the selected box
  4136ms  alex  OK  a swipe over the page places nothing
  4241ms  alex  OK  signature box resized by its corner  123→158 px
  4289ms  alex  OK  date mark added beside the signature
  4953ms  alex  OK  signature drawn with the pointer
  5158ms  alex  OK  Sign & save pressed
  5215ms  alex  OK  saved — hand-off link minted for Daniel  http://127.0.0.1:3210/soi-session/sign/?e=adJbekY6mqOt_k2AR2…
  5263ms  alex  OK  creator keeps his own return link
  5266ms  alex  OK  sms: composer prefilled to Daniel
  7402ms  alex  OK  a wrong secret sees no files and no turn  This link's secret does not match any signer of this document.
  9134ms  dan   OK  opened the hand-off link, no login
  9137ms  dan   OK  roster: Alex signed, Daniel now
  9199ms  dan   OK  PDF page rendered (pdfjs)
  9261ms  dan   OK  misplaced signature removed
  9275ms  dan   OK  signature box placed by tap
  9277ms  dan   OK  toolbar names the selected box
  9402ms  dan   OK  a swipe over the page places nothing
  9511ms  dan   OK  signature box resized by its corner  123→157 px
  9574ms  dan   OK  date mark added beside the signature
 10236ms  dan   OK  signature drawn with the pointer
 10447ms  dan   OK  Sign & save pressed
 10480ms  dan   OK  COMPLETE — every signer has signed
 10554ms  dan   OK  downloaded PDF carries two signature images  SoISig count = 2
 10559ms  dan   OK  each stamp sits on page 1 where ITS phone tapped, resized wider (distinct boxes)  [[1,0.1,0.71,0.51],[1,0.49,0.56,0.51]]
 10563ms  dan   OK  two date marks stamped (one per signer)  SoITxt count = 2
 10566ms  dan   OK  signatory block: two CAC-style timestamp rows, bottom-right of the last page  [[0,"2026-09-07T20:36:26.917Z","91d05b18"],[1,"2026-09-07T20:36:32.165Z","da5ede51"]]
 10993ms  alex  OK  creator reopens with his own link → COMPLETE, downloads offered
```

Reproduce: `cd frontend && npm run pod:relay` ·
`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:4999 NEXT_PUBLIC_SUPABASE_ANON_KEY=local NEXT_PUBLIC_SIGN_NO_AUTH=1 npx next dev -p 3210` ·
`npm run test:soi-sign-live`. Screenshots and the signed PDF are in `sign-live-run/` beside this file.

## What the operator does next
1. Apply `supabase/migrations/036_sign_envelopes.sql` in the Supabase SQL editor (idempotent).
2. Open https://exel-ai-polling.explore-096.workers.dev/soi-session/ → Sign Doc → upload the two
   Seguin / Vail PDFs → name yourself, then Daniel with his mobile or e-mail → place, draw, sign →
   tap **Send by text**. Daniel signs from the link; both of you download.

## Boundaries, said plainly
No e-mail or SMS is sent by the server (no carrier exists); the hand-off is your own composer. The
stamp records name, time, and a hash — a record, not a legal opinion on UETA/ESIGN. Files are held
as base64 in Postgres (3 MB each) behind default-deny RLS; `storage_url` is reserved for R2.

## Wave 3 — "I still cannot sign" (autonomous run, evening)

The operator, on his phone, reported that he still could not sign, with no screen to show. Wave 3 makes the
page diagnose itself and removes every way left to fail silently; the two-phone proof re-ran at **37/37**
(was 33) and the three-phone pod at **45/45**, over the same real SQL (migration 036 in PGlite).

**What changed**
- `Why can't I sign?` under the rail (`components/sign/sign-diag.tsx`): build SHA · storage mode · a live probe
  of the 036 RPC (`sign_envelope_get` with a nonsense token — a `bad_token` refusal proves the function exists,
  `PGRST202` proves the migration is missing) · the pdf worker (`HEAD /pdf.worker.min.mjs`) · the login state ·
  the step and its error — then one sentence saying what to do. Opens by itself on any error.
- Never silent: every catch names its step (`Opening: …`, `Stamping: …`, `Creating the document: …`,
  `Saving the signature: …`); every RPC is bounded to 45 s (`withTimeout`) and a 30-s watchdog says so while
  saving; a `timeout` is a named error, not a hang.
- Login at save, not before upload: the creator path is unguarded; with Auth0 configured, "Sign & save" keeps
  the draft (files, signers, boxes, stroke) in `sessionStorage["exel-sign-draft"]` and redirects; the draft
  comes back after the login (or a reload — proved in the run: reload mid-flow → draw step restored).
- Offline verify (`lib/sign-verify.ts` + the DONE block and the upload step): the four accounts a signed file
  carries (images, boxes, passes, timestamp rows) must agree, every later row must carry the chain it signed
  over, and the closing chain is recomputed; the downloaded proof PDF reads green, the unsigned fixture reads
  "no signatures" (6 unit cases, `tests/sign-verify.test.mjs`).
- Ten strings a countersigner reads first, in the 32 non-English lexicon languages
  (`lib/lexicon-translations-sign.ts`, parity gate `tests/sign-i18n.test.mjs`, 130 cases).

**The three sentences the live site can show (what each means)**
| Diag row `Sign backend` | Sentence | What it means for the operator |
|---|---|---|
| `answers — migration 036 is applied` | *Everything this page depends on answers. Upload, place, draw, then Sign & save.* | Two-signer hand-off works on the live site. |
| `migration 036 is NOT applied on this site's Supabase` | *Migration 036 is not applied on this site's Supabase — a hand-off link cannot be made until it is (supabase/migrations/036_sign_envelopes.sql). Signing alone on this phone still works.* | Apply 036 in the Supabase SQL editor; solo signing already works. |
| `unreachable from this phone` | *Supabase did not answer from this phone. Check the connection (Wi-Fi vs mobile data) and open this page again.* | Network, not the app. |

If the `Build` row shows an older SHA than the footer of the landing page, the phone is holding a cached
page — pull to refresh. "Copy this report" puts the six rows, the sentence and the user agent on the clipboard.

**Known red outside this scope:** `test:ci` was already failing at HEAD before this wave on two steps that are
not Sign Doc's — `test:vision-lexicon` had no package script (added now; 24/24) and `test:innovation-time`
fails four waterfall-geometry cases on the /innovation deck (untouched, out of scope, reported).

## Wave 4 — fit to the signature line · swipe to turn · iconology · "no one collects a tax on signatures"

Operator ask (persisted first, `docs/asks/2026-09-07_2140_sign_doc_underline_iconology.md`, sha256
d8f0f024…f393e8e). Two-phone proof **44/44**, three-phone pod **45/45**, scratch production build green.

- **The first box fits the rule under the thumb** (`lib/sign-fit.ts`, pure, 12 unit cases): on the rendered
  page's pixels — so a drawn rule, a run of underscores or a line in a scanned PDF all count — the nearest
  line within 6 % of the tap becomes the box's width; the top stops 2 px under the text above it (never
  taller than the bottom of that text; default height when nothing is above within 12 %); the bottom sits
  1 px above the rule. No line → the default box, as before. The page now renders at ≥ 2× so a 0.7-pt rule
  survives as ink on a 1× screen. Proof: Alex's box `x=[0.120–0.451]` on the lender's rule
  `[0.117–0.450]`, Daniel's `[0.500–0.832]` on the borrower's, both bottoms on the rule, height 0.035.
- **Go to next, reused (R-CORE):** a horizontal swipe on the PDF turns the page — the Divinity Guide reader's
  gesture (`onTouchStart`/`onTouchEnd`, ±50 px, never from inside a mark) — beside the ‹ › buttons; every
  "Next" button carries Vision 2525's `ArrowRight`, every "Back" a ‹.
- **Iconology:** the rail is one table (`lib/sign-steps.ts`, POD_PHASES shape) — ⤒ upload · 웃 signers ·
  ⌖ place · ✎ draw · ◬ sign · ♡ hand off · ✓ done (⤓ open for a countersigner), past steps ticked; the
  hand-off acts read 💬 / ✉ / ⧉; glyphs are `aria-hidden`, every label stays a `t()` key.
- **The stance,** first words of the page's footer, bold, in 33 languages: *No one collects a tax on
  signatures.* (`soi.sign.stance`, 11th seeded string; parity gate 130/130).

## Wave 5 — the scribble, shown

Operator: *have all AsM ensured signature works. Simulate placing some scribbled and show me result.*
The proof now scribbles like a thumb (three jittered strokes per phone, ink ≥ 1.5 % of the pad spanning
≥ 60 % of it), shows the stroke previewing inside the fitted box on the rule (`3b-preview-*.jpg`), and
renders the signed PDF to PNG through pdfjs in Chromium (`scripts/render-pdf-page.mjs`): `signed-page.png`,
`signed-block.png` (the two signature rows), `signed-codex.png` (the signatory block). **49 steps, 0
failures**, three consecutive runs; the twelve-master verification is in
`2026-09-07_signature_asm_verification.md`.

Looking at the render caught three defects the counters had passed, all fixed in this wave: the pad
exported its whole canvas so the stroke shrank to a third of the line (now the ink's bounding box); the
caption under the box landed on the name printed under the rule (on a fitted box the caption sits inside,
bottom-right, 5 pt, and the document's own rule is the line); `+ Date` dropped a 27-pt date over the
"Date:" line (it now snaps to that underline through the same pixel fit, 7 pt). Coming back from Draw also
opened page 1 while the box sat on page 2 — the view opens on the signed page now.
A fourth came from the independent agent's look at the render: the proof's corner drag pushed the fitted
box below its rule, so the caption grazed the printed name — a fitted box now grows in width only, its
bottom pinned to the rule, and − / + scale it about its bottom-left corner.

**Independent re-run (general-purpose agent, blind, final code):** "SIGN 2-PHONE LIVE RUN: 49 steps, 0
failures"; on `signed-block.png`: "Two dark hand-drawn zigzag scribbles sit on two horizontal rules under
Lender and Borrower headings; each Date: line carries Sep 7, 2026; small grey captions appear at right."
The proof's own finder also had to learn that Daniel's page already carries Alex's ink on the lender's
row — the borrower's rule is now found by row and column, not by the clean-pair shape (three consecutive
green runs after the change).

**23:05 ask, applied:** the digital signature (name · ISO time · #hash) now sits UNDER the physical scribble —
a 4.5-pt grey line just below the document's rule, starting where the ink starts — and the Light Codex 2×2
strips stay in the signatory block at the bottom-right of the last page. The proof runs with the operator's
contacts: creator `explore@eXeL-AI.com`, second signer `512.808.8745` — the sms: composer opens to
5128088745 with the default script and the link, the mailto: composer carries the same, the roster masks
both (`ex***@exel-ai.com` · `***8745`). **51 steps, 0 failures.** Real delivery to that inbox/phone cannot
be exercised from the sandbox (its proxy refuses every host); the phone's own composer is what sends the
text, and e-mail FROM eXeL needs `RESEND_API_KEY` + `NOTIFY_FROM` on the Worker (docs/DEPLOY_STRIPE.md
procedure) — without them the button falls back to the phone's mail app and says so.

## Wave 6 — the digital line always pairs; Light Codex of ALL signatories, unlocked by uploading the PDF

Operator (23:15): *the mini digital signature is perfect (MUST ALWAYS PAIR WITH PHYSICAL SIGNATURE). and have
light codex with all signatories that can be unlocked via upload feature of Light Codex. Also ensure PDF
uploads in addition to PNG is enabled for light codex decode feature.* **55 steps, 0 failures.**

- **Pairing, locked:** `stampSignature` always draws the digital line; the PDF-engine test and the live run
  now read the page text back (pdfjs) and require one "name · time · #hash" line per SoISig image, for
  default boxes and rule-fitted boxes alike (pdf-stamp 20/20; run: Alex ×1 · Daniel ×1).
- **Light Codex in the PDF, pixel for pixel** (`lib/codex-pdf.ts`): the signatory strips are embedded as
  raw DeviceRGB image XObjects named `SoICodexRow<n>` and `SoICodexAll` — no PNG round-trip, no canvas — and
  read back from the file's own bytes, never from a render. The ALL strip along the block's foot carries
  every signatory: `ALEX SEGUIN 20260907231800 . DANIEL VAIL 20260907231808` (9 unit cases, `tests/codex-pdf.test.mjs`).
- **PDF upload on the Light Codex page:** Decode accepts a PDF beside PNG; a PDF signed with eXeL lists the
  ALL strip first, then one strip per signatory, each reverse-verified (`6c-codex-pdf-dan.jpg`). An unsigned
  PDF says so. PNG decoding is unchanged.

**23:25 ask, applied:** the signatory block — CAC-style rows, the 2×2 Light Codex strip per signatory and the
ALL strip — is drawn on **every** page of the signed PDF, not only the last (`stampCodexBlock` loops the pages;
the keyword record stays one per row). Proof: 6 strips over 2 pages, every one reverse-verified; the Light
Codex page groups the same strip across pages ("p.1, 2"); `signed-codex-p1.png` shows page 1's block.
**57 steps, 0 failures.**

## Wave 7 — autonomous, while the 48-agent fleet runs: the fleet's first finding, the second way to sign, a scanned contract

- **No login loop while Auth0 hydrates** (a fleet specialist's finding, Krishna lens): Sign & save is disabled
  while the SDK is still loading after the redirect, and a tap then says so instead of redirecting again.
- **The uploaded-image way to sign, walked:** Daniel uploads a PNG of a stroke instead of drawing; the upload is
  trimmed to its ink before the hidden codex rows are written into it, so it stamps at the same size as a drawn
  one (first pass stamped it at a third — caught in the render). 57/57.
- **A scanned contract** (`scripts/sign-scan-run.mjs`, `npm run test:soi-sign-scan`): the signature page rendered,
  tilted 0.4°, laid on a grey ground and wrapped back into an image-only PDF — no text, no rules as objects. One
  signer uploads it, taps near the lender's line, and the box still fits the rule from pixels (bottom 0.554 vs
  0.556, width 0.33 = the whole run); the stamp sits on it in the file. The fit now follows a rule that drifts a
  row as it goes (sign-fit 13/13). 8 steps, 0 failures; `docs/assessments/sign-scan-run/`.
- `cacStamp` fixed-clock test (Odin).

**23:50 ask, applied:** every Light Codex strip in the signatory block is a **Single Helix, one line, 2×2 blocks**
— the framed, reversed line only; the strip image is exactly one block tall, so however it is drawn it is a
single line. The ALL strip runs along the block's foot, blocks kept near-square; each row's strip is a 30-pt
line beside its timestamp. Decoder unchanged (Single Helix is detected by the bottom-right frame). 57/57;
codex-pdf 11/11.

## Wave 8 — the live test round (operator, 18:34–18:43 CST, on 94e63b5)

Six asks, all applied; proofs: two-phone 57/57 · **offline hand-off 12/12 (new)** · scan 8/8 · pod 45/45.

- **Download without Supabase.** On the live site two signers were named, the create was refused (036 missing)
  and nothing was saved — so nothing to download. Now the refusal is BY NAME (`no_migration` when Supabase
  answers but 036 is missing; `no_backend` when there is no Supabase) and the envelope stays on the phone: the
  partly-signed PDF is offered for download with a file-hand-over script (💬 / ✉), the next signer uploads that
  FILE, signs alone, and the final PDF carries both signatures, both digital lines, both names in the signatory
  block (the keyword now carries the name) and in the Light Codex ALL strip. `scripts/sign-offline-run.mjs`
  blocks the create RPC with PostgREST's "function not found" — the hosted site's exact answer — and walks it.
- **Vision 2525's download pill** (↓, uppercase, rounded, the theme hue) on every download.
- **The date auto-fits its box** in the preview (container-query font size), as the stamp already did.
- **Glyph heights measured, not eyeballed:** ◬ ♡ 웃 ink was 21.5 / 21.5 / 27.5 px at different tops; now
  24 / 23.75 / 23.75 px, all at one top edge (scratch `glyph-measure.mjs`, 4× screenshot, hue-classified pixels).
- **No glyphs inside the rings** on the landing.
- **Light Codex ALL strip at the very bottom-right of every page** (4 pt from the edges), below the block.

**00:10 ask, applied — initials:** every signatory's initials ("AS   DV", from the names, letters only, at most
three per person, in signing order) are stamped at the bottom-right of EVERY page, between the signatory block
and the Light Codex strip, redrawn each pass, and recorded once as a keyword (`SoIInit:AS+DV`). Proof: the page
text carries them on every page (2/2) in the two-phone run; codex-pdf 14/14.

**00:15 ask, applied — "fix after download enabled":** the one fix left on the live site is applying migration
036 on the hosted Supabase, which only the operator can do. The "Why can't I sign?" panel now says signing and
download already work, and offers **the fix from the phone**: Copy migration 036 SQL (served at
`/sql/036_sign_envelopes.sql`, copied into `public/` at predev/prebuild) → Supabase → SQL editor → Run → reload.
The offline proof blocks the probe too and asserts the block, the served SQL (20 kB, holds the create
function) — 13 steps, 0 failures. The sentence is updated in the 32 seeded languages.

**00:25 ask, applied — resize from the upper-right:** the handle sits at the box's upper-right; a drag grows the box
up and right and the bottom edge (the signature's baseline) never moves; − / + scale about the bottom-left corner
for the same reason. Proof: 103×14 → 112×17 px with the bottom at 478 → 478. Two-phone 58/58, offline 13/13.

**00:40 ask, applied — delete:** the selected box carries a red ✕ badge at its upper-left (44-px target) that removes
it in one tap, and the toolbar's ✕ is now a labelled red "Delete". Proof: an accidental date deleted by the badge on
both phones; 64/64.

**00:45 ask, applied — no box; hidden Light Codex on the bottom edge:** the "Signatories — digital timestamps" box is
gone (the digital line already sits under each physical signature). Every page keeps the initials at the
bottom-right and now carries the Light Codex of ALL signatories as the **Hidden Helix** on its very bottom edge — a
1-px forward line over a 1-px reversed line, right-aligned, no frame, 1 px = 1 pt, exactly as a Light Codex PNG
carries it: invisible on the page, read back pixel-for-pixel by Light Codex → Decode ("Hidden Helix · 1×1"). The
signatory rows stay in the keywords. Two-phone 64/64 · offline 13/13 · scan 8/8 · codex-pdf 13/13.

## Wave 9 — physical initials in a clear spot; three placeholders for the second signatory (operator 00:50)

- **Initials are drawn**, on a second pad after the signature, and stamped as the signer's own image in its slot at
  the bottom-right of every page, in signing order. The slot row is chosen from the page's pixels
  (`lib/sign-layout.ts` initialsSlotTop): under the lowest ink in the right column when there is room, else the
  lowest clear gap above it — never over text (7 unit cases). Unfilled slots are dotted "Initial" placeholders,
  cleared when that signer initials.
- **Three placeholders** for the next signer after the first signs: signature on the OTHER party's line of the same
  row (`partnerRule`, from pixels), date on that party's Date line, initial in the next slot. Recorded as `SoIHold`
  keywords with the name; the next signer's page opens with the marks already placed (countersign link or the
  hand-carried file alike), and the real marks clear the dotted boxes when they land.
- Proof: two-phone run — Daniel lands on the borrower line (x 0.500, same row as Alex), both signers' drawn initials
  on both pages, no placeholder text left; offline hand-off 13/13 (Daniel lands on the placeholders in the uploaded
  file); scan 8/8; pod 45/45; codex-pdf 17/17; sign-layout 7/7.

**01:10 ask, applied — the file travels with the message:** mailto:/sms: links cannot attach a file; the phone's share
sheet can. The offline hand-off has one action, "Send the file by text or e-mail" (📎), which hands the partly-signed
PDF to Messages or Mail with the script as its text (Web Share with files, iOS 15+ / Android). Where no share sheet
exists the file downloads and the composer opens with the script, and the page says so. DONE offers "Send the signed
file" the same way. The script no longer says "attached" with nothing attached. Offline proof: the shared file is the
one Daniel uploads — 13/13.

## Wave 10 — the 48-agent fleet's hour-or-less findings, applied (01:20 UTC)

Report: `2026-09-08_fleet_48_report.md` (11 of 12 MoTs READY within the proven boundary; 7 AsMs yes, 5 partly).
- **Non-Latin names no longer crash the stamp** (fleet #1): every drawn string passes `pdfSafe` — Latin-1 kept, accents
  folded where the font lacks them, the rest a middle dot; the Unicode name rides in the keywords and the Light Codex.
  Five non-Latin signers stamp in the PDF-engine test (24/24). A bundled Unicode font is the day-sized follow-up.
- Dates in Latin digits; the "Signer N" fallback through the lexicon.
- The diagnosis probe says **unreachable** on a dead network instead of "036 applied"; a retry after a half-landed save
  mints a fresh token instead of a duplicate-key error.
- `/api/notify` is no longer a relay: the Worker composes subject and text from who · what · link, and throttles per
  address (notify-core 10/10).
- Proofs re-run: two-phone, offline, pod; build green.
