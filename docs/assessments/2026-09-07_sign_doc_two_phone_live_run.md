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

## Outcome — 32 steps, 0 failures

```
  3675ms  alex  OK  landing → Sign Doc
  3715ms  alex  OK  PDF uploaded, hashed, page-counted
  3844ms  alex  OK  two signers named (email + phone)
  4244ms  alex  OK  PDF page rendered (pdfjs)
  4295ms  alex  OK  misplaced signature removed
  4311ms  alex  OK  signature box placed by tap
  4313ms  alex  OK  toolbar names the selected box
  4437ms  alex  OK  a swipe over the page places nothing
  4543ms  alex  OK  signature box resized by its corner  123→158 px
  4595ms  alex  OK  date mark added beside the signature
  5257ms  alex  OK  signature drawn with the pointer
  5432ms  alex  OK  Sign & save pressed
  5530ms  alex  OK  saved — hand-off link minted for Daniel  http://127.0.0.1:3210/soi-session/sign/?e=JIP8cme5_f8aDHWRN3…
  5581ms  alex  OK  creator keeps his own return link
  5585ms  alex  OK  sms: composer prefilled to Daniel
  7437ms  alex  OK  a wrong secret sees no files and no turn  This link's secret does not match any signer of this document.
  9745ms  dan   OK  opened the hand-off link, no login
  9747ms  dan   OK  roster: Alex signed, Daniel now
  9822ms  dan   OK  PDF page rendered (pdfjs)
  9880ms  dan   OK  misplaced signature removed
  9896ms  dan   OK  signature box placed by tap
  9898ms  dan   OK  toolbar names the selected box
 10020ms  dan   OK  a swipe over the page places nothing
 10129ms  dan   OK  signature box resized by its corner  123→157 px
 10196ms  dan   OK  date mark added beside the signature
 10855ms  dan   OK  signature drawn with the pointer
 11066ms  dan   OK  Sign & save pressed
 11098ms  dan   OK  COMPLETE — every signer has signed
 11174ms  dan   OK  downloaded PDF carries two signature images  SoISig count = 2
 11178ms  dan   OK  each stamp sits on page 1 where ITS phone tapped, resized wider (distinct boxes)  [[1,0.1,0.71,0.51],[1,0.49,0.56,0.51]]
 11183ms  dan   OK  two date marks stamped (one per signer)  SoITxt count = 2
 11607ms  alex  OK  creator reopens with his own link → COMPLETE, downloads offered
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
