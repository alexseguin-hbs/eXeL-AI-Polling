# Sign Doc — two real phones, one document, no fees (live run, 2026-09-07)

**Ask (operator, 2026-09-07):** *before going into session, allow for 3 options … Sign Doc: user
uploads 1+ docs, places a signature, signs with the phone or uploads a signature, no fees; provides
email or phone for the next person, so after the first signature it goes to the next person.*

**What this run proves.** Two Chromium phones (375×812, touch). Phone A opens the ◬ ♡ 웃 landing,
taps **Sign Doc**, uploads a two-page promissory note (synthetic names), names itself and a second
signer (one e-mail, one phone), taps the page to place the box, draws a stroke, stamps, saves — and
is handed the second signer's link, prefilled into the phone's own text composer. Phone B opens
that link **with no account and no login**, sees that it is its turn, places, draws, stamps; the
envelope completes; the downloaded PDF carries **exactly two** signature images. A wrong secret
sees the masked roster and no file bytes.

**On real SQL.** The relay serves migration `036_sign_envelopes.sql` from a real Postgres (PGlite),
so the RPCs — not a mock — decided every step: create · get · sign · the baton (each signer's secret
minted at hand-off) · `not_your_turn` · `bad_secret` · stranger → masked, no files · replay refused ·
complete · revoke-after-complete refused. The hosted Supabase project still has to apply 036;
Auth0 login on the creator path is bypassed locally (`NEXT_PUBLIC_SIGN_NO_AUTH=1`) and is
**UNVERIFIED** until the operator signs in on the live site.

## Outcome — 18 steps, 0 failures

```
  5956ms  alex  OK  landing → Sign Doc
  6002ms  alex  OK  PDF uploaded, hashed, page-counted
  6120ms  alex  OK  two signers named (email + phone)
  7028ms  alex  OK  PDF page rendered (pdfjs)
  7045ms  alex  OK  signature box placed by tap
  7714ms  alex  OK  signature drawn with the pointer
  7884ms  alex  OK  Sign & save pressed
  7946ms  alex  OK  saved — hand-off link minted for Daniel  http://127.0.0.1:3210/soi-session/sign/?e=YAR0qnkqrBwd1oIs8e…
  7989ms  alex  OK  sms: composer prefilled to Daniel
 10054ms  alex  OK  a wrong secret sees no files and no turn  This link's secret does not match any signer of this document.
 12277ms  dan   OK  opened the hand-off link, no login
 12280ms  dan   OK  roster: Alex signed, Daniel now
 12338ms  dan   OK  PDF page rendered (pdfjs)
 12356ms  dan   OK  signature box placed by tap
 13028ms  dan   OK  signature drawn with the pointer
 13200ms  dan   OK  Sign & save pressed
 13232ms  dan   OK  COMPLETE — every signer has signed
 13314ms  dan   OK  downloaded PDF carries two signature images  SoISig count = 2
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
